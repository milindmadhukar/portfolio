// One Lanyard socket per server process, not one per visitor.
//
// The presence snapshot is kept warm in memory so SSR can render the Discord /
// Spotify rows into the initial HTML instead of letting them pop in a second
// after hydration. The browser island still opens its own socket and takes
// over for live updates once it mounts — this only exists to make the *first*
// paint complete.
//
// Server-only: never import this from a component that ships to the client.

import { DISCORD_ID } from "./constants";
import {
    toSnapshot,
    OFFLINE_SNAPSHOT,
    type PresenceSnapshot,
    type RawLanyard,
} from "./lanyard";

type Timer = ReturnType<typeof setTimeout>;

interface Hub {
    snapshot: PresenceSnapshot | null;
    ws: WebSocket | null;
    heartbeat: Timer | null;
    watchdog: Timer | null;
    retry: Timer | null;
    attempts: number;
    started: boolean;
    first: Promise<void> | null;
    resolveFirst: (() => void) | null;
}

// Timers must never be the reason the process stays alive; the HTTP server
// already owns that.
const unref = (t: Timer) => (t as unknown as { unref?: () => void }).unref?.();

// Pinned on globalThis rather than module scope: Vite invalidates the SSR
// module graph on every edit in `astro dev`, which would otherwise leak a
// fresh socket on every save.
const HUB_KEY = "__milind_dev_lanyard_hub__";
const store = globalThis as unknown as Record<string, Hub | undefined>;

const hub: Hub = (store[HUB_KEY] ??= {
    snapshot: null,
    ws: null,
    heartbeat: null,
    watchdog: null,
    retry: null,
    attempts: 0,
    started: false,
    first: null,
    resolveFirst: null,
});

const socketUrl = () => process.env.LANYARD_SOCKET_URL ?? "";

// A self-hosted Lanyard serves REST from the same origin as its socket:
//   wss://lanyard.example/socket -> https://lanyard.example/v1/users/:id
const restUrl = () => {
    if (process.env.LANYARD_API_URL) {
        return `${process.env.LANYARD_API_URL.replace(/\/$/, "")}/v1/users/${DISCORD_ID}`;
    }
    try {
        const u = new URL(socketUrl());
        u.protocol = u.protocol === "wss:" ? "https:" : "http:";
        u.pathname = `/v1/users/${DISCORD_ID}`;
        u.search = "";
        return u.toString();
    } catch {
        return `https://api.lanyard.rest/v1/users/${DISCORD_ID}`;
    }
};

function publish(raw: RawLanyard | null) {
    hub.snapshot = toSnapshot(raw);
    hub.attempts = 0;
    hub.resolveFirst?.();
    hub.resolveFirst = null;
}

// Open the process-wide socket. Idempotent, non-blocking, and safe to call on
// every request. Lazy by design: nothing dials out at import time, so a build
// that merely bundles this module never opens a connection.
export function ensureLanyard() {
    if (hub.started) return;
    if (!socketUrl() || process.env.LANYARD_DISABLED === "1") return;

    hub.started = true;
    hub.first = new Promise<void>((resolve) => {
        hub.resolveFirst = resolve;
    });

    // Race a plain GET against the socket handshake, so a cold start is warm
    // after one round trip instead of waiting on Hello -> Initialize -> INIT_STATE.
    primeFromRest();
    connect();
}

async function primeFromRest() {
    try {
        const res = await fetch(restUrl(), { signal: AbortSignal.timeout(2500) });
        if (!res.ok) return;
        const body = await res.json();
        // Only fill a gap — never clobber a snapshot the socket already delivered.
        if (!hub.snapshot && body?.data) publish(body.data as RawLanyard);
    } catch {
        // The socket is the real source of truth; this was only a head start.
    }
}

function connect() {
    if (hub.retry) {
        clearTimeout(hub.retry);
        hub.retry = null;
    }

    let ws: WebSocket;
    try {
        ws = new WebSocket(socketUrl());
    } catch {
        scheduleReconnect();
        return;
    }
    hub.ws = ws;

    ws.onmessage = (event) => {
        let msg: any;
        try {
            msg = JSON.parse(String(event.data));
        } catch {
            return;
        }

        armWatchdog();

        if (msg.op === 1) {
            // Hello: start heartbeating, then subscribe.
            const interval: number = msg.d?.heartbeat_interval ?? 30_000;
            if (hub.heartbeat) clearInterval(hub.heartbeat);
            hub.heartbeat = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ op: 3 }));
            }, interval);
            unref(hub.heartbeat);

            ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: DISCORD_ID } }));
            armWatchdog(interval * 2.5);
        } else if (msg.op === 0 && (msg.t === "INIT_STATE" || msg.t === "PRESENCE_UPDATE")) {
            publish(msg.d as RawLanyard);
        }
    };

    ws.onerror = () => {
        try {
            ws.close();
        } catch {
            /* onclose still runs the reconnect */
        }
    };

    ws.onclose = () => {
        if (hub.heartbeat) clearInterval(hub.heartbeat);
        hub.heartbeat = null;
        if (hub.watchdog) clearTimeout(hub.watchdog);
        hub.watchdog = null;
        if (hub.ws === ws) hub.ws = null;
        scheduleReconnect();
    };
}

// A socket can go silent without ever firing `close` — a NAT or proxy drops
// the flow and we sit there holding a dead handle. If nothing arrives within
// 2.5 heartbeat intervals, tear it down so the normal reconnect path runs.
function armWatchdog(ms = 75_000) {
    if (hub.watchdog) clearTimeout(hub.watchdog);
    hub.watchdog = setTimeout(() => {
        try {
            hub.ws?.close();
        } catch {
            /* ignore */
        }
    }, ms);
    unref(hub.watchdog);
}

function scheduleReconnect() {
    if (hub.retry) return;
    const backoff = Math.min(30_000, 1_000 * 2 ** hub.attempts++);
    hub.retry = setTimeout(() => {
        hub.retry = null;
        connect();
    }, backoff + Math.random() * 500);
    unref(hub.retry);
}

/**
 * The presence to render, for SSR. Returns a real snapshot always — a stale
 * one if the socket dropped, the offline one if Lanyard was never reachable —
 * so a page render can never be blocked or broken by presence being down.
 */
// The wait only ever happens on the first request after a process start, and
// only until the REST prime lands (~450ms against api.lanyard.rest). Budget
// enough to cover that comfortably: paying it once buys a complete first
// paint, where giving up early would render "offline" and let the client
// island correct it a second later — the exact pop-in this is here to remove.
export async function getPresence(timeoutMs = 1200): Promise<PresenceSnapshot> {
    ensureLanyard();

    // The normal path once warm: no awaiting at all.
    if (hub.snapshot) return hub.snapshot;

    if (hub.first) {
        await Promise.race([
            hub.first,
            new Promise((resolve) => setTimeout(resolve, timeoutMs)),
        ]);
    }

    return hub.snapshot ?? OFFLINE_SNAPSHOT;
}
