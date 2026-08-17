// Package session drives one SSH connection: the readline loop, the prompt,
// terminal size, and the bridge between what someone types and package
// commands.
package session

import (
	"fmt"
	"io"
	"strings"
	"sync/atomic"

	"github.com/anmitsu/go-shlex"
	"github.com/charmbracelet/ssh"
	"github.com/charmbracelet/x/ansi"
	"github.com/muesli/termenv"
	xterm "golang.org/x/term"

	"github.com/milindmadhukar/portfolio/ssh-server/commands"
	"github.com/milindmadhukar/portfolio/ssh-server/content"
	"github.com/milindmadhukar/portfolio/ssh-server/vfs"
)

// Catppuccin, matching website/src/lib/ansi.ts so the prompt sits in the same
// palette as everything the website renders.
const (
	cRed      = "\033[38;5;203m"
	cBlue     = "\033[38;5;117m"
	cGrey     = "\033[38;5;240m"
	cMauve    = "\033[38;5;183m"
	cLavender = "\033[38;5;147m"
	cReset    = "\033[0m"
)

// Fallbacks for a session with no PTY (`ssh host cat file | less`).
const (
	fallbackWidth  = 80
	fallbackHeight = 24
)

type Session struct {
	s     ssh.Session
	store *content.Store
	term  *xterm.Terminal

	cwd     string
	prevCwd string

	// Written by the window-change goroutine, read by command handlers.
	width atomic.Int32

	profile termenv.Profile
	hasPty  bool
}

func New(s ssh.Session, store *content.Store) *Session {
	ss := &Session{s: s, store: store}

	pty, winCh, hasPty := s.Pty()
	ss.hasPty = hasPty

	w, h := fallbackWidth, fallbackHeight
	if hasPty && pty.Window.Width > 0 {
		w, h = pty.Window.Width, pty.Window.Height
	}
	ss.width.Store(int32(w))
	ss.profile = profileFor(pty.Term, hasPty)

	if hasPty {
		ss.term = xterm.NewTerminal(s, "")
		// x/term otherwise assumes 80x24 forever, which wraps the prompt on
		// narrow windows and wastes wide ones.
		_ = ss.term.SetSize(w, h)

		// This goroutine is not optional. charmbracelet/ssh sends on winCh
		// *blocking*, and the channel is created with a buffer of one that is
		// already filled with the initial window — so the first resize would
		// deadlock the session's request loop forever if nobody drained it.
		go func() {
			for win := range winCh {
				if win.Width <= 0 {
					continue
				}
				ss.width.Store(int32(win.Width))
				_ = ss.term.SetSize(win.Width, win.Height)
			}
		}()
	}

	return ss
}

// profileFor decides how much colour to emit. Deliberately defaults to
// ANSI256: the website's palette is 256-colour indices, so rendering markdown
// at the same depth makes glamour's output and the pre-rendered listings look
// like one program rather than two.
func profileFor(term string, hasPty bool) termenv.Profile {
	if !hasPty || term == "" || term == "dumb" {
		return termenv.Ascii
	}
	return termenv.ANSI256
}

func (ss *Session) env() *commands.Env {
	return &commands.Env{
		Ctx:     ss.s.Context(),
		Store:   ss.store,
		Cwd:     ss.cwd,
		PrevCwd: ss.prevCwd,
		Width:   int(ss.width.Load()),
		Profile: ss.profile,
	}
}

// load attaches the current content snapshot to an env. Split out because it
// can fail, and every caller has to decide what to do about that.
func (ss *Session) load(env *commands.Env) error {
	snap, err := ss.store.Snapshot(env.Ctx)
	if err != nil {
		return err
	}
	env.Snap = snap
	env.Tree = snap.Tree()
	return nil
}

func (ss *Session) prompt() string {
	return fmt.Sprintf("%s❯ %s%s%s@%smilind.dev %s%s%s ",
		cMauve,
		cRed, ss.s.User(),
		cGrey,
		cBlue,
		cLavender, vfs.Display(ss.cwd),
		cReset,
	)
}

