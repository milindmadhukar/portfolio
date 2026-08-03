
import type { APIRoute } from 'astro';
import {
    getFastfetch,
    getWhoami,
    getProjects,
    getProjectDetails,
    getProjectIds,
    getUptime,
    getHelp,
} from '../../lib/terminal-commands';

export const GET: APIRoute = async () => {
    const fastfetch = await getFastfetch();
    const whoami = getWhoami();
    const projects = getProjects();
    // Per-project pages plus the bare ids, so the SSH server can serve
    // `ls projects/<name>` and tab-complete without knowing any content itself.
    const projectDetails = getProjectDetails();
    const projectIds = getProjectIds();
    const uptime = getUptime();
    const help = getHelp();

    return new Response(
        JSON.stringify({
            fastfetch,
            whoami,
            projects,
            projectDetails,
            projectIds,
            uptime,
            help,
        }),
        {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
}
