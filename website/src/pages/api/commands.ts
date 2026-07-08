
import type { APIRoute } from 'astro';
import { getFastfetch, getWhoami, getProjects, getHelp } from '../../lib/terminal-commands';

export const GET: APIRoute = async () => {
    const fastfetch = await getFastfetch();
    const whoami = getWhoami();
    const projects = getProjects();
    const help = getHelp();

    return new Response(
        JSON.stringify({
            fastfetch,
            whoami,
            projects,
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
