// Package commands is the shell itself: dispatch, and the handful of builtins.
//
// Almost nothing here produces content. `ls` prints a listing the website
// rendered, `whoami` prints a string the website rendered; the only thing this
// package composes on its own are the error messages, which is exactly the part
// that has to feel like a shell.
package commands

import (
	"context"
	"fmt"
	"sort"
	"strings"

	"github.com/muesli/termenv"

	"github.com/milindmadhukar/portfolio/ssh-server/content"
	"github.com/milindmadhukar/portfolio/ssh-server/render"
	"github.com/milindmadhukar/portfolio/ssh-server/vfs"
)

// Env is one session's view of the world. Cwd and PrevCwd are mutated by `cd`;
// everything else is read-only for the length of a command.
type Env struct {
	Ctx     context.Context
	Store   *content.Store
	Snap    *content.Snapshot
	Tree    *vfs.Tree
	Cwd     string
	PrevCwd string
	Width   int
	Profile termenv.Profile
}

// Result is what the session loop acts on. Splitting Out and Err matters in
// exec mode, where they go to different streams.
type Result struct {
	Out   string
	Err   string
	Code  int
	Clear bool
	Exit  bool
}

func out(s string) Result { return Result{Out: s} }

func fail(format string, args ...any) Result {
	return Result{Err: fmt.Sprintf(format, args...), Code: 1}
}

// Names is the completion vocabulary, sorted.
var Names = []string{
	"blog", "cat", "cd", "clear", "exit", "fastfetch",
	"help", "ls", "projects", "pwd", "uptime", "whoami",
}

// pathArgs are the commands whose operands are paths, for tab completion.
var pathArgs = map[string]bool{"cd": true, "cat": true, "ls": true}

// Run executes one parsed command line.
func Run(env *Env, argv []string) Result {
	if len(argv) == 0 {
		return Result{}
	}

	name, args := argv[0], argv[1:]

	switch name {
	case "cd":
		return cd(env, args)
	case "pwd":
		return out(vfs.Abs(env.Cwd) + "\n")
	case "ls":
		return ls(env, args)
	case "cat":
		return cat(env, args)
	case "clear":
		return Result{Clear: true}
	case "exit", "logout":
		return Result{Exit: true}
	case "help":
		return out(env.Snap.Help + "\n")
	case "whoami":
		return out(env.Snap.Whoami + "\n")
	case "fastfetch":
		return out(env.Snap.Fastfetch + "\n")
	case "uptime":
		return out(env.Snap.Uptime + "\n")

	// Shortcuts that predate the filesystem. Kept because they are in the
	// muscle memory of anyone who used the old server, and they read fine.
	case "projects":
		return listDir(env, "projects", "projects")
	case "blog":
		return listDir(env, "blog", "blog")

	default:
		return Result{
			Err:  fmt.Sprintf("command not found: %s\n", name),
			Code: 127,
		}
	}
}

func cd(env *Env, args []string) Result {
	if len(args) > 1 {
		return fail("cd: too many arguments\n")
	}

	target := ""
	switch {
	case len(args) == 0:
		// Bare `cd` goes home.
	case args[0] == "-":
		target = env.PrevCwd
	default:
		target = vfs.Resolve(env.Cwd, args[0])
	}

	switch {
	case env.Tree.IsDir(target):
		env.PrevCwd, env.Cwd = env.Cwd, target
		if len(args) > 0 && args[0] == "-" {
			// zsh echoes the directory it moved to when you use `-`.
			return out(vfs.Abs(env.Cwd) + "\n")
		}
		return Result{}
	case env.Tree.IsFile(target):
		return fail("cd: not a directory: %s\n", args[0])
	default:
		return fail("cd: no such file or directory: %s\n", args[0])
	}
}

func ls(env *Env, args []string) Result {
	// The listings are rendered server-side, so flags cannot change them.
	// Swallowing them is friendlier than "command not found"-ing someone's
	// reflexive `ls -la`.
	operands := make([]string, 0, len(args))
	for _, a := range args {
		if strings.HasPrefix(a, "-") && a != "-" {
			continue
		}
		operands = append(operands, a)
	}

	if len(operands) == 0 {
		return listDir(env, env.Cwd, ".")
	}
	if len(operands) == 1 {
		return listOne(env, operands[0])
	}

	// Multiple operands: GNU prints files first, then each directory under a
	// `path:` header.
	var sb, errs strings.Builder
	code := 0
	var dirs []string
	for _, operand := range operands {
		p := vfs.Resolve(env.Cwd, operand)
		switch {
		case env.Tree.IsFile(p):
			sb.WriteString(operand + "\n")
		case env.Tree.IsDir(p):
			dirs = append(dirs, operand)
		default:
			errs.WriteString(fmt.Sprintf("ls: cannot access '%s': No such file or directory\n", operand))
			code = 2
		}
	}
	for i, operand := range dirs {
		if sb.Len() > 0 || i > 0 {
			sb.WriteString("\n")
		}
		sb.WriteString(operand + ":\n")
		if listing, ok := env.Tree.Listing(vfs.Resolve(env.Cwd, operand)); ok {
			sb.WriteString(listing + "\n")
		}
	}
	return Result{Out: sb.String(), Err: errs.String(), Code: code}
}

