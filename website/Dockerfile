FROM oven/bun:1 AS base
WORKDIR /app

# Install git for cloning blog repo
RUN apt-get update && apt-get install -y git

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source
COPY . .

ENV ASTRO_TELEMETRY_DISABLED=1

# Build the application
# No build secret. Every page that reads GitHub stats is prerender = false, so
# nothing calls the API at build time - the token is only needed at runtime, via
# the environment. Dropping the mount is what lets plain `docker compose build`
# work, on Dokploy or locally.
RUN bun run build

# Production image
FROM oven/bun:1-alpine AS release
WORKDIR /app

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/scripts ./scripts
COPY --from=base /app/src ./src
COPY --from=base /app/package.json ./package.json

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321

# Start the server and the background monitors that keep the fastfetch caches
# warm - GitHub push activity, and the Uptime Kuma service tally.
CMD ["sh", "-c", "bun ./dist/server/entry.mjs & bun scripts/monitor-github.ts & bun scripts/monitor-uptime.ts"]
