
import fs from "fs";
import path from "path";

import { CACHE_FILE_PATH, GITHUB_USERNAME, GITHUB_API_URL } from "./constants";

const CACHE_FILE = path.join(process.cwd(), CACHE_FILE_PATH);
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

interface GithubStats {
    repos: number;
    followers: number;
    following: number;
    lastPush: {
        repo: string;
        at: Date;
        message: string;
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

        // Fetch User Data
        const userRes = await fetch(`${apiUrl}/users/${username}`);
        if (!userRes.ok) throw new Error("Failed to fetch user data");
        const userData = await userRes.json();

        // Fetch Events for Last Push
        const eventsRes = await fetch(`${apiUrl}/users/${username}/events/public`);
        if (!eventsRes.ok) throw new Error("Failed to fetch user events");
        const eventsData = await eventsRes.json();

        let lastPush = null;
        if (Array.isArray(eventsData)) {
            const pushEvent = eventsData.find((e: any) => e.type === "PushEvent");

            if (pushEvent) {
                lastPush = {
                    repo: pushEvent.repo.name,
                    at: new Date(pushEvent.created_at),
                    message: pushEvent.payload?.commits?.[0]?.message || "No commit message",
                };
            }
        }

        const stats: GithubStats = {
            repos: userData.public_repos,
            followers: userData.followers,
            following: userData.following,
            lastPush
        };

        // Write to cache
        const cacheData: CacheData = {
            timestamp: Date.now(),
            data: stats
        };
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData));

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


