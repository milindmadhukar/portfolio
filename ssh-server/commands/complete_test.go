package commands

import (
	"strings"
	"testing"
)

// Anything that is not a tab must pass straight through: the callback fires on
// every keypress, so a stray rewrite here would corrupt normal typing.
func TestCompleteIgnoresNonTab(t *testing.T) {
	got := Complete(testEnv(), "cd pro", 6, 'x')
	if got.Replace || len(got.Candidates) > 0 {
		t.Errorf("non-tab key produced a completion: %+v", got)
	}
}

func TestCompleteMidLineIsIgnored(t *testing.T) {
	got := Complete(testEnv(), "cd projects", 3, '\t')
	if got.Replace {
		t.Error("completed mid-line; should only complete at the end")
	}
}

func TestCompleteCommandNames(t *testing.T) {
	got := Complete(testEnv(), "wh", 2, '\t')
	if !got.Replace || got.Line != "whoami " {
		t.Errorf("Line = %q, want %q", got.Line, "whoami ")
	}
}

// A directory completes with a trailing slash so the next tab descends into it;
// a file completes with a space because there is nothing below it.
func TestCompleteDirGetsSlashFileGetsSpace(t *testing.T) {
	env := testEnv()

	if got := Complete(env, "cd pro", 6, '\t'); got.Line != "cd projects/" {
		t.Errorf("dir completion = %q, want %q", got.Line, "cd projects/")
	}

	env.Cwd = "projects/kora"
	if got := Complete(env, "cat READ", 8, '\t'); got.Line != "cat README.md " {
		t.Errorf("file completion = %q, want %q", got.Line, "cat README.md ")
	}
}

// cd only offers directories — offering files would complete to something that
// can only ever error.
func TestCompleteCdOffersDirsOnly(t *testing.T) {
	got := Candidates(testEnv(), "cd", "")
	for _, c := range got {
		if !strings.HasSuffix(c, "/") {
			t.Errorf("cd offered a non-directory: %q", c)
		}
	}
	if len(got) != 2 { // projects/, blog/
		t.Errorf("cd candidates = %v, want 2 directories", got)
	}
}

// cat sees everything, so about.md must be in the list.
func TestCompleteCatOffersFiles(t *testing.T) {
	got := Candidates(testEnv(), "cat", "")
	var found bool
	for _, c := range got {
		if c == "about.md" {
			found = true
		}
	}
	if !found {
		t.Errorf("cat candidates = %v, want about.md among them", got)
	}
}

// The directory part of the word is preserved verbatim rather than being
// rewritten to an absolute path.
func TestCompletePreservesTypedPrefix(t *testing.T) {
	got := Complete(testEnv(), "cat ~/projects/ko", len("cat ~/projects/ko"), '\t')
	if got.Line != "cat ~/projects/kora/" {
		t.Errorf("Line = %q, want %q", got.Line, "cat ~/projects/kora/")
	}
}

// When several candidates share no further prefix, the caller is handed the
// list to print — doing nothing reads as a broken tab key.
func TestCompleteAmbiguousReturnsCandidates(t *testing.T) {
	got := Complete(testEnv(), "cd ", 3, '\t')
	if got.Replace {
		t.Errorf("ambiguous completion rewrote the line to %q", got.Line)
	}
	if len(got.Candidates) != 2 {
		t.Errorf("Candidates = %v, want 2", got.Candidates)
	}
}

func TestCompleteUnknownCommandOffersNothing(t *testing.T) {
	if got := Candidates(testEnv(), "uptime", ""); got != nil {
		t.Errorf("uptime takes no path operand, got %v", got)
	}
}
