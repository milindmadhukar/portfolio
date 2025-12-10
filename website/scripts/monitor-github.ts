
import { fetchGithubStats } from "../src/lib/github";

const UPDATE_INTERVAL = 1000 * 60 * 5; // 5 minutes

console.log("Starting GitHub stats monitor...");

// Initial fetch
fetchGithubStats()
    .then(() => console.log("Initial GitHub stats fetch complete"))
    .catch((e) => console.error("Initial GitHub stats fetch failed:", e));

// Periodic fetch
setInterval(async () => {
    console.log("Updating GitHub stats...");
    try {
        await fetchGithubStats();
        console.log("GitHub stats updated successfully");
    } catch (error) {
        console.error("Failed to update GitHub stats:", error);
    }
}, UPDATE_INTERVAL);
