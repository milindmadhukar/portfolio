
import fs from "fs";
import path from "path";
import os from "os";

import { VAULT_URL } from "./constants";
import { compactNumber, pluralize } from "./utils";

const CACHE_FILE = path.join(os.tmpdir(), "vault-stats-cache.json");
// Matches the poll interval in scripts/monitor-vault.ts.
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

// The shape this reads. metrics.json carries a lot more - graph samples, top
// hubs, per-month commit histories - but a fastfetch row gets four numbers.
const SCHEMA_VERSION = 1;

export interface VaultStats {
  notes: number;
  words: number;
  links: number;
  tags: number;
}

interface CacheData {
  timestamp: number;
  data: VaultStats;
}

/**
 * The row's wording, shared so the web and SSH banners cannot drift apart.
 */
export const vaultParts = (stats: VaultStats): string[] => [
  pluralize(stats.notes, "note"),
  `${compactNumber(stats.words)} words`,
  pluralize(stats.links, "link"),
  pluralize(stats.tags, "tag"),
];

const readCache = (): CacheData | null => {
  if (!fs.existsSync(CACHE_FILE)) return null;
  try {
    const cache: CacheData = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
    return cache.data ? cache : null;
  } catch (e) {
    console.error("Error reading vault cache:", e);
    return null;
  }
};

export const fetchVaultStats = async (): Promise<VaultStats | null> => {
  try {
    const cached = readCache();
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    const res = await fetch(`${VAULT_URL}/metrics.json`);
    if (!res.ok) throw new Error(`Failed to fetch vault metrics: ${res.status} ${res.statusText}`);

    const metrics = await res.json();

    // A bumped version whose fields are still intact should not blank the row,
    // so this warns rather than throws - the field check below is the real gate.
    if (metrics?.schemaVersion !== SCHEMA_VERSION) {
      console.warn(
        `Unexpected vault metrics schemaVersion: ${metrics?.schemaVersion} (expected ${SCHEMA_VERSION})`,
      );
    }

    const stats: VaultStats = {
      notes: metrics?.corpus?.notes,
      words: metrics?.corpus?.words,
      // resolvedEdges, not linkInstances: the latter counts every wikilink
      // written, including the third of them that resolve to nothing.
      links: metrics?.graph?.resolvedEdges,
      tags: metrics?.tags?.unique,
    };

    // Guard before caching. Without this a reshaped payload renders "NaN notes"
    // on both surfaces and then pins that into the cache for five minutes.
    for (const [key, value] of Object.entries(stats)) {
      if (!Number.isFinite(value)) throw new Error(`Vault metrics missing a numeric ${key}`);
    }

    try {
      const cacheData: CacheData = { timestamp: Date.now(), data: stats };
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData));
    } catch (writeError) {
      console.error("Error writing vault cache:", writeError);
      // Ignore write error, still return fresh data
    }

    return stats;
  } catch (error) {
    console.error("Error fetching vault stats:", error);
    // Serve the stale cache rather than blanking the row over a blip.
    return readCache()?.data ?? null;
  }
};
