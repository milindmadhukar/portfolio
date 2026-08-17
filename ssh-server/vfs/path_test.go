package vfs

import "testing"

func TestResolve(t *testing.T) {
	cases := []struct {
		name    string
		cwd     string
		operand string
		want    string
	}{
		{"empty operand stays put", "", "", ""},
		{"empty operand keeps cwd", "projects", "", "projects"},
		{"dot is cwd", "", ".", ""},
		{"dot slash is cwd", "projects", "./", "projects"},

		// ".." clamps at the root rather than escaping it. This is the
		// property that makes the tree a sandbox.
		{"dotdot at root clamps", "", "..", ""},
		{"dotdot past root clamps", "projects/kora", "../..", ""},
		{"deep escape attempt lands inside", "", "../../../etc/passwd", "etc/passwd"},

		{"relative descent", "projects", "kora", "projects/kora"},
		{"trailing slash trimmed", "projects", "kora/", "projects/kora"},
		{"double slash collapsed", "projects", "kora//README.md", "projects/kora/README.md"},
		{"dotdot then sibling", "", "projects/kora/../stonksapi", "projects/stonksapi"},

		{"absolute ignores cwd", "projects", "/blog/x.md", "blog/x.md"},
		{"tilde is root", "projects/kora", "~", ""},
		{"tilde path", "projects/kora", "~/blog/", "blog"},
		{"home path", "blog", "/home/milind/projects", "projects"},
		{"home itself", "blog", "/home/milind", ""},

		// "~x" is not a user reference here — there is only one user, so it is
		// just a name that happens to start with a tilde.
		{"tilde-prefixed name is literal", "", "~x", "~x"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := Resolve(tc.cwd, tc.operand); got != tc.want {
				t.Errorf("Resolve(%q, %q) = %q, want %q", tc.cwd, tc.operand, got, tc.want)
			}
		})
	}
}

func TestDisplayAndAbs(t *testing.T) {
	cases := []struct {
		path    string
		display string
		abs     string
	}{
		{"", "~", "/home/milind"},
		{"blog", "~/blog", "/home/milind/blog"},
		{"projects/kora", "~/projects/kora", "/home/milind/projects/kora"},
	}

	for _, tc := range cases {
		if got := Display(tc.path); got != tc.display {
			t.Errorf("Display(%q) = %q, want %q", tc.path, got, tc.display)
		}
		if got := Abs(tc.path); got != tc.abs {
			t.Errorf("Abs(%q) = %q, want %q", tc.path, got, tc.abs)
		}
	}
}

func TestKey(t *testing.T) {
	if got := Key(""); got != Root {
		t.Errorf("Key(%q) = %q, want %q", "", got, Root)
	}
	if got := Key("blog"); got != "blog" {
		t.Errorf(`Key("blog") = %q, want "blog"`, got)
	}
}

func TestBaseAndJoin(t *testing.T) {
	if got := Base("projects/kora/README.md"); got != "README.md" {
		t.Errorf("Base = %q", got)
	}
	if got := Base("blog"); got != "blog" {
		t.Errorf("Base = %q", got)
	}
	if got := Join("", "blog"); got != "blog" {
		t.Errorf("Join = %q", got)
	}
	if got := Join("projects", "kora"); got != "projects/kora" {
		t.Errorf("Join = %q", got)
	}
}
