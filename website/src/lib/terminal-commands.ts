
import {
    blue,
    cyan,
    green,
    magenta,
    overlay,
    peach,
    red,
    subtext,
    text,
    yellow,
    bold,
    ANSI,
    displayWidth,
    padEndDisplay,
} from "./ansi";
import { getPresence } from "./lanyard-server";
import { PRESENCE_LABELS, type PresenceStatus } from "./lanyard";
import {
    experience,
    education,
    personalInfo,
    projects,
    BIRTH_DATE,
    EXPERIENCE_START_DATE,
} from "./constants";
import { fetchGithubStats } from "./github";
import { calculateExperience, formatUptime, hasPublicSource, pluralize, projectLinks } from "./utils";
import { formatTimeAgo } from "./date";
import { getBlogPosts } from "./blog";

// The info column is capped at the same width the web page caps it at, so a
// long value wraps rather than dragging the separators out to match it.
const MAX_COLS = 64;
const CONT_INDENT = "  ";

// Stands in for a separator while the block is being built: its width is a
// function of lines that don't exist yet, so the rules can only be rendered on
// a second pass once every row is known.
const RULE = Symbol("rule");

const STATUS_ANSI: Record<PresenceStatus, (s: string) => string> = {
    online: green,
    idle: yellow,
    dnd: red,
    offline: subtext,
};

// A `label : value` row, word-wrapped to MAX_COLS. Continuation lines get a
// hanging indent, mirroring `.term-row` on the web so the two surfaces break
// long values the same way.
const row = (label: string, value: string, paint = text): string[] => {
    const head = `${label} : `;
    const firstBudget = Math.max(MAX_COLS - displayWidth(head), 16);
    const contBudget = Math.max(MAX_COLS - CONT_INDENT.length, 16);

    const chunks: string[] = [];
    let current = "";
    for (const word of value.split(" ")) {
        const budget = chunks.length === 0 ? firstBudget : contBudget;
        const candidate = current ? `${current} ${word}` : word;
        if (current && displayWidth(candidate) > budget) {
            chunks.push(current);
            current = word;
        } else {
            current = candidate;
        }
    }
    if (current) chunks.push(current);

    return [
        `${head}${paint(chunks[0] ?? "")}`,
        ...chunks.slice(1).map((c) => `${CONT_INDENT}${paint(c)}`),
    ];
};

export const getFastfetch = async () => {
    // The presence read is an in-memory snapshot once the socket is warm, so
    // it costs the SSH path nothing even though it re-fetches per command.
    const [githubStats, presence] = await Promise.all([
        fetchGithubStats(),
        getPresence(),
    ]);
    const posts = getBlogPosts();

    // ASCII Art (Desktop version primarily)
    const ascii = [
        `   ,=====================.`,
        `   |MILIND'S  LAB  /6000/|`,
        `   |.-------------------.|`,
        `   ||[ _ o     . .  _ ]_||`,
        `   |\`-------------------'|`,
        `   ||                   ||`,
        `   |\`-------------------'|`,
        `   ||                   ||`,
        `   |\`-------------------'|`,
        `   ||                   ||`,
        `   |\`-----------------_-'|`,
        `   ||[=========]| o  (@) |`,
        `   |\`---------=='/u\\ --- |`,
        `   |------_--------------|`,
        `   | (/) (_)           []|`,
        `   |---==--==----------==|`,
        `   |||||||||||||||||||||||`,
        `   |||||||||||||||||||||||`,
        `   |||||||||||||||||||||||`,
        `   |||||||||||||||||||||||`,
        `   |||||||||||||||||||||||`,
        `   |||||||||||||||||||||||`,
        `   |||||||||||||||||||||||`,
        `   |||||||||||||||||||||||`,
        `   |=====================|`,
        `  .'                     \`.`,
        ` """""""""""""""""""""""""""`,
    ].map(line => bold(blue(line))); // Color the whole ASCII art blue/bold as in component

    // Info lines. RULE entries are placeholders — see the second pass below.
    const info: (string | typeof RULE)[] = [];

    // User@Host
    info.push(`${red("portfolio")}${overlay("@")}${cyan("milind.dev")}`);
    info.push(RULE);

    // Work
    if (experience[0]) {
        info.push(...row(blue(" Work"), experience[0].company));
    }

    // Role
    info.push(...row(blue(" Role"), experience[0]?.title ?? "DevOps & Backend Engineer"));

    // Education
    if (education[0]) {
        info.push(...row(blue(" Education"), education[0].institution));
    }

    // Experience
    info.push(...row(blue(" Experience"), calculateExperience(new Date(EXPERIENCE_START_DATE))));

    // Uptime — elapsed time since I booted. Recomputed per request, so the
    // SSH banner is as live as the web one.
    info.push(...row(blue(" Uptime"), formatUptime(new Date(BIRTH_DATE))));

    // OS — the web surface renders the same row via nf-linux-archlinux.
    // Escaped rather than pasted so the codepoint is greppable next to the
    // class name it has to stay in sync with.
    info.push(...row(blue(" OS"), "arch btw"));

    // Blog
    const blogCount = posts.length;
    if (blogCount > 0)
        info.push(`${yellow(" Blog")} ${overlay("::")} ${text(pluralize(blogCount, "article"))} ${subtext("[READ]")}`);

    // Latest Post
    if (posts.length > 0) {
        info.push(...row(magenta(" Latest Post"), posts[0].title));
    }

    // Github Stats
    if (githubStats) {
        info.push(RULE);
        info.push(...row(
            text(" Github Stats"),
            `Repos: ${githubStats.repos} | Followers: ${githubStats.followers} | Following: ${githubStats.following}`,
        ));

        if (githubStats.lastPush) {
            info.push(...row(
                magenta(" Last Commit"),
                `${githubStats.lastPush.repo} - ${formatTimeAgo(githubStats.lastPush.at)}`,
            ));
        }
    }

    // Discord presence, read from the socket the server already holds open —
    // so the SSH banner shows the same status and the same track as the web
    // page, from the same snapshot.
    info.push(RULE);
    info.push(...row(
        blue("󰙯 Status"),
        PRESENCE_LABELS[presence.status],
        STATUS_ANSI[presence.status],
    ));
    if (presence.spotify) {
        info.push(...row(
            green(" Listening to"),
            `${presence.spotify.song} by ${presence.spotify.artist}`,
        ));
    }
    for (const activity of presence.playing) {
        info.push(...row(
            yellow("󰮂 Playing"),
            activity.state ? `${activity.name} (${activity.state})` : activity.name,
        ));
    }

    // Second pass: every real row exists now, so the rules can be sized to
    // the widest of them.
    const infoWidth = Math.max(
        ...info.filter((l): l is string => l !== RULE).map(displayWidth),
    );
    const rendered = info.map((l) => (l === RULE ? overlay("-".repeat(infoWidth)) : l));

    // Combine side by side. The art is padded to its own *measured* width:
    // its lines are 26, 27 and 28 cells wide, so assuming a constant width
    // left the info column ragged by up to two columns.
    const artWidth = Math.max(...ascii.map(displayWidth));
    const outputLines: string[] = [];
    const maxLines = Math.max(ascii.length, rendered.length);

    for (let i = 0; i < maxLines; i++) {
        outputLines.push(`${padEndDisplay(ascii[i] ?? "", artWidth)}   ${rendered[i] ?? ""}`);
    }

    return outputLines.join("\n");
};

