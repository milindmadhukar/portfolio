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

// The primary outbound link for a project: its repo if public, else its live
// site. `web` implies the source isn't public, which the renderers call out.
export const projectLink = (project: { links: { github: string | null; demo: string | null } }) => {
    if (project.links.github) return { kind: "github" as const, url: project.links.github };
    if (project.links.demo) return { kind: "web" as const, url: project.links.demo };
    return null;
}

// Experience as it's typically stated: whole years with a "+", months while under a year.
export const calculateExperience = (start: Date, now = new Date()) => {
    const months =
        (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const years = Math.floor(months / 12);
    if (years < 1) return `${Math.max(months, 1)} months`;
    return `${years}+ years`;
}



