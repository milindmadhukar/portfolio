
import { fetchServiceStats } from "../src/lib/uptime";

const UPDATE_INTERVAL = 1000 * 60 * 5; // 5 minutes

console.log("Starting Uptime Kuma monitor...");

// Initial fetch
fetchServiceStats()
    .then(() => console.log("Initial service stats fetch complete"))
    .catch((e) => console.error("Initial service stats fetch failed:", e));

// Periodic fetch
setInterval(async () => {
    console.log("Updating service stats...");
    try {
        await fetchServiceStats();
        console.log("Service stats updated successfully");
    } catch (error) {
        console.error("Failed to update service stats:", error);
    }
}, UPDATE_INTERVAL);
