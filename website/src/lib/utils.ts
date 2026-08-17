// Calendar-accurate elapsed time since `dob`, plus the raw elapsed seconds —
// "22 years, 3 months, 19 days (701203847)". Shared by the live web counter and
// the server-rendered SSH output so the two can never drift apart.
export const formatUptime = (dob: Date, now = new Date()) => {
    let years = now.getFullYear() - dob.getFullYear();
    let months = now.getMonth() - dob.getMonth();
    let days = now.getDate() - dob.getDate();

    if (days < 0) {
        months--;
        // Borrow from the previous month, whatever length it happens to be.
        days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    const seconds = Math.floor((now.getTime() - dob.getTime()) / 1000);

    return `${years} years, ${months} months, ${days} days (${seconds})`;
}

// "1 article" / "2 articles". Lives here rather than in either renderer because
// the count is stated on both surfaces, and a copy each is how they drift.
export const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
    `${count} ${count === 1 ? singular : plural}`;

// 154900 -> "155k". Keeps counts short enough that a fastfetch row holding
// several of them still fits the column.
export const compactNumber = (count: number): string => {
    if (count < 1000) return String(count);
    if (count < 1_000_000) {
        const thousands = Math.round(count / 1000);
        // 999_500 rounds to 1000, which would read as "1000k" rather than
        // rolling over — fall through to millions instead.
        if (thousands < 1000) return `${thousands}k`;
    }
    return `${(count / 1_000_000).toFixed(1)}M`;
};

type LinkedProject = {
    links: { github: string | null; demo: string | null };
    extraLinks?: readonly { label: string; url: string }[];
};

// Every place a project can be found, live site first. This used to return a
// single link, which silently hid the demo on any project that also had a repo
// — stonksapi's site was in the data all along and never rendered — and left
// no way to show a project that spans several repos.
export const projectLinks = (project: LinkedProject) => {
    const out: { kind: "github" | "web"; url: string; label?: string }[] = [];
    if (project.links.demo) out.push({ kind: "web", url: project.links.demo });
    if (project.links.github) out.push({ kind: "github", url: project.links.github });
    for (const extra of project.extraLinks ?? [])
        out.push({ kind: "github", url: extra.url, label: extra.label });
    return out;
}

// True only when there is genuinely nothing public to read.
export const hasPublicSource = (project: LinkedProject) =>
    Boolean(project.links.github) || (project.extraLinks?.length ?? 0) > 0;

// Experience as it's typically stated: whole years with a "+", months while under a year.
export const calculateExperience = (start: Date, now = new Date()) => {
    const months =
        (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const years = Math.floor(months / 12);
    if (years < 1) return `${Math.max(months, 1)} months`;
    return `${years}+ years`;
}



