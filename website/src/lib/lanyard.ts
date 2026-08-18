// Isomorphic half of the Lanyard integration: types, labels, and the one
// raw -> rendered mapping. Imported by both the server-side socket
// (lanyard-server.ts) and the browser island (DiscordStatus.tsx), so it must
// stay free of node/bun imports and side effects.

// The shape Lanyard puts in `message.d` — only the fields we actually read.
export interface RawLanyard {
    discord_status?: string;
    listening_to_spotify?: boolean;
    spotify?: {
        track_id: string;
        song: string;
        artist: string;
        album: string;
        album_art_url: string;
        // Absolute epoch ms. Present whenever Spotify is actually playing, but
        // typed optional because a frame that arrives mid-transition can omit it.
        timestamps?: { start: number; end: number };
    } | null;
    activities?: Array<{
        type: number;
        name: string;
        state?: string;
    }>;
}

export type PresenceStatus = "online" | "idle" | "dnd" | "offline";

// Everything the UI renders, and nothing else. This is the exact payload
// serialized into the island's props, so keeping it narrow keeps the HTML
// small and makes the SSR -> hydration contract impossible to drift.
export interface PresenceSnapshot {
    status: PresenceStatus;
    spotify: {
        trackId: string;
        song: string;
        artist: string;
        album: string;
        albumArt: string;
        // Absolute epoch ms, never a precomputed elapsed: this snapshot is
        // serialized into the HTML and then ticked against the visitor's clock,
        // so anything relative would be stale the moment it was written.
        startedAt: number | null;
        endsAt: number | null;
    } | null;
    playing: Array<{ name: string; state: string | null }>;
}

// Playful labels for each Discord presence state. Shared with the SSH banner
// so the two surfaces can't word the same state differently.
export const PRESENCE_LABELS: Record<PresenceStatus, string> = {
    online: "online, apparently",
    idle: "back in a bit",
    dnd: "locked in",
    offline: "touching grass",
};

// What we render before the first Lanyard frame, or when Lanyard is
// unreachable. A real snapshot rather than null, so the Status row is always
// in the server-rendered HTML at a known width and nothing appears late.
export const OFFLINE_SNAPSHOT: PresenceSnapshot = {
    status: "offline",
    spotify: null,
    playing: [],
};

// "1:23" — minutes are never padded, seconds always are, which is how every
// music player on earth writes a position. Hours are folded into the minutes
// rather than getting their own field; nothing on Spotify runs that long, and
// a "0:63:12" would be worse than a "63:12" if something ever did.
export const formatTrackTime = (ms: number): string => {
    const total = Math.floor(Math.max(0, ms) / 1000);
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

/**
 * "(1:23 / 3:52)", or null when Lanyard gave us no timestamps to work with —
 * the row then renders the track without a counter rather than "NaN:NaN".
 *
 * `now` is the visitor's clock, which is the only clock available once the
 * page is live. That clock can be minutes off, so elapsed is clamped into the
 * track: an unclamped counter would otherwise count backwards from a negative
 * number, or sail past the song's own length.
 */
export function formatTrackProgress(
    startedAt: number | null,
    endsAt: number | null,
    now: number,
): string | null {
    if (startedAt === null || endsAt === null) return null;

    const duration = endsAt - startedAt;
    if (duration <= 0) return null;

    const elapsed = Math.min(Math.max(now - startedAt, 0), duration);
    return `(${formatTrackTime(elapsed)} / ${formatTrackTime(duration)})`;
}

const isStatus = (s: unknown): s is PresenceStatus =>
    s === "online" || s === "idle" || s === "dnd" || s === "offline";

// The single mapping used by the server socket, the REST cold-start, and the
// client socket — so a live update can never render differently from the
// version that arrived with the HTML.
export function toSnapshot(d: RawLanyard | null | undefined): PresenceSnapshot {
    if (!d) return OFFLINE_SNAPSHOT;

    // Lanyard joins collaborating artists with "; " — we only show the first.
    const artist = d.spotify?.artist ?? "";
    const cut = artist.indexOf(";");

    return {
        status: isStatus(d.discord_status) ? d.discord_status : "offline",
        spotify:
            d.listening_to_spotify && d.spotify
                ? {
                      trackId: d.spotify.track_id,
                      song: d.spotify.song,
                      artist: cut === -1 ? artist : artist.slice(0, cut),
                      album: d.spotify.album,
                      albumArt: d.spotify.album_art_url,
                      startedAt: d.spotify.timestamps?.start ?? null,
                      endsAt: d.spotify.timestamps?.end ?? null,
                  }
                : null,
        // Type 2 is "Listening", which is Spotify duplicated into the activity
        // list — it has its own row above.
        playing: (d.activities ?? [])
            .filter((a) => a.type !== 2 && a.name !== "Spotify")
            .map((a) => ({ name: a.name, state: a.state || null })),
    };
}
