// Package render turns markdown into ANSI for the terminal.
//
// This is the one place the SSH server renders anything itself. Every other
// command prints a string the website already rendered; markdown is the
// exception because glamour is a Go library and there is no equivalent on the
// Astro side worth duplicating.
package render

import (
	_ "embed"
	"encoding/json"
	"fmt"

	"github.com/charmbracelet/glamour"
	"github.com/charmbracelet/glamour/ansi"
	xansi "github.com/charmbracelet/x/ansi"
	"github.com/muesli/termenv"
)

// The style is compiled in rather than read from disk: the image is FROM
// scratch and the container is read_only, so glamour's WithStylePath has
// nothing to point at.
//
//go:embed styles/catppuccin-mocha.json
var catppuccinMocha []byte

var style ansi.StyleConfig

func init() {
	if err := json.Unmarshal(catppuccinMocha, &style); err != nil {
		// An embedded asset that does not parse is a build error, not a
		// runtime condition — there is no sensible way to continue.
		panic(fmt.Sprintf("render: parsing embedded glamour style: %v", err))
	}

	// The upstream theme sets code_block.color to #181825, which is mantle —
	// a *background* colour. Any code span chroma does not highlight is then
	// drawn nearly invisible against a dark terminal. Everything else in the
	// file is left exactly as vendored so it can be re-synced verbatim.
	text := "#cdd6f4"
	style.CodeBlock.Color = &text
}

// Width bounds. glamour counts the document margin inside the wrap width, and
// leaving one spare column stops the client's own wrapping from doubling up on
// the last cell.
const (
	minWrap = 40
	maxWrap = 100
)

func wrapFor(width int) int {
	w := width - 1
	if w > maxWrap {
		// Prose set to the full width of a maximised terminal is unreadable
		// regardless of how much room there is.
		w = maxWrap
	}
	if w < minWrap {
		w = minWrap
	}
	return w
}

// New builds a renderer for one render at one width.
//
// Deliberately not cached or shared: glamour's ANSIRenderer carries a mutable
// RenderContext (block stack, table state), so a package-level renderer would
// corrupt output as soon as two sessions rendered at once.
func New(width int, profile termenv.Profile) (*glamour.TermRenderer, error) {
	cfg := style // struct copy, so per-render tweaks don't touch the package value

	if width < 60 {
		// The theme's 2-column document margin costs a tenth of a narrow
		// terminal on each side.
		var zero uint
		cfg.Document.Margin = &zero
	}

	// Note the absence of WithAutoStyle/WithEnvironmentConfig: both decide the
	// style by calling term.IsTerminal on the *server's* stdout, which in a
	// container is false. They would silently select the no-TTY style and
	// render everything colourless, no matter what the client supports.
	return glamour.NewTermRenderer(
		glamour.WithStyles(cfg),
		glamour.WithColorProfile(profile),
		glamour.WithWordWrap(wrapFor(width)),
		glamour.WithEmoji(),
	)
}

// Markdown renders a document, or returns an error if glamour cannot.
func Markdown(source string, width int, profile termenv.Profile) (string, error) {
	r, err := New(width, profile)
	if err != nil {
		return "", err
	}
	rendered, err := r.Render(source)
	if err != nil {
		return "", err
	}

	// termenv.Ascii drops colour but glamour still emits bold and faint, so
	// the output is not actually plain. Ascii is what we pick when there is no
	// PTY — someone piping `ssh host cat post.md` into a file — so strip the
	// rest here rather than leaving half-escaped text.
	if profile == termenv.Ascii {
		rendered = xansi.Strip(rendered)
	}
	return rendered, nil
}
