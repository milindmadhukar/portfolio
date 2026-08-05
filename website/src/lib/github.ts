
import fs from "fs";
import path from "path";
import os from "os";

import { GITHUB_USERNAME, GITHUB_API_URL } from "./constants";

const CACHE_FILE = path.join(os.tmpdir(), "github-stats-cache.json");
const CACHE_DURATION = 1000 * 60; // 1 minute

interface GithubStats {
  repos: number;
  followers: number;
  following: number;
  lastPush: {
    repo: string;
    at: Date;
  } | null;
}

interface CacheData {
  timestamp: number;
  data: GithubStats;
}

export const fetchGithubStats = async (): Promise<GithubStats | null> => {
  try {
    // Check cache
    if (fs.existsSync(CACHE_FILE)) {
      try {
        const cacheRaw = fs.readFileSync(CACHE_FILE, "utf-8");
        const cache: CacheData = JSON.parse(cacheRaw);
        if (cache.data && Date.now() - cache.timestamp < CACHE_DURATION) {
          // Parse date back to object
          if (cache.data.lastPush) {
            cache.data.lastPush.at = new Date(cache.data.lastPush.at);
          }
          return cache.data;
        }
      } catch (e) {
        console.error("Error reading cache:", e);
        // Continue to fetch if cache is invalid
      }
    }

    const username = process.env.GITHUB_USERNAME || GITHUB_USERNAME;
    const apiUrl = process.env.GITHUB_API_URL || GITHUB_API_URL;
    const token = process.env.GITHUB_TOKEN;

    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const [userRes, eventsRes, reposRes] = await Promise.all([
      fetch(`${apiUrl}/users/${username}`, { headers }),
      fetch(`${apiUrl}/users/${username}/events/public`, { headers }),
      fetch(`${apiUrl}/users/${username}/repos?sort=pushed&direction=desc&per_page=1`, { headers }),
    ]);

    if (!userRes.ok) throw new Error(`Failed to fetch user data: ${userRes.status} ${userRes.statusText}`);
    const userData = await userRes.json();

    // Neither source is trustworthy on its own. The public events feed trails
    // a real push by tens of minutes and is not ordered by time — taking the
    // first PushEvent in the array names the wrong repo. The repo list sorted
    // by push time is exact, but only covers repos this user owns. So collect
    // candidates from both and keep whichever push actually happened last.
    const candidates: { repo: string; at: Date }[] = [];

    if (eventsRes.ok) {
      const eventsData = await eventsRes.json();
      if (Array.isArray(eventsData)) {
        for (const e of eventsData) {
          if (e?.type !== "PushEvent" || !e?.repo?.name || !e?.created_at) continue;
          candidates.push({ repo: e.repo.name, at: new Date(e.created_at) });
        }
      }
    }

    if (reposRes.ok) {
      const reposData = await reposRes.json();
      const newestRepo = Array.isArray(reposData) ? reposData[0] : null;
      if (newestRepo?.full_name && newestRepo?.pushed_at) {
        candidates.push({ repo: newestRepo.full_name, at: new Date(newestRepo.pushed_at) });
      }
    }

    // Both push sources failing is a fetch failure, not "never pushed" — throw
    // so the stale cache below is served instead of an empty Last Commit row.
    if (!eventsRes.ok && !reposRes.ok) throw new Error("Failed to fetch push history");

    const lastPush = candidates
      .filter((c) => !isNaN(c.at.getTime()))
      .sort((a, b) => b.at.getTime() - a.at.getTime())[0] ?? null;

    const stats: GithubStats = {
      repos: userData.public_repos,
      followers: userData.followers,
      following: userData.following,
      lastPush
    };

    // Write to cache
    try {
      const cacheData: CacheData = {
        timestamp: Date.now(),
        data: stats
      };
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData));
    } catch (writeError) {
      console.error("Error writing to cache:", writeError);
      // Ignore write error, still return fresh data
    }

    return stats;

  } catch (error) {
    console.error("Error fetching GitHub stats:", error);
    // Try to return stale cache if available
    if (fs.existsSync(CACHE_FILE)) {
      try {
        const cacheRaw = fs.readFileSync(CACHE_FILE, "utf-8");
        const cache: CacheData = JSON.parse(cacheRaw);

        if (!cache.data) return null;

        // Parse date back to object
        if (cache.data.lastPush) {
          cache.data.lastPush.at = new Date(cache.data.lastPush.at);
        }
        return cache.data;
      } catch (e) {
        return null;
      }
    }
    return null;
  }
};


