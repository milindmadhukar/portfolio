import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
    try {
        const response = await fetch("https://milind.dev");
        if (response.ok) {
            return new Response(JSON.stringify({ message: "Cron job executed successfully" }), {
                status: 200,
                headers: {
                    "Content-Type": "application/json"
                }
            });
        } else {
            return new Response(JSON.stringify({ error: "Failed to fetch homepage" }), {
                status: 500,
                headers: {
                    "Content-Type": "application/json"
                }
            });
        }
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
            status: 500,
            headers: {
                "Content-Type": "application/json"
            }
        });
    }
}
