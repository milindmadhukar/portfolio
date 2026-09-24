import type { APIContext } from 'astro';
import { llmsIndex, siteUrlFor, textResponse } from '../lib/llms';

// SSR, like sitemap.xml: new posts and projects appear without a rebuild list.
export const prerender = false;

export function GET(context: APIContext) {
  return textResponse(llmsIndex(siteUrlFor(context)));
}
