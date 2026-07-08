
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
    DISCORD_ID,
} from "./constants";
import { fetchGithubStats } from "./github";
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

    // Role
    info.push(`${blue(" Role")} : ${experience[0]?.title ?? "DevOps & Backend Engineer"}`);

    // Work
    if (experience[0]) {
        info.push(`${blue(" Work")} : ${experience[0].company}`);
    }

    // Education
    if (education[0]) {
        info.push(`${blue(" Education")} : ${education[0].institution}`);
    }

    // Experience
    info.push(`${blue(" Experience")} : 5 years, 4 clients, 8 projects`);

    // Uptime (Mock for static)
    // Note: Uptime is tricky since it's client-side JS. We'll put a placeholder or basic calcs.
    // Or just "Forever" as it's an SSH session mostly.
    info.push(`${blue(" Uptime")} : Forever`);

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
    lines.push(`${overlay(personalInfo.tagline)}`);
    lines.push("");
    lines.push(personalInfo.bio.short);
    lines.push("");
    lines.push(`${bold(blue(" Bio"))}`);
    lines.push(subtext(personalInfo.bio.long));

    return lines.join("\n");
};

export const getHelp = () => {
    return `Available commands:
  ${green("fastfetch")}  - Display system information
  ${green("whoami")}     - Display user information
  ${green("help")}       - Show this help message
  ${green("exit")}       - Close the connection
`;
};
