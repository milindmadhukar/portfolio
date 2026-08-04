// The ordered command sequence the web terminal steps through. Both terminals,
// the desktop rail, and the [cmd] route all read this, so the order, the slugs
// and the typed text can't drift apart.
//
// This is *web navigation chrome*, not the command set itself — the commands
// the SSH surface serves live in `terminal-commands.ts`. Adding an entry here
// only adds a page to step through; it does not create a shell command.
export interface TerminalState {
  /** Stable id. Drives every DOM id (`state-<key>`, `output-<key>`, …). */
  key: string;
  /** The text typed at the prompt. Shown verbatim in the rail's hover chip. */
  command: string;
  /** The URL this state owns. */
  path: string;
  /** Pause before the typing starts, ms. */
  startDelay: number;
}

export const TERMINAL_STATES: TerminalState[] = [
  { key: "fastfetch", command: "fastfetch", path: "/", startDelay: 0 },
  { key: "whoami", command: "whoami", path: "/whoami", startDelay: 500 },
  { key: "projects", command: "ls projects/", path: "/projects", startDelay: 500 },
];

export const DEFAULT_STATE_KEY = TERMINAL_STATES[0].key;

/**
 * Resolve the `[cmd]` path segment to a state index, or -1 if it isn't one.
 *
 * `/fastfetch` is accepted as an alias so every command has a literal URL, even
 * though the first state's canonical path is the bare `/` — we never rewrite
 * the homepage into a slug.
 */
export function stateIndexForSlug(slug: string | undefined): number {
  if (!slug) return 0;
  return TERMINAL_STATES.findIndex((state) => state.key === slug);
}

export function stateIndexForKey(key: string | undefined): number {
  const index = TERMINAL_STATES.findIndex((state) => state.key === key);
  return index === -1 ? 0 : index;
}
