// The virtual filesystem the SSH surface navigates.
//
// This used to be hardcoded in Go — two levels of string-prefix matching in
// `handleLs`, which meant the tree could drift from the data it was supposed to
// describe. It lives here now so it stays derived from `projects` and
// `getBlogPosts()`, and the Go side only has to resolve paths against a manifest
// it is handed.
//
// The tree:
//
//   ~
//   ├── projects/<id>/README.md
//   ├── blog/<slug>.md
//   └── about.md
//
// Paths are keys with no leading slash; the root is ".".
// `README.md` and the blog posts are markdown, rendered by glamour on the Go
// side rather than pre-rendered here — everything else is pre-rendered ANSI.

import { bold, blue, overlay, padEndDisplay, peach, subtext, text } from "./ansi";
import { projects } from "./constants";
import { getBlogPosts } from "./blog";
import { formatDateCompact, formatWordCount } from "./date";
import { hasPublicSource, projectLinks } from "./utils";
// The two renderers this module reuses rather than reimplements.
import { getProjects, getWhoami } from "./terminal-commands";

export type EntryKind = "dir" | "file";
export interface Entry {
    name: string;
    kind: EntryKind;
}

/** The home directory's key in the emitted maps. `"."` rather than `""`: an
 *  empty JSON key is legal but reads as a bug, and the Go side normalises the
 *  empty cwd to this before looking anything up. */
export const ROOT = ".";

/**
 * The posts the SSH surface knows about — published only, in every environment.
 *
 * `getBlogPosts()` keeps drafts in dev so they can be previewed on the website,
 * but this tree is served over the wire: the compose file notes the image
 * deliberately carries unpublished drafts, so filtering here is what stops a
 * body from leaving the container. Filtering in one place also keeps `ls blog/`
 * and `cat blog/<slug>.md` agreeing with each other.
 */
const publishedPosts = () => getBlogPosts().filter((p) => !p.draft);

/** Every markdown path is fetched on demand from /api/fs rather than shipped
 *  in the command payload. */
export const isMarkdown = (path: string) => path.endsWith(".md");

const projectDir = (id: string) => `projects/${id}`;
const projectReadmePath = (id: string) => `projects/${id}/README.md`;
const blogPostPath = (slug: string) => `blog/${slug}.md`;

// --- Listings ---------------------------------------------------------------
// `ls` output, pre-rendered. Padding is applied to the RAW string before the
// colour wrapper goes on: padEnd counts escape bytes, so colouring first
// misaligns every column.

