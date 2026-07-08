import type { APIContext } from 'astro';
import { getBlogPosts } from '../lib/blog';

// SSR so the sitemap is generated per-request and always reflects the current
// set of blog posts (getBlogPosts globs the markdown files, so new posts are
// picked up automatically — no rebuild list to maintain).
export const prerender = false;

// Static, always-present routes. Add new top-level pages here; blog posts are
// discovered dynamically below.
const STATIC_ROUTES: { path: string; changefreq: string; priority: string }[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/blog/', changefreq: 'weekly', priority: '0.8' },
];

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(context: APIContext) {
  const isDev = import.meta.env.DEV;
  const siteUrl = (
    isDev ? context.url.origin : context.site?.toString() || 'https://milind.dev'
  ).replace(/\/$/, '');

  const posts = getBlogPosts();

  // Newest post date drives the homepage/blog-index lastmod so crawlers see
  // fresh content whenever a post is added.
  const latest = posts.reduce<Date | null>(
    (acc, p) => (!acc || p.date > acc ? p.date : acc),
    null,
  );

  const urls: string[] = [];

  for (const route of STATIC_ROUTES) {
    const lastmod = latest ? `\n    <lastmod>${latest.toISOString()}</lastmod>` : '';
    urls.push(
      `  <url>\n    <loc>${xmlEscape(siteUrl + route.path)}</loc>${lastmod}\n    <changefreq>${route.changefreq}</changefreq>\n    <priority>${route.priority}</priority>\n  </url>`,
    );
  }

  for (const post of posts) {
    urls.push(
      `  <url>\n    <loc>${xmlEscape(siteUrl + post.url)}</loc>\n    <lastmod>${post.date.toISOString()}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`,
    );
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
