import type { APIContext } from 'astro';
import { projectReadme } from '../../lib/filesystem';
import { markdownResponse } from '../../lib/llms';

// The markdown twin of /projects/<id>, linked from /llms.txt.
export const prerender = false;

export function GET({ params }: APIContext) {
  return markdownResponse(projectReadme(params.id ?? ''));
}