// write sends command output to the right stream, stripping colour when the
// far end is not a terminal so piping produces clean text.
func (ss *Session) write(r commands.Result) {
	if r.Out != "" {
		fmt.Fprint(ss.s, ss.plain(r.Out))
	}
	if r.Err != "" {
		fmt.Fprint(ss.s.Stderr(), ss.plain(r.Err))
	}
}

func (ss *Session) plain(s string) string {
	if ss.profile == termenv.Ascii {
		return ansi.Strip(s)
	}
	return s
}

// Run is the whole session.
func (ss *Session) Run() {
	// Exec mode: `ssh milind.dev whoami`. Previously ignored, which dropped
	// these into the interactive loop against a non-PTY session.
	if argv := ss.s.Command(); len(argv) > 0 {
		_ = ss.s.Exit(ss.RunOnce(argv))
		return
	}
	if sub := ss.s.Subsystem(); sub != "" {
		fmt.Fprintf(ss.s.Stderr(), "%s: subsystem not supported\n", sub)
		_ = ss.s.Exit(1)
		return
	}
	if !ss.hasPty {
		fmt.Fprintln(ss.s.Stderr(), "no tty; try: ssh milind.dev <command>")
		_ = ss.s.Exit(1)
		return
	}

	// Pasted multi-line text arrives as one line rather than executing a line
	// at a time as it lands.
	ss.term.SetBracketedPasteMode(true)
	ss.term.AutoCompleteCallback = func(line string, pos int, key rune) (string, int, bool) {
		env := ss.env()
		if err := ss.load(env); err != nil {
			return "", 0, false
		}
		c := commands.Complete(env, line, pos, key)
		if len(c.Candidates) > 0 {
			// Writing through the terminal clears the current line and redraws
			// the prompt afterwards.
			fmt.Fprintf(ss.term, "%s\r\n", strings.Join(c.Candidates, "  "))
		}
		return c.Line, c.Pos, c.Replace
	}

	ss.banner()

	for {
		ss.term.SetPrompt(ss.prompt())

		line, err := ss.term.ReadLine()
		if err != nil {
			// ErrPasteIndicator comes back *with* a usable line; treating it
			// as fatal used to drop the session on any paste.
			if err == xterm.ErrPasteIndicator {
				// fall through with the line we got
			} else {
				if err != io.EOF {
					return
				}
				fmt.Fprintln(ss.s)
				return
			}
		}

		argv, perr := shlex.Split(line, true)
		if perr != nil {
			fmt.Fprintf(ss.s.Stderr(), "parse error: %v\n", perr)
			continue
		}
		if len(argv) == 0 {
			continue
		}

		env := ss.env()
		if err := ss.load(env); err != nil {
			fmt.Fprintf(ss.s.Stderr(), "content service unreachable: %v\n", err)
			continue
		}

		r := commands.Run(env, argv)
		ss.cwd, ss.prevCwd = env.Cwd, env.PrevCwd

		if r.Clear {
			// 3J also drops the scrollback, which is what modern terminals do.
			fmt.Fprint(ss.s, "\033[H\033[2J\033[3J")
			continue
		}
		ss.write(r)
		if r.Exit {
			fmt.Fprintln(ss.s, "Goodbye!")
			return
		}
	}
}

// RunOnce executes a single command for exec mode and returns its exit code.
func (ss *Session) RunOnce(argv []string) int {
	env := ss.env()
	if err := ss.load(env); err != nil {
		fmt.Fprintf(ss.s.Stderr(), "content service unreachable: %v\n", err)
		return 1
	}
	r := commands.Run(env, argv)
	ss.write(r)
	return r.Code
}

func (ss *Session) banner() {
	env := ss.env()
	if err := ss.load(env); err != nil {
		fmt.Fprintf(ss.s.Stderr(), "content service unreachable: %v\n", err)
		return
	}
	fmt.Fprint(ss.s, env.Snap.Fastfetch+"\n")
	fmt.Fprintln(ss.s, "Type 'help' for more commands")
}