const prettyUrl = (url: string) =>
    url.replace(/^https?:\/\//, "").replace(/\/$/, "");

/** The home directory: two directories and one file. */
const rootListing = () => {
    const rows: [string, string, string][] = [
        ["drwxr-xr-x", "projects/", `${projects.length} things I have built`],
        ["drwxr-xr-x", "blog/", "posts, long-form"],
        ["-rw-r--r--", "about.md", "the long version of whoami"],
    ];
    const nameWidth = Math.max(...rows.map(([, name]) => name.length));

    return rows
        .map(([perms, name, description]) => {
            const painted = name.endsWith("/")
                ? bold(blue(padEndDisplay(name, nameWidth)))
                : text(padEndDisplay(name, nameWidth));
            return `${overlay(perms)}  ${peach("milind")}  ${painted}  ${subtext(description)}`;
        })
        .join("\n");
};

/** One project directory: it holds a README and nothing else. */
const projectListing = (id: string) => {
    const project = projects.find((p) => p.id === id)!;
    return [
        subtext("total 1"),
        `${overlay("-rw-r--r--")}  ${peach("milind")}  ${text("README.md")}  ${subtext(project.description)}`,
    ].join("\n");
};

/**
 * `ls blog/`, in the same column order the /blog page uses
 * (permissions, owner, word count, date, name) so the two surfaces line up.
 */
const blogListing = () => {
    const posts = publishedPosts();
    if (posts.length === 0) return subtext("total 0");

    const names = posts.map((p) => `${p.slug}.md`);
    const words = posts.map((p) => formatWordCount(p.wordCount));
    const dates = posts.map((p) => formatDateCompact(p.date));

    const nameWidth = Math.max(...names.map((n) => n.length));
    const wordWidth = Math.max(...words.map((w) => w.length));
    const dateWidth = Math.max(...dates.map((d) => d.length));

    const lines = [subtext(`total ${posts.length}`)];
    posts.forEach((post, i) => {
        lines.push(
            [
                overlay("-rw-r--r--"),
                peach("milind"),
                subtext(padEndDisplay(words[i], wordWidth)),
                blue(padEndDisplay(dates[i], dateWidth)),
                text(padEndDisplay(names[i], nameWidth)),
                subtext(post.title),
            ].join("  "),
        );
    });
    return lines.join("\n");
};

// --- Manifest ---------------------------------------------------------------

/** Directory path -> its children. Also the set of valid `cd` targets. */
export const getEntries = (): Record<string, Entry[]> => {
    const posts = publishedPosts();

    const entries: Record<string, Entry[]> = {
        [ROOT]: [
            { name: "projects", kind: "dir" },
            { name: "blog", kind: "dir" },
            { name: "about.md", kind: "file" },
        ],
        projects: projects.map((p) => ({ name: p.id, kind: "dir" as const })),
        blog: posts.map((p) => ({ name: `${p.slug}.md`, kind: "file" as const })),
    };

    for (const project of projects) {
        entries[projectDir(project.id)] = [{ name: "README.md", kind: "file" }];
    }

    return entries;
};

/** Directory path -> pre-rendered `ls` output. */
export const getListings = (): Record<string, string> => {
    const listings: Record<string, string> = {
        [ROOT]: rootListing(),
        projects: getProjects(),
        blog: blogListing(),
    };

    for (const project of projects) {
        listings[projectDir(project.id)] = projectListing(project.id);
    }

    return listings;
};

/**
 * File path -> pre-rendered ANSI, for the files that are NOT markdown.
 * The markdown ones (READMEs, blog posts) are served raw by /api/fs and
 * rendered by glamour, so they are deliberately absent here.
 */
export const getFiles = (): Record<string, string> => ({
    "about.md": getWhoami(),
});

/** Every markdown path in the tree, so the Go side can tab-complete without
 *  fetching any bodies. */
export const getMarkdownPaths = (): string[] => [
    ...projects.map((p) => projectReadmePath(p.id)),
    ...publishedPosts().map((p) => blogPostPath(p.slug)),
];

// --- Markdown sources -------------------------------------------------------

/**
 * A project's README, as actual markdown, so `cat projects/<id>/README.md`
 * renders through the same glamour path a blog post does. This replaced a
 * box-drawing ANSI tree — same content, but now it is a file rather than a
 * bespoke rendering.
 */
export const projectReadme = (id: string): string | null => {
    const project = projects.find((p) => p.id === id);
    if (!project) return null;

    const lines: string[] = [];
    lines.push(`# ${project.title}`);
    lines.push("");
    lines.push(project.longDescription);
    lines.push("");

    lines.push(`**Built with:** ${project.technologies.join(", ")}`);
    lines.push("");

    if (project.highlights.length > 0) {
        lines.push("## Highlights");
        lines.push("");
        for (const highlight of project.highlights) lines.push(`- ${highlight}`);
        lines.push("");
    }

    const links = projectLinks(project);
    lines.push("## Links");
    lines.push("");
    if (links.length === 0) {
        lines.push("_Source is private._");
    } else {
        for (const link of links) {
            lines.push(`- [${link.label ?? prettyUrl(link.url)}](${link.url})`);
        }
        if (!hasPublicSource(project)) {
            lines.push("");
            lines.push("_Source is private._");
        }
    }
    lines.push("");

    if (project.tags.length > 0) {
        lines.push(`> ${project.tags.join(" · ")}`);
        lines.push("");
    }

    return lines.join("\n");
};

/**
 * Obsidian syntax the website's remark plugins handle at build time, but which
 * would reach a terminal renderer verbatim. `![[banner.png]]` printed literally
 * is noise, so embeds become a marker and wikilinks collapse to their text.
 *
 * Code is left alone. One of the posts is *about* this syntax and writes
 * `![[workflow.excalidraw]]` inside backticks — rewriting that would corrupt
 * the very thing the paragraph is explaining. So fenced blocks and inline spans
 * are held out and stitched back untouched.
 */
const deobsidian = (markdown: string): string => {
    const rewrite = (plain: string) =>
        plain
            // ![[file.png]] / ![[file.png|alt]] -> a marker, not a broken image
            .replace(/!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, (_, target: string) => `[image: ${target.trim()}]`)
            // [[page|Text]] -> Text,  [[page]] -> page
            .replace(/\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g, (_, target: string, label?: string) =>
                (label ?? target).trim(),
            );

    // Split on fenced blocks first (odd indices are the fences themselves),
    // then on inline spans within each prose run.
    return markdown
        .split(/(^```[\s\S]*?^```)/gm)
        .map((chunk, i) =>
            i % 2 === 1
                ? chunk
                : chunk
                    .split(/(`[^`\n]*`)/g)
                    .map((part, j) => (j % 2 === 1 ? part : rewrite(part)))
                    .join(""),
        )
        .join("");
};

/** A blog post body, or null if the slug is unknown or the post is a draft. */
export const blogPostMarkdown = (slug: string): string | null => {
    const post = publishedPosts().find((p) => p.slug === slug);
    if (!post) return null;

    // Astro's rawContent() blanks the frontmatter to spaces rather than
    // removing it, so the body opens with a block of whitespace-only lines that
    // glamour would render as a gap the height of the frontmatter.
    const body = post.rawContent.replace(/^(?:[ \t]*\r?\n)+/, "").trimEnd();

    // The title and standfirst live in the frontmatter, which the web layout
    // renders separately — without them the terminal version opens mid-thought.
    const header = [`# ${post.title}`, "", `_${post.description}_`, ""];
    return [...header, deobsidian(body)].join("\n");
};

/** Resolve an /api/fs path to raw markdown. Returns null for anything that is
 *  not a markdown file in the tree. */
export const readMarkdown = (path: string): string | null => {
    const projectMatch = /^projects\/([^/]+)\/README\.md$/.exec(path);
    if (projectMatch) return projectReadme(projectMatch[1]);

    const blogMatch = /^blog\/([^/]+)\.md$/.exec(path);
    if (blogMatch) return blogPostMarkdown(blogMatch[1]);

    return null;
};
