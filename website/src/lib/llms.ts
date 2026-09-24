// /llms.txt, /llms-full.txt and the per-page `.md` mirrors they link to.
//
// Nothing here renders markdown of its own for projects or posts: those bodies
// are the same ones `cat` prints over SSH (see filesystem.ts), so the terminal
// and the agents read identical text.

import type { APIContext } from "astro";
import { personalInfo, projects } from "./constants";
import { blogPostMarkdown, projectReadme, publishedPosts } from "./filesystem";

/** Same dev/prod split as sitemap.xml and robots.txt: localhost links in dev,
 *  the canonical host everywhere else. */
export const siteUrlFor = (context: APIContext) =>
    (import.meta.env.DEV
        ? context.url.origin
        : context.site?.toString() || "https://milind.dev"
    ).replace(/\/$/, "");

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

/** The long version of whoami, as markdown. getWhoami() is ANSI, so it can't
 *  be reused here. */
export const aboutMarkdown = (): string => {
    const lines = [
        `# ${personalInfo.name}`,
        "",
        `_${personalInfo.bio.short}_`,
        "",
        // One line per line on both terminal surfaces; hard breaks keep that.
        personalInfo.bio.long.split("\n").map((line) => (line ? `${line}  ` : "")).join("\n").trimEnd(),
        "",
        `**Location:** ${personalInfo.location}  `,
        `**Email:** [${personalInfo.email}](mailto:${personalInfo.email})`,
        "",
        "## Elsewhere",
        "",
        ...personalInfo.social
            .filter((s) => !s.url.startsWith("mailto:"))
            .map((s) => `- [${s.name}](${s.url})`),
        "",
    ];
    return lines.join("\n");
};

/** The llms.txt index: https://llmstxt.org */
export const llmsIndex = (siteUrl: string): string => {
    const lines = [
        `# ${personalInfo.name}`,
        "",
        `> ${personalInfo.seoDescription}`,
        "",
        `The personal site of ${personalInfo.name}: projects and a blog. ` +
            "The website is a terminal you can type into, and the same content is served over SSH (`ssh milind.dev`). " +
            "Every page linked below is plain markdown; the HTML version lives at the same path without the `.md`.",
        "",
        "## About",
        "",
        `- [About ${personalInfo.name}](${siteUrl}/about.md): background, interests, and links elsewhere`,
        "",
        "## Projects",
        "",
        ...projects.map((p) => `- [${p.title}](${siteUrl}/projects/${p.id}.md): ${p.longDescription}`),
        "",
        "## Blog",
        "",
        ...publishedPosts().map(
            (p) => `- [${p.title}](${siteUrl}/blog/${p.slug}.md): ${p.description} (${isoDate(p.date)})`,
        ),
        "",
        "## Optional",
        "",
        `- [Full content](${siteUrl}/llms-full.txt): every page above in a single file`,
        `- [RSS feed](${siteUrl}/blog/rss.xml): the blog as RSS`,
        `- [Sitemap](${siteUrl}/sitemap.xml): every HTML page`,
        "",
    ];
    return lines.join("\n");
};

/** Every page from the index, concatenated. Each section names its HTML page
 *  so anything quoting it can cite the real URL. */
export const llmsFull = (siteUrl: string): string => {
    const section = (source: string, body: string) =>
        `Source: ${source}\n\n${body.trimEnd()}\n`;

    const sections = [
        section(`${siteUrl}/whoami`, aboutMarkdown()),
        ...projects.map((p) => section(`${siteUrl}/projects/${p.id}`, projectReadme(p.id) ?? "")),
        ...publishedPosts().map((p) =>
            section(`${siteUrl}${p.url}`, blogPostMarkdown(p.slug) ?? ""),
        ),
    ];

    return `${llmsIndex(siteUrl).trimEnd()}\n\n---\n\n${sections.join("\n---\n\n")}`;
};

const CACHE = "public, max-age=3600";

export const textResponse = (body: string) =>
    new Response(body, {
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": CACHE },
    });

/** A `.md` mirror of an HTML page. noindex for the same reason robots.txt keeps
 *  /api/ out: the HTML is the page to rank, this is a duplicate for agents. */
export const markdownResponse = (body: string | null) =>
    body === null
        ? new Response("Not found\n", {
              status: 404,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        : new Response(body, {
              headers: {
                  "Content-Type": "text/markdown; charset=utf-8",
                  "Cache-Control": CACHE,
                  "X-Robots-Tag": "noindex",
              },
          });
