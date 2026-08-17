import type { APIRoute } from 'astro';
import {
    getFastfetch,
    getWhoami,
    getProjects,
    getUptime,
    getHelp,
} from '../../lib/terminal-commands';
import {
    getEntries,
    getFiles,
    getListings,
    getMarkdownPaths,
} from '../../lib/filesystem';

// The SSH server's whole view of this site. It holds no content of its own —
// it resolves paths against `entries`, prints `listings`/`files`, and fetches
// markdown bodies separately from /api/fs.
//
// This is the hot path: the Go side calls it for every command, so nothing
// expensive or large belongs here. Post bodies in particular stay out — they
// are fetched per-path, on demand.
export const GET: APIRoute = async () => {
    const fastfetch = await getFastfetch();

    return new Response(
        JSON.stringify({
            fastfetch,
            whoami: getWhoami(),
            projects: getProjects(),
            uptime: getUptime(),
            help: getHelp(),

            // The virtual filesystem.
            entries: getEntries(),
            listings: getListings(),
            files: getFiles(),
            markdownPaths: getMarkdownPaths(),
        }),
        {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
}
