import type { APIContext } from 'astro';

// SSR so the Sitemap line always points at the correct absolute URL for the
// host the site is served from.
export const prerender = false;

export async function GET(context: APIContext) {
  const isDev = import.meta.env.DEV;
  const siteUrl = (
    isDev ? context.url.origin : context.site?.toString() || 'https://milind.dev'
  ).replace(/\/$/, '');

  const body = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
