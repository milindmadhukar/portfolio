import { useEffect, useState } from "react";

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

        // Apply theme to document
        if (theme === "latte") {
            root.classList.add("latte");
        } else {
            root.classList.remove("latte");
        }

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
                className="fixed top-6 right-6 z-50 w-10 h-10 rounded-lg bg-ctp-surface0 border border-ctp-surface1 flex items-center justify-center transition-all duration-300 hover:bg-ctp-surface1"
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
            className="fixed top-6 right-6 z-50 w-10 h-10 rounded-lg bg-ctp-surface0 latte:bg-ctp-surface0 border border-ctp-surface1 latte:border-ctp-surface1 flex items-center justify-center transition-all duration-300 hover:bg-ctp-surface1 latte:hover:bg-ctp-surface1 hover:scale-110 active:scale-95"
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
