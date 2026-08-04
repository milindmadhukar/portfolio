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
    spotify: { trackId: string; song: string; artist: string } | null;
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
                  }
                : null,
        // Type 2 is "Listening", which is Spotify duplicated into the activity
        // list — it has its own row above.
        playing: (d.activities ?? [])
            .filter((a) => a.type !== 2 && a.name !== "Spotify")
            .map((a) => ({ name: a.name, state: a.state || null })),
    };
}
