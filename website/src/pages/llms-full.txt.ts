import type { APIContext } from 'astro';
import { llmsFull, siteUrlFor, textResponse } from '../lib/llms';

export const prerender = false;

export function GET(context: APIContext) {
  return textResponse(llmsFull(siteUrlFor(context)));
}
