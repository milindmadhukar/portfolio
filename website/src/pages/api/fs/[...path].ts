import type { APIRoute } from 'astro';
import { readMarkdown } from '../../../lib/filesystem';

export const prerender = false;

// Raw markdown for one path in the virtual filesystem, fetched on demand by the
// SSH server when you `cat` a `.md` file. Deliberately not part of
// /api/commands: that payload is refetched constantly, and post bodies would
// dominate it.
//
// `readMarkdown` only matches `projects/<id>/README.md` and `blog/<slug>.md`,
// and filters drafts unconditionally — so an unpublished post is a 404 here even
// though it is present in the image.
export const GET: APIRoute = ({ params }) => {
    const path = params.path ?? '';

    const content = readMarkdown(path);
    if (content === null) {
        return new Response('Not found\n', {
            status: 404,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
    }

    return new Response(content, {
        status: 200,
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            // The SSH server caches these itself; this just keeps any
            // intermediary from serving a stale body after a blog sync.
            'Cache-Control': 'no-cache',
        },
    });
};
