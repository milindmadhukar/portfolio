package vfs

import "testing"

// A miniature of the real tree: two directories, a nested one, and files of
// both kinds (pre-rendered and markdown).
func testTree() *Tree {
	return NewTree(Manifest{
		Entries: map[string][]Entry{
			Root: {
				{Name: "projects", Kind: "dir"},
				{Name: "blog", Kind: "dir"},
				{Name: "about.md", Kind: "file"},
			},
			"projects":      {{Name: "kora", Kind: "dir"}},
			"projects/kora": {{Name: "README.md", Kind: "file"}},
			"blog":          {{Name: "a-post.md", Kind: "file"}},
		},
		Listings: map[string]string{
			Root:            "root listing",
			"projects":      "projects listing",
			"projects/kora": "kora listing",
			"blog":          "blog listing",
		},
		Files: map[string]string{"about.md": "whoami output"},
	})
}

func TestClassification(t *testing.T) {
	tr := testTree()

	dirs := []string{"", "projects", "projects/kora", "blog"}
	for _, d := range dirs {
		if !tr.IsDir(d) {
			t.Errorf("IsDir(%q) = false, want true", d)
		}
		if tr.IsFile(d) {
			t.Errorf("IsFile(%q) = true, want false", d)
		}
	}

	files := []string{"about.md", "projects/kora/README.md", "blog/a-post.md"}
	for _, f := range files {
		if !tr.IsFile(f) {
			t.Errorf("IsFile(%q) = false, want true", f)
		}
		if tr.IsDir(f) {
			t.Errorf("IsDir(%q) = true, want false", f)
		}
	}

	for _, missing := range []string{"nope", "projects/nope", "blog/nope.md"} {
		if tr.Exists(missing) {
			t.Errorf("Exists(%q) = true, want false", missing)
		}
	}
}

// The root is keyed "." on the wire but "" internally; both must reach it.
func TestRootKeying(t *testing.T) {
	tr := testTree()
	if !tr.IsDir("") {
		t.Fatal(`IsDir("") = false, want true`)
	}
	if got, ok := tr.Listing(""); !ok || got != "root listing" {
		t.Fatalf(`Listing("") = %q, %v`, got, ok)
	}
	if got, ok := tr.Listing("."); !ok || got != "root listing" {
		t.Fatalf(`Listing(".") = %q, %v`, got, ok)
	}
}

func TestChildrenAreSorted(t *testing.T) {
	got := testTree().Children("")
	want := []string{"about.md", "blog", "projects"}
	if len(got) != len(want) {
		t.Fatalf("Children() = %v", got)
	}
	for i := range want {
		if got[i].Name != want[i] {
			t.Errorf("Children()[%d] = %q, want %q", i, got[i].Name, want[i])
		}
	}
}

// Markdown is not in Files: it is fetched on demand, so File() must miss even
// though IsFile() hits.
func TestMarkdownIsNotPreRendered(t *testing.T) {
	tr := testTree()
	if _, ok := tr.File("blog/a-post.md"); ok {
		t.Error("File() returned a body for markdown; it should be fetched on demand")
	}
	if got, ok := tr.File("about.md"); !ok || got != "whoami output" {
		t.Errorf("File(about.md) = %q, %v", got, ok)
	}
}

// A nil manifest is what a stale website would hand us; it must not panic.
func TestEmptyManifestIsSafe(t *testing.T) {
	tr := NewTree(Manifest{})
	if tr.IsDir("") || tr.Exists("anything") {
		t.Error("empty manifest should report nothing")
	}
	if len(tr.Children("")) != 0 {
		t.Error("empty manifest should have no children")
	}
}
