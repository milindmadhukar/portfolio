import type { APIContext } from 'astro';

// SSR so the Sitemap line always points at the correct absolute URL for the
// host the site is served from.
export const prerender = false;

export async function GET(context: APIContext) {
  const isDev = import.meta.env.DEV;
  const siteUrl = (
    isDev ? context.url.origin : context.site?.toString() || 'https://milind.dev'
  ).replace(/\/$/, '');

  // /api/ is disallowed because /api/fs serves the raw markdown behind each
  // blog post and project README. Those bodies are already published as HTML at
  // /blog/<slug> and /projects/<id>; indexing both would be duplicate content
  // for no gain. It exists for the SSH server, not for crawlers.
  const body = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${siteUrl}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
