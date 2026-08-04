import { defineMiddleware } from "astro:middleware";
import { ensureLanyard } from "./lib/lanyard-server";

// Open the process-wide Lanyard socket on the first inbound request rather
// than at import time, so `astro build` never dials out. ensureLanyard() is
// idempotent and returns immediately — it starts the connection, it doesn't
// wait for it.
export const onRequest = defineMiddleware((_ctx, next) => {
    ensureLanyard();
    return next();
});
