package commands

import "strings"

// Completion is the outcome of a tab press: either rewrite the line, or hand
// the caller the ambiguous candidates so it can print them.
type Completion struct {
	Line       string
	Pos        int
	Replace    bool
	Candidates []string
}

// Complete implements tab completion. It is wired to x/term's
// AutoCompleteCallback, which fires on *every* keypress, so anything that is
// not a tab is passed straight through untouched.
func Complete(env *Env, line string, pos int, key rune) Completion {
	if key != '\t' {
		return Completion{}
	}
	// Only complete at the end of the line — mid-line completion would have to
	// splice the remainder back in, and nobody edits mid-line here.
	if pos != len(line) {
		return Completion{}
	}

	prefix, word := splitLastWord(line)

	// The command being completed for: empty when the cursor is still on the
	// command name itself.
	cmd := ""
	if fields := strings.Fields(prefix); len(fields) > 0 {
		cmd = fields[0]
	}

	candidates := Candidates(env, cmd, word)
	if len(candidates) == 0 {
		return Completion{}
	}

	completed := longestCommonPrefix(candidates)
	if len(candidates) == 1 {
		// A directory gets a slash so the next tab descends into it; anything
		// finished gets a space.
		if !strings.HasSuffix(completed, "/") {
			completed += " "
		}
	}

	// Nothing further is shared — show what is on offer rather than doing
	// nothing, which reads as a broken tab key.
	if completed == word {
		return Completion{Candidates: candidates}
	}

	newLine := prefix + completed
	return Completion{Line: newLine, Pos: len(newLine), Replace: true}
}

// splitLastWord splits a line into everything before the final word and the
// final word itself — the part a tab press is trying to complete.
func splitLastWord(line string) (prefix, word string) {
	i := strings.LastIndex(line, " ")
	if i < 0 {
		return "", line
	}
	return line[:i+1], line[i+1:]
}

func longestCommonPrefix(items []string) string {
	if len(items) == 0 {
		return ""
	}
	prefix := items[0]
	for _, item := range items[1:] {
		for !strings.HasPrefix(item, prefix) {
			prefix = prefix[:len(prefix)-1]
			if prefix == "" {
				return ""
			}
		}
	}
	return prefix
}
