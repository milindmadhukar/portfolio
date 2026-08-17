package commands

import (
	"context"
	"strings"
	"testing"

	"github.com/muesli/termenv"

	"github.com/milindmadhukar/portfolio/ssh-server/content"
	"github.com/milindmadhukar/portfolio/ssh-server/vfs"
)

// testEnv mirrors the shape of the real tree without any network: two
// directories, a nested one, a pre-rendered file, and a markdown file.
func testEnv() *Env {
	snap := &content.Snapshot{
		Whoami: "whoami output",
		Help:   "help output",
		Entries: map[string][]vfs.Entry{
			vfs.Root: {
				{Name: "projects", Kind: "dir"},
				{Name: "blog", Kind: "dir"},
				{Name: "about.md", Kind: "file"},
			},
			"projects":      {{Name: "kora", Kind: "dir"}},
			"projects/kora": {{Name: "README.md", Kind: "file"}},
			"blog":          {{Name: "a-post.md", Kind: "file"}},
		},
		Listings: map[string]string{
			vfs.Root:        "root listing",
			"projects":      "projects listing",
			"projects/kora": "kora listing",
			"blog":          "blog listing",
		},
		Files: map[string]string{"about.md": "the about text"},
	}

	return &Env{
		Ctx:     context.Background(),
		Snap:    snap,
		Tree:    snap.Tree(),
		Width:   80,
		Profile: termenv.Ascii,
	}
}

func TestPwdFollowsCd(t *testing.T) {
	env := testEnv()

	if got := Run(env, []string{"pwd"}).Out; got != "/home/milind\n" {
		t.Errorf("pwd at root = %q", got)
	}

	if r := Run(env, []string{"cd", "projects"}); r.Code != 0 {
		t.Fatalf("cd projects failed: %q", r.Err)
	}
	if env.Cwd != "projects" {
		t.Fatalf("cwd = %q, want %q", env.Cwd, "projects")
	}
	if got := Run(env, []string{"pwd"}).Out; got != "/home/milind/projects\n" {
		t.Errorf("pwd = %q", got)
	}

	// Descend, then climb further than the root goes.
	Run(env, []string{"cd", "kora"})
	if env.Cwd != "projects/kora" {
		t.Fatalf("cwd = %q", env.Cwd)
	}
	Run(env, []string{"cd", "../../.."})
	if env.Cwd != "" {
		t.Errorf("cwd after climbing past root = %q, want root", env.Cwd)
	}
}

func TestCdDashSwapsBack(t *testing.T) {
	env := testEnv()
	Run(env, []string{"cd", "blog"})
	// Absolute, because a bare `projects` would resolve against the cwd to
	// blog/projects — which is exactly what a shell should do, and not what
	// this test is about.
	Run(env, []string{"cd", "~/projects"})
	if env.Cwd != "projects" {
		t.Fatalf("setup: cwd = %q, want projects", env.Cwd)
	}

	r := Run(env, []string{"cd", "-"})
	if env.Cwd != "blog" {
		t.Errorf("cd - landed at %q, want blog", env.Cwd)
	}
	// zsh echoes the directory it moved to.
	if !strings.Contains(r.Out, "/home/milind/blog") {
		t.Errorf("cd - output = %q", r.Out)
	}
}

// The error text is the part of a shell people actually notice.
func TestErrorMessages(t *testing.T) {
	cases := []struct {
		argv []string
		want string
		code int
	}{
		{[]string{"cd", "nope"}, "cd: no such file or directory: nope\n", 1},
		{[]string{"cd", "about.md"}, "cd: not a directory: about.md\n", 1},
		{[]string{"cd", "a", "b"}, "cd: too many arguments\n", 1},
		{[]string{"ls", "nope"}, "ls: cannot access 'nope': No such file or directory\n", 2},
		{[]string{"cat"}, "cat: missing operand\n", 1},
		{[]string{"cat", "projects"}, "cat: projects: Is a directory\n", 1},
		{[]string{"cat", "nope.md"}, "cat: nope.md: No such file or directory\n", 1},
		{[]string{"bogus"}, "command not found: bogus\n", 127},
	}

	for _, tc := range cases {
		t.Run(strings.Join(tc.argv, " "), func(t *testing.T) {
			r := Run(testEnv(), tc.argv)
			if r.Err != tc.want {
				t.Errorf("Err = %q, want %q", r.Err, tc.want)
			}
			if r.Code != tc.code {
				t.Errorf("Code = %d, want %d", r.Code, tc.code)
			}
		})
	}
}

func TestLsIsCwdRelative(t *testing.T) {
	env := testEnv()
	if got := Run(env, []string{"ls"}).Out; got != "root listing\n" {
		t.Errorf("ls at root = %q", got)
	}
	Run(env, []string{"cd", "projects"})
	if got := Run(env, []string{"ls"}).Out; got != "projects listing\n" {
		t.Errorf("ls in projects = %q", got)
	}
	// A path operand resolves against the cwd.
	if got := Run(env, []string{"ls", "kora"}).Out; got != "kora listing\n" {
		t.Errorf("ls kora = %q", got)
	}
	// And an absolute one ignores it.
	if got := Run(env, []string{"ls", "~/blog"}).Out; got != "blog listing\n" {
		t.Errorf("ls ~/blog = %q", got)
	}
}

// Flags cannot change a listing the website already rendered, so they are
// swallowed rather than treated as paths.
func TestLsIgnoresFlags(t *testing.T) {
	if got := Run(testEnv(), []string{"ls", "-la"}).Out; got != "root listing\n" {
		t.Errorf("ls -la = %q", got)
	}
}

// `ls FILE` echoes the name, the way real ls does.
func TestLsOnAFile(t *testing.T) {
	if got := Run(testEnv(), []string{"ls", "about.md"}).Out; got != "about.md\n" {
		t.Errorf("ls about.md = %q", got)
	}
}

// A pre-rendered body wins over the markdown path even for a .md name.
func TestCatPrefersPreRendered(t *testing.T) {
	r := Run(testEnv(), []string{"cat", "about.md"})
	if r.Out != "the about text\n" {
		t.Errorf("cat about.md = %q", r.Out)
	}
	if r.Code != 0 {
		t.Errorf("Code = %d", r.Code)
	}
}

func TestExitAndClear(t *testing.T) {
	if !Run(testEnv(), []string{"exit"}).Exit {
		t.Error("exit did not signal Exit")
	}
	if !Run(testEnv(), []string{"clear"}).Clear {
		t.Error("clear did not signal Clear")
	}
}
