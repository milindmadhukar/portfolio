import type { APIContext } from 'astro';
import { blogPostMarkdown } from '../../lib/filesystem';
import { markdownResponse } from '../../lib/llms';

// The markdown twin of /blog/<slug>/, linked from /llms.txt. Drafts 404.
export const prerender = false;

export function GET({ params }: APIContext) {
  return markdownResponse(blogPostMarkdown(params.slug ?? ''));
}
