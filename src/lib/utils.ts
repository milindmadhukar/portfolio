export const getUptime = (dob: Date) => {
    const now = new Date();
    return `${Math.round((now.getTime() - dob.getTime()) / 31556952000)} years, ${Math.ceil((now.getTime() - dob.getTime()) % 31556952000 / 2629746000)} months, ${Math.round((now.getTime() - dob.getTime()) % 31556952000 % 2629746000 / 86400000)} days`;
}

import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), 'node_modules', '.github-cache.json');
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export const getGithubUpdatedAt = async () => {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
            if (Date.now() - cache.timestamp < CACHE_DURATION) {
                return new Date(cache.updated_at);
            }
        }

        const response = await fetch('https://api.github.com/users/milindmadhukar');
        const data = await response.json();

        if (data.updated_at) {
            fs.writeFileSync(CACHE_FILE, JSON.stringify({
                timestamp: Date.now(),
                updated_at: data.updated_at
            }));
            return new Date(data.updated_at);
        }
    } catch (error) {
        console.error("Failed to fetch GitHub data:", error);
    }

    return new Date(); // Fallback to current date
};

