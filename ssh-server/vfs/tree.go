package vfs

import "sort"

// Entry is one child of a directory, as the website describes it.
type Entry struct {
	Name string `json:"name"`
	Kind string `json:"kind"` // "dir" or "file"
}

// Manifest is the filesystem as it arrives over the wire. The website builds
// it from its own data (see website/src/lib/filesystem.ts), so the tree can
// never drift from the projects and posts it is supposed to describe.
type Manifest struct {
	Entries  map[string][]Entry `json:"entries"`
	Listings map[string]string  `json:"listings"`
	Files    map[string]string  `json:"files"`
	// MarkdownPaths is every renderable file, so tab completion can offer them
	// without fetching a single body.
	MarkdownPaths []string `json:"markdownPaths"`
}

// Tree answers questions about paths. It is read-only once built, so it is safe
// to share a pointer across sessions.
type Tree struct {
	m Manifest
}

func NewTree(m Manifest) *Tree {
	if m.Entries == nil {
		m.Entries = map[string][]Entry{}
	}
	if m.Listings == nil {
		m.Listings = map[string]string{}
	}
	if m.Files == nil {
		m.Files = map[string]string{}
	}
	return &Tree{m: m}
}

// IsDir reports whether a path is a directory. A directory is exactly a path
// that has an entries list — there is no second source of truth.
func (t *Tree) IsDir(path string) bool {
	_, ok := t.m.Entries[Key(path)]
	return ok
}

// IsFile reports whether a path is a file: either the website pre-rendered it,
// or its parent directory lists it as one.
func (t *Tree) IsFile(path string) bool {
	if path == "" {
		return false
	}
	if _, ok := t.m.Files[path]; ok {
		return true
	}
	parent := ""
	if i := lastSlash(path); i >= 0 {
		parent = path[:i]
	}
	for _, e := range t.m.Entries[Key(parent)] {
		if e.Name == Base(path) {
			return e.Kind == "file"
		}
	}
	return false
}

// Exists reports whether anything lives at a path.
func (t *Tree) Exists(path string) bool { return t.IsDir(path) || t.IsFile(path) }

// Children returns a directory's entries, sorted, for tab completion.
func (t *Tree) Children(path string) []Entry {
	src := t.m.Entries[Key(path)]
	out := make([]Entry, len(src))
	copy(out, src)
	sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
	return out
}

// Listing is the pre-rendered `ls` output for a directory.
func (t *Tree) Listing(path string) (string, bool) {
	s, ok := t.m.Listings[Key(path)]
	return s, ok
}

// File is the pre-rendered contents of a non-markdown file. Markdown is
// deliberately absent — it is fetched on demand and rendered here.
func (t *Tree) File(path string) (string, bool) {
	s, ok := t.m.Files[path]
	return s, ok
}

func lastSlash(s string) int {
	for i := len(s) - 1; i >= 0; i-- {
		if s[i] == '/' {
			return i
		}
	}
	return -1
}
