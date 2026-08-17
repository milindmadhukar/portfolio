
import fs from "fs";
import path from "path";
import os from "os";

import { STATUS_PAGE_URL, STATUS_PAGE_SLUG } from "./constants";

const CACHE_FILE = path.join(os.tmpdir(), "uptime-stats-cache.json");
// Matches the poll interval in scripts/monitor-uptime.ts, so a request only
// fetches for itself if the poller has died or has not run yet.
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

// Uptime Kuma's heartbeat encoding. Note DOWN is 0, not 3 - the obvious
// ordering guess is wrong, and reading it as such reports outages as healthy.
const DOWN = 0;
const UP = 1;
const PENDING = 2;
const MAINTENANCE = 3;

export interface ServiceStats {
  up: number;
  pending: number;
  down: number;
  maintenance: number;
  total: number;
}

interface CacheData {
  timestamp: number;
  data: ServiceStats;
}

interface Heartbeat {
  status: number;
  time: string;
}

export type ServiceTone = "up" | "pending" | "down" | "maintenance";

export interface ServicePart {
  count: number;
  label: string;
  tone: ServiceTone;
}

/**
 * The row's wording, shared so the web and SSH banners cannot drift apart.
 * Zero counts are dropped: the row stays quiet at "37 operational" when
 * everything is healthy and only grows when something needs attention.
 *
 * The tone keys stay on Kuma's own vocabulary since they key the colour maps
 * in both renderers; only the labels are the public wording. "degraded" for
 * PENDING is accurate rather than euphemistic - Kuma means the check is
 * failing but has not yet exhausted its retries.
 */
export const serviceParts = (stats: ServiceStats): ServicePart[] => {
  const parts: ServicePart[] = [{ count: stats.up, label: "operational", tone: "up" }];
  if (stats.pending > 0) parts.push({ count: stats.pending, label: "degraded", tone: "pending" });
  if (stats.down > 0) parts.push({ count: stats.down, label: "down", tone: "down" });
  if (stats.maintenance > 0)
    parts.push({ count: stats.maintenance, label: "maintenance", tone: "maintenance" });
  return parts;
};

const readCache = (): CacheData | null => {
  if (!fs.existsSync(CACHE_FILE)) return null;
  try {
    const cache: CacheData = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
    return cache.data ? cache : null;
  } catch (e) {
    console.error("Error reading uptime cache:", e);
    return null;
  }
};

export const fetchServiceStats = async (): Promise<ServiceStats | null> => {
  try {
    const cached = readCache();
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    const base = `${STATUS_PAGE_URL}/api/status-page`;
    const [pageRes, heartbeatRes] = await Promise.all([
      fetch(`${base}/${STATUS_PAGE_SLUG}`),
      fetch(`${base}/heartbeat/${STATUS_PAGE_SLUG}`),
    ]);

    if (!pageRes.ok)
      throw new Error(`Failed to fetch status page: ${pageRes.status} ${pageRes.statusText}`);
    if (!heartbeatRes.ok)
      throw new Error(`Failed to fetch heartbeats: ${heartbeatRes.status} ${heartbeatRes.statusText}`);

    const page = await pageRes.json();
    const heartbeats = await heartbeatRes.json();

    // Take the monitor set from the page config rather than from heartbeatList:
    // that scopes the tally to monitors actually published on the page, and
    // ignores any stray ids the heartbeat payload happens to carry.
    const monitorIds: number[] = [];
    for (const group of page?.publicGroupList ?? []) {
      for (const monitor of group?.monitorList ?? []) {
        if (typeof monitor?.id === "number") monitorIds.push(monitor.id);
      }
    }

    if (monitorIds.length === 0) throw new Error("Status page listed no monitors");

    const stats: ServiceStats = { up: 0, pending: 0, down: 0, maintenance: 0, total: 0 };

    for (const id of monitorIds) {
      const beats: Heartbeat[] = heartbeats?.heartbeatList?.[String(id)] ?? [];

      // A paused monitor emits no heartbeats. Skipping it is deliberate -
      // counting it as down would report an outage that isn't happening.
      if (beats.length === 0) continue;

      // Kuma queries `ORDER BY time DESC` but the status page router reverses
      // the result, so neither end of this array is reliably current across
      // versions. Picking the newest by timestamp is correct either way; the
      // wrong end here is ~100 beats stale and fails silently.
      const latest = beats.reduce((newest, beat) => (beat.time > newest.time ? beat : newest));

      stats.total++;
      switch (latest.status) {
        case UP:
          stats.up++;
          break;
        case PENDING:
          stats.pending++;
          break;
        case DOWN:
          stats.down++;
          break;
        case MAINTENANCE:
          stats.maintenance++;
          break;
      }
    }

    try {
      const cacheData: CacheData = { timestamp: Date.now(), data: stats };
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData));
    } catch (writeError) {
      console.error("Error writing uptime cache:", writeError);
      // Ignore write error, still return fresh data
    }

    return stats;
  } catch (error) {
    console.error("Error fetching service stats:", error);
    // Serve the stale cache rather than blanking the row over a Kuma blip.
    return readCache()?.data ?? null;
  }
};
