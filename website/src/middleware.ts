import { defineMiddleware } from "astro:middleware";
import { ensureLanyard } from "./lib/lanyard-server";

// Open the process-wide Lanyard socket on the first inbound request rather
// than at import time, so `astro build` never dials out. ensureLanyard() is
// idempotent and returns immediately — it starts the connection, it doesn't
// wait for it.
export const onRequest = defineMiddleware(async (_ctx, next) => {
    ensureLanyard();
    const res = await next();

    // Every page is rendered per request and bakes live values into the HTML —
    // last commit, Discord presence, uptime. Without this the responses carry
    // no cache headers at all, so a browser is free to heuristically reuse a
    // page and show a "2 minutes ago" that was true a day ago.
    if (res.headers.get("content-type")?.includes("text/html")) {
        res.headers.set("cache-control", "no-store");
    }

    return res;
});
