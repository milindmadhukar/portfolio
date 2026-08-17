
import { fetchVaultStats } from "../src/lib/vault";

const UPDATE_INTERVAL = 1000 * 60 * 5; // 5 minutes

console.log("Starting vault metrics monitor...");

// Initial fetch
fetchVaultStats()
    .then(() => console.log("Initial vault stats fetch complete"))
    .catch((e) => console.error("Initial vault stats fetch failed:", e));

// Periodic fetch
setInterval(async () => {
    console.log("Updating vault stats...");
    try {
        await fetchVaultStats();
        console.log("Vault stats updated successfully");
    } catch (error) {
        console.error("Failed to update vault stats:", error);
    }
}, UPDATE_INTERVAL);
