import { useEffect, useState, useRef } from "react";
import {
  toSnapshot,
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
}

const STATUS_COLOR: Record<PresenceStatus, string> = {
  online: "text-ctp-green",
  idle: "text-ctp-yellow",
  dnd: "text-ctp-red",
  offline: "text-ctp-overlay1",
};

export default function DiscordStatus({
  userId,
  socketUrl,
  initialData,
}: DiscordStatusProps) {
  // Seeded directly, never in an effect — an effect would render the fallback
  // first and mismatch the server's HTML.
  const [presence, setPresence] = useState<PresenceSnapshot>(
    initialData ?? OFFLINE_SNAPSHOT
  );
  const socketRef = useRef<WebSocket | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
          >
            {spotify.song}
            <span> by {spotify.artist}</span>
          </a>
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