func listOne(env *Env, operand string) Result {
	p := vfs.Resolve(env.Cwd, operand)
	switch {
	case env.Tree.IsDir(p):
		return listDir(env, p, operand)
	case env.Tree.IsFile(p):
		// `ls FILE` echoes the name, as real ls does.
		return out(operand + "\n")
	default:
		return Result{
			Err:  fmt.Sprintf("ls: cannot access '%s': No such file or directory\n", operand),
			Code: 2,
		}
	}
}

func listDir(env *Env, path, operand string) Result {
	listing, ok := env.Tree.Listing(path)
	if !ok {
		return Result{
			Err:  fmt.Sprintf("ls: cannot access '%s': No such file or directory\n", operand),
			Code: 2,
		}
	}
	return out(listing + "\n")
}

func cat(env *Env, args []string) Result {
	if len(args) == 0 {
		// Real cat would read stdin here. This shell has no stdin to give it —
		// doing that would just hang the readline loop.
		return fail("cat: missing operand\n")
	}

	var sb, errs strings.Builder
	code := 0

	for _, operand := range args {
		p := vfs.Resolve(env.Cwd, operand)

		switch {
		case env.Tree.IsDir(p):
			errs.WriteString(fmt.Sprintf("cat: %s: Is a directory\n", operand))
			code = 1

		case !env.Tree.IsFile(p):
			errs.WriteString(fmt.Sprintf("cat: %s: No such file or directory\n", operand))
			code = 1

		// A pre-rendered body wins over the markdown path even for a .md name.
		// about.md is the case: it is prose authored one line per line, and
		// running it through a markdown renderer would reflow those breaks into
		// a single paragraph, which is not how either surface presents it.
		case hasPreRendered(env, p):
			body, _ := env.Tree.File(p)
			sb.WriteString(body + "\n")

		case vfs.IsMarkdown(p):
			body, err := env.Store.Markdown(env.Ctx, p)
			if err != nil {
				errs.WriteString(fmt.Sprintf("cat: %s: cannot reach content service\n", operand))
				code = 1
				continue
			}
			rendered, err := render.Markdown(body, env.Width, env.Profile)
			if err != nil {
				// Falling back to the source beats printing nothing.
				sb.WriteString(body)
				continue
			}
			sb.WriteString(rendered)

		default:
			// A file the tree lists but nothing can produce a body for. Should
			// not happen; say so honestly rather than printing nothing.
			errs.WriteString(fmt.Sprintf("cat: %s: cannot read file\n", operand))
			code = 1
		}
	}

	return Result{Out: sb.String(), Err: errs.String(), Code: code}
}

func hasPreRendered(env *Env, path string) bool {
	_, ok := env.Tree.File(path)
	return ok
}

// Candidates lists what could follow the given partial word, for completion.
// It never touches the network — the tree is a snapshot taken between commands.
func Candidates(env *Env, cmd, word string) []string {
	if cmd == "" {
		return matches(Names, word)
	}
	if !pathArgs[cmd] {
		return nil
	}

	// Split at the last slash: the directory part is kept verbatim so `~/pro`
	// completes to `~/projects` rather than being rewritten to an absolute path.
	dirPart, stem := "", word
	if i := strings.LastIndex(word, "/"); i >= 0 {
		dirPart, stem = word[:i+1], word[i+1:]
	}

	base := vfs.Resolve(env.Cwd, dirPart)
	var found []string
	for _, e := range env.Tree.Children(base) {
		if !hasPrefixFold(e.Name, stem) {
			continue
		}
		if cmd == "cd" && e.Kind != "dir" {
			continue
		}
		name := e.Name
		if e.Kind == "dir" {
			name += "/"
		}
		found = append(found, dirPart+name)
	}
	// Fold-aware, so an uppercase name like README.md sorts among the others
	// rather than ahead of every lowercase one the way byte order would put it.
	sort.Slice(found, func(i, j int) bool {
		li, lj := strings.ToLower(found[i]), strings.ToLower(found[j])
		if li != lj {
			return li < lj
		}
		return found[i] < found[j]
	})
	return found
}

func matches(candidates []string, word string) []string {
	var found []string
	for _, c := range candidates {
		if hasPrefixFold(c, word) {
			found = append(found, c)
		}
	}
	return found
}

// hasPrefixFold is strings.HasPrefix, ignoring case.
//
// Completion matches case-insensitively so `rea<tab>` finds README.md, the way
// zsh's m:{a-zA-Z}={A-Za-z} matcher does. Resolution stays case-sensitive —
// this tree is a map, and a real filesystem on Linux would not accept
// `cat readme.md` either. The two only stay consistent because completion
// always writes back the *candidate's* case, so what lands on the line is a
// path that resolves.
func hasPrefixFold(s, prefix string) bool {
	return strings.HasPrefix(strings.ToLower(s), strings.ToLower(prefix))
}
