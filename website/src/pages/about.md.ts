import { aboutMarkdown, markdownResponse } from '../lib/llms';

export const prerender = false;

export function GET() {
  return markdownResponse(aboutMarkdown());
}
