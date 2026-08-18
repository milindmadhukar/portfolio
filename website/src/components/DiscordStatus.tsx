import { useCallback, useEffect, useState, useRef } from "react";
import {
  toSnapshot,
  formatTrackProgress,
  PRESENCE_LABELS,
  OFFLINE_SNAPSHOT,
  type PresenceSnapshot,
  type PresenceStatus,
} from "../lib/lanyard";

interface DiscordStatusProps {
  userId: string;
  socketUrl: string;
  // The snapshot the server already had when it rendered this page. Seeding
  // state with it means the hydrated markup matches the SSR'd markup exactly,
  // so nothing appears — or re-widths the column — after hydration.
  initialData: PresenceSnapshot | null;
  // The server's clock at render time. The track counter is derived from
  // `now - startedAt`, so computing `Date.now()` here on the first client
  // render would land a second off the HTML and make React patch the text.
  // Hydrating from the server's instant keeps the two identical; the first
  // interval tick, a second later, swaps over to the real client clock.
  serverNow: number;
}

const STATUS_COLOR: Record<PresenceStatus, string> = {
  online: "text-ctp-green",
  idle: "text-ctp-yellow",
  dnd: "text-ctp-red",
  offline: "text-ctp-overlay1",
};

// The album art is square, so this is both its width and its height. Hardcoded
// rather than measured because the flip math below runs on every mousemove and
// a getBoundingClientRect() there would be a layout read per frame. Keep in
// sync with the `w-44 h-44` on the card.
const CARD_SIZE = 176;
// How far the card sits from the cursor, and how far it is inset when it has
// been pushed off an edge.
const CARD_OFFSET = 20;

