export const ANSI = {
    RESET: "\u001b[0m",
    BOLD: "\u001b[1m",

    // Catppuccin Mocha Palette (Approximate ANSI 256 or TrueColor)
    // Using standard ANSI colors where possible for better compatibility, 
    // or specific RGB/256 codes if needed. Let's stick to standard extended colors for now.

    // Standard mapped
    RED: "\u001b[31m",
    GREEN: "\u001b[32m",
    YELLOW: "\u001b[33m",
    BLUE: "\u001b[34m",
    MAGENTA: "\u001b[35m", // Pink/Mauve
    CYAN: "\u001b[36m",    // Teal/Sky
    WHITE: "\u001b[37m",

    // Specific Catppuccin approximations
    ROSEWATER: "\u001b[38;5;224m",
    FLAMINGO: "\u001b[38;5;217m",
    PINK: "\u001b[38;5;212m",
    MAUVE: "\u001b[38;5;183m",
    RED_CTP: "\u001b[38;5;203m",
    MAROON: "\u001b[38;5;167m",
    PEACH: "\u001b[38;5;209m",
    YELLOW_CTP: "\u001b[38;5;221m",
    GREEN_CTP: "\u001b[38;5;120m",
    TEAL: "\u001b[38;5;158m",
    SKY: "\u001b[38;5;117m",
    SAPPHIRE: "\u001b[38;5;75m",
    BLUE_CTP: "\u001b[38;5;111m",
    LAVENDER: "\u001b[38;5;147m",
    TEXT: "\u001b[38;5;254m",
    SUBTEXT1: "\u001b[38;5;248m",
    SUBTEXT0: "\u001b[38;5;243m",
    OVERLAY2: "\u001b[38;5;240m",
    OVERLAY1: "\u001b[38;5;237m",
    OVERLAY0: "\u001b[38;5;235m",
};

export const wrap = (text: string, color: string) => `${color}${text}${ANSI.RESET}`;

export const green = (text: string) => wrap(text, ANSI.GREEN_CTP);
export const red = (text: string) => wrap(text, ANSI.RED_CTP);
export const blue = (text: string) => wrap(text, ANSI.BLUE_CTP);
export const sapphire = (text: string) => wrap(text, ANSI.SAPPHIRE);
export const yellow = (text: string) => wrap(text, ANSI.YELLOW_CTP);
export const magenta = (text: string) => wrap(text, ANSI.MAUVE);
export const cyan = (text: string) => wrap(text, ANSI.TEAL);
export const peach = (text: string) => wrap(text, ANSI.PEACH);
export const mauve = (text: string) => wrap(text, ANSI.MAUVE);
export const text = (text: string) => wrap(text, ANSI.TEXT);
export const subtext = (text: string) => wrap(text, ANSI.SUBTEXT0);
export const overlay = (text: string) => wrap(text, ANSI.OVERLAY1);
export const bold = (text: string) => `${ANSI.BOLD}${text}${ANSI.RESET}`;

// --- Measuring -------------------------------------------------------------
// Anything that wants to line two columns up, or size a rule to its content,
// needs the *visible* width of a string. `.length` is wrong twice over here:
// the escape sequences above are zero-width, and astral code points count as
// two UTF-16 units.

const SGR = /\u001B\[[0-9;]*[A-Za-z]/g;

export const stripAnsi = (s: string) => s.replace(SGR, "");

const isZeroWidth = (cp: number) =>
    cp === 0x200d || // ZWJ
    (cp >= 0x0300 && cp <= 0x036f) || // combining diacriticals
    (cp >= 0xfe00 && cp <= 0xfe0f); // variation selectors

// Ranges that occupy two terminal cells. Notably absent: the Private Use
// Areas. The Nerd Font icons embedded in the fastfetch labels live there, and
// we ship the *Mono* variant (SymbolsNerdFontMono), which is drawn one cell
// wide — counting them as two would over-measure every icon'd line.
const WIDE: ReadonlyArray<readonly [number, number]> = [
    [0x1100, 0x115f],
    [0x2e80, 0x303e],
    [0x3041, 0x33ff],
    [0x3400, 0x4dbf],
    [0x4e00, 0x9fff],
    [0xa000, 0xa4cf],
    [0xac00, 0xd7a3],
    [0xf900, 0xfaff],
    [0xfe30, 0xfe6f],
    [0xff00, 0xff60],
    [0xffe0, 0xffe6],
    [0x1f300, 0x1f64f],
    [0x1f900, 0x1f9ff],
    [0x20000, 0x2fffd],
    [0x30000, 0x3fffd],
];

export const displayWidth = (s: string) => {
    let width = 0;
    // for..of iterates code points, not UTF-16 units.
    for (const ch of stripAnsi(s)) {
        const cp = ch.codePointAt(0)!;
        if (isZeroWidth(cp)) continue;
        width += WIDE.some(([lo, hi]) => cp >= lo && cp <= hi) ? 2 : 1;
    }
    return width;
};

// padEnd, but counting cells instead of characters — so it survives colour.
export const padEndDisplay = (s: string, width: number) =>
    s + " ".repeat(Math.max(0, width - displayWidth(s)));
