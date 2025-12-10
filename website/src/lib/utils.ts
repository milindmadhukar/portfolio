export const getUptime = (dob: Date) => {
    const now = new Date();
    return `${Math.round((now.getTime() - dob.getTime()) / 31556952000)} years, ${Math.ceil((now.getTime() - dob.getTime()) % 31556952000 / 2629746000)} months, ${Math.round((now.getTime() - dob.getTime()) % 31556952000 % 2629746000 / 86400000)} days`;
}



