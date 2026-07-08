export const getUptime = (dob: Date) => {
    const now = new Date();
    return `${Math.round((now.getTime() - dob.getTime()) / 31556952000)} years, ${Math.ceil((now.getTime() - dob.getTime()) % 31556952000 / 2629746000)} months, ${Math.round((now.getTime() - dob.getTime()) % 31556952000 % 2629746000 / 86400000)} days`;
}

// Experience as it's typically stated: whole years with a "+", months while under a year.
export const calculateExperience = (start: Date, now = new Date()) => {
    const months =
        (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const years = Math.floor(months / 12);
    if (years < 1) return `${Math.max(months, 1)} months`;
    return `${years}+ years`;
}



