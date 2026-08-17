package commands

import (
	"strings"
	"testing"
)

// Completion matches without regard to case, the way zsh's
// m:{a-zA-Z}={A-Za-z} matcher does.
func TestCompleteIsCaseInsensitive(t *testing.T) {
	env := testEnv()
	env.Cwd = "projects/kora"

	// The whole point: a lowercase stem finds an uppercase file, and the case
	// is corrected on the way back out. Path resolution stays case-sensitive,
	// so writing back "reaDME.md" would produce a line that cannot resolve.
	for _, typed := range []string{"rea", "REA", "ReAd", "readme.md"} {
		line := "cat " + typed
		got := Complete(env, line, len(line), '\t')
		if got.Line != "cat README.md " {
			t.Errorf("Complete(%q) = %q, want %q", line, got.Line, "cat README.md ")
		}
	}
}

// A corrected completion has to be something the shell can actually open.
func TestCaseCorrectedCompletionResolves(t *testing.T) {
	env := testEnv()
	env.Cwd = "projects/kora"

	got := Complete(env, "ls rea", len("ls rea"), '\t')
	if !got.Replace {
		t.Fatal("expected a rewrite")
	}

	// Feed the completed operand straight back in. `ls` is the probe because it
	// resolves paths without needing the content store, and `ls FILE` echoes
	// the name — so a lookup failure shows up as an error rather than silence.
	operand := strings.TrimSpace(strings.TrimPrefix(got.Line, "ls "))
	if r := Run(env, []string{"ls", operand}); r.Err != "" {
		t.Errorf("completed operand %q does not resolve: %s", operand, r.Err)
	}
}

func TestCommandNamesCompleteCaseInsensitively(t *testing.T) {
	got := Complete(testEnv(), "WHO", 3, '\t')
	if got.Line != "whoami " {
		t.Errorf("Line = %q, want %q", got.Line, "whoami ")
	}
}

func TestCaseInsensitiveDirCompletion(t *testing.T) {
	got := Complete(testEnv(), "cd PRO", 6, '\t')
	if got.Line != "cd projects/" {
		t.Errorf("Line = %q, want %q", got.Line, "cd projects/")
	}
}

// The shared prefix is compared case-insensitively but emitted with a real
// candidate's capitalisation.
func TestLongestCommonPrefixFolds(t *testing.T) {
	cases := []struct {
		items []string
		want  string
	}{
		{[]string{"README.md"}, "README.md"},
		{[]string{"README.md", "readme.txt"}, "README."},
		{[]string{"README.md", "READY.md"}, "READ"},
		{[]string{"projects", "profile"}, "pro"},
		{[]string{"blog", "projects"}, ""},
		{nil, ""},
	}
	for _, tc := range cases {
		if got := longestCommonPrefix(tc.items); got != tc.want {
			t.Errorf("longestCommonPrefix(%v) = %q, want %q", tc.items, got, tc.want)
		}
	}
}

// Multi-byte names must not be trimmed mid-rune.
func TestLongestCommonPrefixIsRuneSafe(t *testing.T) {
	got := longestCommonPrefix([]string{"café-notes.md", "café-recipes.md"})
	if got != "café-" {
		t.Errorf("got %q, want %q", got, "café-")
	}
}
