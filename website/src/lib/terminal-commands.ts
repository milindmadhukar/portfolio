
import {
    blue,
    cyan,
    green,
    magenta,
    mauve,
    overlay,
    peach,
    red,
    sapphire,
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
import { fetchServiceStats, serviceParts, type ServiceTone } from "./uptime";
import { fetchVaultStats, vaultParts } from "./vault";
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

// Mirrors SERVICE_TONE in FastfetchOutput.astro.
const SERVICE_ANSI: Record<ServiceTone, (s: string) => string> = {
    up: green,
    pending: yellow,
    down: red,
    maintenance: blue,
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
    const [githubStats, serviceStats, vaultStats, presence] = await Promise.all([
        fetchGithubStats(),
        fetchServiceStats(),
        fetchVaultStats(),
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

    // Blog
    const blogCount = posts.length;
    if (blogCount > 0)
        info.push(`${yellow(" Blog")} ${overlay("::")} ${text(pluralize(blogCount, "article"))} ${subtext("[READ]")}`);

    // Latest Post
    if (posts.length > 0) {
        info.push(...row(magenta(" Latest Post"), posts[0].title));
    }

    // Rule and OS live outside the githubStats guard so the section still
    // renders if the GitHub fetch fails. Mirrors FastfetchOutput.astro.
    info.push(RULE);
    info.push(...row(blue(" OS"), "arch btw"));

    // Github Stats
    if (githubStats) {
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

    // Outside the githubStats guard on purpose: a GitHub outage must not take
    // the Services row down with it. Mirrors FastfetchOutput.astro.
    //
    // Built by hand rather than through row(), which wraps by splitting on
    // spaces — that would cut through an ANSI run in a per-part-coloured value
    // and leak colour onto the next line. Not wrapping is the point: the widest
    // this gets is every state at once, which measures 65 cells —
    //
    //   󰒍 Services : 33 operational · 1 degraded · 2 down · 1 maintenance
    //
    // one over MAX_COLS. Since it bypasses row() that costs nothing but a
    // one-cell-wider separator rule, and only when four statuses coexist.
    if (serviceStats) {
        const summary = serviceParts(serviceStats)
            .map((part) => SERVICE_ANSI[part.tone](`${part.count} ${part.label}`))
            .join(overlay(" · "));
        info.push(`${sapphire("󰒍 Services")} : ${summary}`);
    }

    // Same hand-built treatment as Services, and for the same reason. This one
    // measures 54 cells, well inside MAX_COLS.
    if (vaultStats) {
        const summary = vaultParts(vaultStats).map(text).join(overlay(" · "));
        info.push(`${cyan("󰠮 Vault")} : ${summary}`);
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
            mauve(" Listening to"),
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

    lines.push(`${subtext("hi, i am ")}${bold(mauve(personalInfo.name.toLowerCase()))}`);
    lines.push("");
    lines.push(subtext(personalInfo.bio.long));

    return lines.join("\n");
};

const prettyUrl = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

// The link line under a listing row: repos in cyan, live site in sapphire, with
// the closed-source status spelled out rather than left to be inferred. Every
// link is listed, not just the first — a project can span several repos.
//
// Live sites used to be green. Green is now reserved for liveness signals
// (services up, Discord online) so it reads as status rather than decoration —
// five stacked green URLs in this listing were the bulk of the problem.
const linkFragment = (project: (typeof projects)[number]) => {
    const links = projectLinks(project);
    if (links.length === 0) return subtext("source private");
    const rendered = links.map((link) =>
        link.kind === "github"
            ? cyan(link.label ?? prettyUrl(link.url))
            : sapphire(prettyUrl(link.url)),
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

// `ls projects/<name>` used to print a box-drawing detail page from here. A
// project is a directory now, holding a README.md — so the detail lives in
// `projectReadme()` in filesystem.ts as real markdown, and glamour renders it.

export const getUptime = () => {
    return ` ${blue("up")} ${text(formatUptime(new Date(BIRTH_DATE)))}`;
};

// Grouped rather than one flat list: the command set grew past the point where
// eight alphabetised lines told you anything about which ones go together.
// Names are mauve, not green — green means "alive" now, and a solid block of it
// here was most of what made the palette read as green.
const HELP_GROUPS: { title: string; commands: [string, string][] }[] = [
    {
        title: "navigate",
        commands: [
            ["ls [path]", "list a directory"],
            ["cd <dir>", "change directory"],
            ["pwd", "print the working directory"],
            ["cat <file>", "print a file — markdown is rendered"],
        ],
    },
    {
        title: "me",
        commands: [
            ["fastfetch", "the banner you got on connect"],
            ["whoami", "the long version"],
            ["uptime", "how long I've been running"],
        ],
    },
    {
        title: "session",
        commands: [
            ["help", "this"],
            ["clear", "clear the screen"],
            ["exit", "close the connection"],
        ],
    },
];

export const getHelp = () => {
    // Padded on the raw name, before the colour wrapper — padEnd counts escape
    // bytes and would misalign every row otherwise.
    const nameWidth = Math.max(
        ...HELP_GROUPS.flatMap((g) => g.commands.map(([name]) => name.length)),
    );

    const lines: string[] = [];
    for (const group of HELP_GROUPS) {
        lines.push(bold(blue(group.title)));
        for (const [name, description] of group.commands) {
            lines.push(`  ${mauve(name.padEnd(nameWidth))}  ${subtext(description)}`);
        }
        lines.push("");
    }

    // Both of these are single commands on purpose: there is no operator
    // parsing here, so a `cmd && cmd` hint would fail if anyone pasted it.
    lines.push(
        `${subtext("try")} ${text("cd projects")}${subtext(", or")} ${text("cat blog/<slug>.md")}${subtext(". tab completes paths.")}`,
    );

    return lines.join("\n");
};