export const getWhoami = () => {
    const lines = [];

    lines.push(`${subtext("hi, i am ")}${bold(green(personalInfo.name.toLowerCase()))}`);
    lines.push("");
    lines.push(subtext(personalInfo.bio.long));

    return lines.join("\n");
};

const prettyUrl = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

// The link line under a listing row: repos in cyan, live site in green, with
// the closed-source status spelled out rather than left to be inferred. Every
// link is listed, not just the first — a project can span several repos.
const linkFragment = (project: (typeof projects)[number]) => {
    const links = projectLinks(project);
    if (links.length === 0) return subtext("source private");
    const rendered = links.map((link) =>
        link.kind === "github"
            ? cyan(link.label ?? prettyUrl(link.url))
            : green(prettyUrl(link.url)),
    );
    if (!hasPublicSource(project)) rendered.push(subtext("(source private)"));
    return rendered.join(subtext("  ·  "));
};

export const getProjects = () => {
    const lines: string[] = [];

    lines.push(subtext(`total ${projects.length}`));

    // Directory names (project id + trailing slash), padded to a common width.
    // Pad the RAW string before wrapping in ANSI — color codes break padEnd.
    const names = projects.map(p => `${p.id}/`);
    const nameWidth = Math.max(...names.map(n => n.length));

    // Where the description column starts: "drwxr-xr-x" + 2 + "milind" + 2 +
    // name + 2. Measured on the raw strings so the continuation lines beneath
    // each row line up with the description above them.
    const descIndent = " ".repeat(10 + 2 + 6 + 2 + nameWidth + 2);

    projects.forEach((p, i) => {
        const perms = overlay("drwxr-xr-x");
        const owner = peach("milind");
        const name = bold(blue(names[i].padEnd(nameWidth)));

        // Listing row: permissions  owner  name/  description
        lines.push(`${perms}  ${owner}  ${name}  ${text(p.description)}`);
        // Continuation row: the project's link, hanging under the description.
        lines.push(`${descIndent}${overlay("↳")} ${linkFragment(p)}`);
    });

    return lines.join("\n");
};

// One project's own page, shown by `ls projects/<name>` over SSH.
export const getProjectDetails = () => {
    return Object.fromEntries(projects.map(p => {
        const lines: string[] = [];

        lines.push(bold(blue(`${p.id}/`)));
        lines.push(`${overlay("├─")} ${text(p.title)}`);
        lines.push(`${overlay("├─")} ${subtext(p.longDescription)}`);
        lines.push(`${overlay("├─")} ${subtext(p.technologies.join(" · "))}`);
        p.highlights.forEach(h => lines.push(`${overlay("│")}  ${subtext("•")} ${text(h)}`));
        lines.push(`${overlay("└─")} ${linkFragment(p)}`);

        return [p.id, lines.join("\n")];
    }));
};

export const getUptime = () => {
    return ` ${blue("up")} ${text(formatUptime(new Date(BIRTH_DATE)))}`;
};

export const getProjectIds = () => projects.map(p => p.id);

export const getHelp = () => {
    return `Available commands:
  ${green("fastfetch")}          - Display system information
  ${green("whoami")}             - Display user information
  ${green("ls projects/")}       - List my projects
  ${green("ls projects/<name>")} - Show one project in detail
  ${green("uptime")}             - How long I've been running
  ${green("help")}               - Show this help message
  ${green("clear")}              - Clear the screen
  ${green("exit")}               - Close the connection
`;
};
