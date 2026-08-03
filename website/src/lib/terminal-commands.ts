
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
} from "./ansi";
import {
    experience,
    education,
    personalInfo,
    projects,
    BIRTH_DATE,
    DISCORD_ID,
    EXPERIENCE_START_DATE,
} from "./constants";
import { fetchGithubStats } from "./github";
import { calculateExperience, formatUptime, projectLink } from "./utils";
import { formatTimeAgo } from "./date";
import { getBlogPosts } from "./blog";

export const getFastfetch = async () => {
    const githubStats = await fetchGithubStats();
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

    // Info lines
    const info = [];

    // User@Host
    info.push(`${red("portfolio")}${overlay("@")}${cyan("milind.dev")}`);
    info.push(overlay("--------------------------"));

    // Work
    if (experience[0]) {
        info.push(`${blue(" Work")} : ${experience[0].company}`);
    }

    // Role
    info.push(`${blue(" Role")} : ${experience[0]?.title ?? "DevOps & Backend Engineer"}`);

    // Education
    if (education[0]) {
        info.push(`${blue(" Education")} : ${education[0].institution}`);
    }

    // Experience
    info.push(`${blue(" Experience")} : ${calculateExperience(new Date(EXPERIENCE_START_DATE))}`);

    // Uptime — elapsed time since I booted. Recomputed per request, so the
    // SSH banner is as live as the web one.
    info.push(`${blue(" Uptime")} : ${formatUptime(new Date(BIRTH_DATE))}`);

    // Blog
    const blogCount = posts.length;
    if (blogCount > 0)
        info.push(`${yellow(" Blog")} ${overlay("::")} ${text(`${blogCount} articles`)} ${subtext("[READ]")}`);

    // Latest Post
    if (posts.length > 0) {
        info.push(`${magenta(" Latest Post")} : ${text(posts[0].title)}`);
    }

    // Github Stats
    if (githubStats) {
        info.push(overlay("--------------------------"));
        info.push(`${text(" Github Stats")} : Repos: ${githubStats.repos} | Followers: ${githubStats.followers} | Following: ${githubStats.following}`);

        if (githubStats.lastPush) {
            info.push(`${magenta(" Last Commit")} : ${text(githubStats.lastPush.repo)} - ${formatTimeAgo(githubStats.lastPush.at)}`);
        }
    }

    // Discord (simplified for text)
    info.push(overlay("--------------------------"));
    info.push(`${blue(" Discord")} : User ID ${DISCORD_ID}`);


    // Combine Side by Side
    // ASCII height is 27 lines. Info is around 12-15 lines.
    // We need to pad info to match or just print them. 
    // Side-by-side relies on iterating lines.

    const outputLines = [];
    const maxLines = Math.max(ascii.length, info.length);

    for (let i = 0; i < maxLines; i++) {
        const art = ascii[i] || " ".repeat(30); // simplistic padding
        const data = info[i] || "";
        // Adjust padding between art and data
        // The ascii art lines are constant length approx 28 chars? 
        // Wait, the strings contain ANSI codes, so length calculation is hard.
        // We should rely on the visual padding. 
        // The ASCII block is roughly 28 display chars wide.

        // Instead of complex ansi-aware padding, let's just use a tab or fixed visual spacer.
        // The ascii art lines provided above are fixed width visually.

        outputLines.push(`${art}   ${data}`);
    }

    return outputLines.join("\n");
};

export const getWhoami = () => {
    const lines = [];

    lines.push(`${bold(green(personalInfo.name))}`);
    lines.push("");
    lines.push(`${bold(blue(" Bio"))}`);
    lines.push(subtext(personalInfo.bio.long));

    return lines.join("\n");
};

const prettyUrl = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

// The link line under a listing row: repo in cyan, or the live site in green
// with the closed-source status spelled out rather than left to be inferred.
const linkFragment = (project: (typeof projects)[number]) => {
    const link = projectLink(project);
    if (!link) return subtext("source private");
    if (link.kind === "github") return cyan(prettyUrl(link.url));
    return `${green(prettyUrl(link.url))}  ${subtext("(source private)")}`;
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
