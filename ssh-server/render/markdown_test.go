package render

import (
	"strings"
	"testing"

	"github.com/charmbracelet/x/ansi"
	"github.com/muesli/termenv"
)

const sample = `# A heading

Some prose that runs on for a while so that it has to be wrapped by the
renderer rather than fitting comfortably on one line of any terminal.

- a list item
- another one

` + "```go\nfunc main() {}\n```" + `

> a quote
`

// The embedded style has to parse at init or the binary is broken; this is the
// test that says so out loud.
func TestEmbeddedStyleLoads(t *testing.T) {
	if style.Document.Color == nil {
		t.Fatal("embedded style did not load")
	}
	// The upstream theme ships code_block.color as a background colour; init
	// overrides it. Guard the override so a re-sync cannot silently undo it.
	if style.CodeBlock.Color == nil || *style.CodeBlock.Color != "#cdd6f4" {
		t.Errorf("code_block.color = %v, want the text colour", style.CodeBlock.Color)
	}
}

func TestRendersWithColourAtANSI256(t *testing.T) {
	got, err := Markdown(sample, 80, termenv.ANSI256)
	if err != nil {
		t.Fatal(err)
	}
	if got == "" {
		t.Fatal("rendered nothing")
	}
	if !strings.Contains(got, "\x1b[") {
		t.Error("no escape sequences at ANSI256")
	}
}

// Piping (`ssh host cat x.md | less`) has no PTY, and colour there is noise.
func TestNoColourAtAscii(t *testing.T) {
	got, err := Markdown(sample, 80, termenv.Ascii)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(got, "\x1b[") {
		t.Errorf("emitted escape sequences at Ascii: %q", got)
	}
}

// The whole point of reading the PTY size is that output fits in it.
func TestWrapsWithinWidth(t *testing.T) {
	for _, width := range []int{40, 80, 120, 400} {
		got, err := Markdown(sample, width, termenv.Ascii)
		if err != nil {
			t.Fatal(err)
		}
		limit := wrapFor(width)
		for _, line := range strings.Split(got, "\n") {
			// Measure display cells, not bytes: the style uses box-drawing
			// characters that are multi-byte but single-width.
			if w := ansi.StringWidth(line); w > limit+4 {
				t.Errorf("width %d: line of %d cells exceeds wrap %d: %q",
					width, w, limit, line)
			}
		}
	}
}

func TestWrapBounds(t *testing.T) {
	if got := wrapFor(10); got != minWrap {
		t.Errorf("wrapFor(10) = %d, want %d", got, minWrap)
	}
	if got := wrapFor(500); got != maxWrap {
		t.Errorf("wrapFor(500) = %d, want %d", got, maxWrap)
	}
	if got := wrapFor(81); got != 80 {
		t.Errorf("wrapFor(81) = %d, want 80", got)
	}
}
