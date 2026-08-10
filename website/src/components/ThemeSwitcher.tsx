import { useEffect, useState } from "react";

// Shared by the pre-mount placeholder and the hydrated button — if the two ever
// disagree on position or size, the button visibly jumps on hydration.
//
// It shrinks and tucks in below lg: the button is fixed, so at top-6/w-10 it sat
// squarely over the first prompt line on a phone and swallowed `fastfetch` on
// narrow screens. Paired with the pt-20 on the mobile terminal wrapper in
// TerminalPage.astro, content now starts well clear of it.
const POSITION =
    "fixed top-4 right-4 w-9 h-9 lg:top-6 lg:right-6 lg:w-10 lg:h-10 z-50 rounded-lg bg-ctp-surface0 border border-ctp-surface1 flex items-center justify-center transition-all duration-300 hover:bg-ctp-surface1";

export default function ThemeSwitcher() {
    const [theme, setTheme] = useState<"mocha" | "latte">("mocha");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Get initial theme from localStorage or system preference
        const storedTheme = localStorage.getItem("theme") as "mocha" | "latte" | null;

        if (storedTheme) {
            setTheme(storedTheme);
        } else {
            // Check system preference
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            setTheme(prefersDark ? "mocha" : "latte");
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;

        // Suppress CSS transitions for one frame so theme-driven colors (e.g. the
        // Spotify and GitHub links, which use transition-colors for hover) recolor
        // instantly instead of visibly lagging behind the rest of the page.
        root.classList.add("theme-switching");

        // Both classes are set explicitly, never just toggled off. Catppuccin
        // publishes its dark values under a prefers-color-scheme media query,
        // so dropping .latte only hands control back to the OS - on a
        // light-mode device that made this button appear dead. .mocha pins the
        // dark palette. See the matching comment in Layout.astro.
        root.classList.toggle("latte", theme === "latte");
        root.classList.toggle("mocha", theme === "mocha");

        // Persist to localStorage
        localStorage.setItem("theme", theme);

        // Force a reflow so the transition-less recolor is committed, then
        // re-enable transitions on the next frame.
        void root.offsetHeight;
        requestAnimationFrame(() => {
            root.classList.remove("theme-switching");
        });
    }, [theme, mounted]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "mocha" ? "latte" : "mocha"));
    };

    // Prevent hydration mismatch by not rendering until mounted
    if (!mounted) {
        return (
            <button
                className={POSITION}
                aria-label="Toggle theme"
            >
                <span className="text-ctp-text">
                    <i className="nf nf-fa-adjust text-lg"></i>
                </span>
            </button>
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className={`${POSITION} latte:bg-ctp-surface0 latte:border-ctp-surface1 latte:hover:bg-ctp-surface1 hover:scale-110 active:scale-95`}
            aria-label={`Switch to ${theme === "mocha" ? "light" : "dark"} theme`}
            title={`Switch to ${theme === "mocha" ? "light" : "dark"} theme`}
        >
            <span className="text-ctp-text latte:text-ctp-text transition-transform duration-300">
                {theme === "mocha" ? (
                    <i className="nf nf-fa-sun_o text-lg"></i>
                ) : (
                    <i className="nf nf-fa-moon_o text-lg"></i>
                )}
            </span>
        </button>
    );
}