export default function DiscordStatus({
  userId,
  socketUrl,
  initialData,
  serverNow,
}: DiscordStatusProps) {
  // Seeded directly, never in an effect — an effect would render the fallback
  // first and mismatch the server's HTML.
  const [presence, setPresence] = useState<PresenceSnapshot>(
    initialData ?? OFFLINE_SNAPSHOT
  );
  const [now, setNow] = useState(serverNow);
  const [artVisible, setArtVisible] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const artRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!userId || !socketUrl) return;

    let isMounted = true;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      if (!isMounted) return;

      const ws = new WebSocket(socketUrl);
      socketRef.current = ws;

      ws.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const message = JSON.parse(event.data);

          switch (message.op) {
            case 1: // Hello
              const { heartbeat_interval } = message.d;
              if (heartbeatIntervalRef.current)
                clearInterval(heartbeatIntervalRef.current);

              heartbeatIntervalRef.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ op: 3 }));
                }
              }, heartbeat_interval);

              // Send Initialize immediately after Hello
              ws.send(
                JSON.stringify({
                  op: 2,
                  d: {
                    subscribe_to_id: userId,
                  },
                })
              );
              break;

            case 0: // Event
              if (message.t === "INIT_STATE" || message.t === "PRESENCE_UPDATE") {
                // Same mapping the server used, so a live update can't render
                // differently from the version that shipped with the HTML.
                setPresence(toSnapshot(message.d));
              }
              break;
          }
        } catch (e) {
          console.error("Lanyard parse error:", e);
        }
      };

      ws.onclose = () => {
        if (heartbeatIntervalRef.current)
          clearInterval(heartbeatIntervalRef.current);

        if (isMounted) {
          reconnectTimeout = setTimeout(connect, 5000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeout);
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [userId, socketUrl]);

  const { spotify, playing } = presence;
  const albumArt = spotify?.albumArt;
  const hasTrack = spotify !== null;

  // Tick the position counter, the same once-a-second cadence the Uptime row
  // runs at. Keyed on whether anything is playing, so a paused Spotify leaves
  // no timer behind. The immediate setNow() corrects the SSR/client clock gap
  // the moment we're past hydration, where it can no longer cause a mismatch.
  useEffect(() => {
    if (!hasTrack) return;

    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [hasTrack]);

  // Warm the album art in the HTTP cache as soon as we know the track, and
  // again on every change of track — so the hover card paints instantly
  // instead of showing an empty box while i.scdn.co is fetched.
  useEffect(() => {
    if (!albumArt) return;

    const img = new Image();
    img.src = albumArt;
  }, [albumArt]);

  // Written straight to the node rather than held in state: this runs on every
  // pointer move, and a setState there would re-render the whole island a
  // hundred times a second.
  const placeArt = useCallback((x: number, y: number) => {
    const card = artRef.current;
    if (!card) return;

    let left = x + CARD_OFFSET;
    let top = y + CARD_OFFSET;

    // Flip to the other side of the cursor near an edge, then clamp, so the
    // card is never clipped by the viewport.
    if (left + CARD_SIZE > window.innerWidth) left = x - CARD_SIZE - CARD_OFFSET;
    if (top + CARD_SIZE > window.innerHeight) top = y - CARD_SIZE - CARD_OFFSET;
    if (left < 0) left = CARD_OFFSET;
    if (top < 0) top = CARD_OFFSET;

    card.style.transform = `translate3d(${left}px, ${top}px, 0)`;
  }, []);

  // The listener only exists while the card is up. Bound to the document
  // rather than the link so the card keeps following the cursor through the
  // gaps between the inline spans.
  useEffect(() => {
    if (!artVisible) return;

    const onMove = (e: MouseEvent) => placeArt(e.clientX, e.clientY);
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, [artVisible, placeArt]);

  // A track change while the card is up would otherwise leave the old art
  // hanging under the cursor.
  useEffect(() => setArtVisible(false), [albumArt]);

  const handleArtEnter = (e: React.MouseEvent) => {
    // Both terminals are server-rendered and one is merely hidden by
    // breakpoint, so this island exists twice per page — and on a touch device
    // neither instance should raise a card at all.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    // Position from the entering event, so the card never flashes at 0,0
    // waiting for the first mousemove.
    placeArt(e.clientX, e.clientY);
    setArtVisible(true);
  };

  const progress = spotify
    ? formatTrackProgress(spotify.startedAt, spotify.endsAt, now)
    : null;

  return (
    <div className="flex flex-col gap-[2px]">
      {/* Always rendered, so the row can never be the thing that appears late. */}
      <div className="term-row">
        <span className="text-ctp-blue">
          <i className="nf nf-md-discord"></i> Status
        </span>
        <span> : </span>
        <span className={STATUS_COLOR[presence.status]} title={presence.status}>
          {PRESENCE_LABELS[presence.status]}
        </span>
      </div>

      {spotify && (
        <div className="term-row">
          <span className="text-ctp-mauve">
            <i className="nf nf-fa-spotify"></i> Listening to
          </span>
          <span> : </span>
          <a
            href={`https://open.spotify.com/track/${spotify.trackId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline hover:text-ctp-mauve transition-colors"
            onMouseEnter={handleArtEnter}
            onMouseLeave={() => setArtVisible(false)}
          >
            {spotify.song}
            <span> by {spotify.artist}</span>
          </a>
          {/* Outside the anchor deliberately: it is not part of the link's
              accessible name, and a name that rewrites itself every second is
              a screen reader read aloud on a loop. */}
          {progress && <span className="text-ctp-overlay1"> {progress}</span>}
        </div>
      )}

      {spotify && (
        // Fixed and transform-positioned, so it is out of flow entirely and
        // cannot shift the info column. Opacity-only transition: this is
        // chrome, not terminal output, so it has no business sweeping.
        <div
          ref={artRef}
          aria-hidden="true"
          className={`fixed left-0 top-0 z-50 p-1 rounded-lg bg-ctp-surface0 border border-ctp-surface2 shadow-lg pointer-events-none transition-opacity duration-200 ${
            artVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={spotify.albumArt}
            alt=""
            width={CARD_SIZE}
            height={CARD_SIZE}
            className="w-44 h-44 rounded object-cover"
          />
        </div>
      )}

      {playing.map((activity, index) => (
        <div key={index} className="term-row">
          <span className="text-ctp-yellow">
            <i className="nf nf-md-controller_classic"></i> Playing
          </span>
          <span> : {activity.name}{activity.state ? ` (${activity.state})` : ''}</span>
        </div>
      ))}
    </div>
  );
}
