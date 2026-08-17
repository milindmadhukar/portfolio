// Package vfs is the virtual filesystem the shell navigates.
//
// Nothing here touches a disk or a network. Paths are plain strings, and
// whether one exists is a lookup in a manifest the website hands us.
package vfs

import "strings"

// Home is what pwd prints. The tree's root is the empty string internally;
// this is the face it wears.
const Home = "/home/milind"

// Root is the key the website emits for the home directory. "." rather than
// "", because an empty JSON key reads as a bug.
const Root = "."

// Key maps an internal path to the manifest key for it. The root is the only
// special case.
func Key(path string) string {
	if path == "" {
		return Root
	}
	return path
}

// Resolve canonicalises a user-typed operand against the current directory.
//
// The result has no leading or trailing slash and no "." or ".." segments; the
// empty string is the root. It cannot fail: ".." at the root clamps to the
// root, exactly as the kernel treats "/..". Whether the result actually exists
// is a separate question — ask the Tree.
func Resolve(cwd, operand string) string {
	base := cwd

	switch {
	case operand == "~" || strings.HasPrefix(operand, "~/"):
		base = ""
		operand = strings.TrimPrefix(strings.TrimPrefix(operand, "~"), "/")
	case operand == Home || strings.HasPrefix(operand, Home+"/"):
		base = ""
		operand = strings.TrimPrefix(strings.TrimPrefix(operand, Home), "/")
	case strings.HasPrefix(operand, "/"):
		base = ""
	}

	out := make([]string, 0, 8)
	for _, seg := range strings.Split(base+"/"+operand, "/") {
		switch seg {
		case "", ".":
			// empty segments come from "//" and from the join above
		case "..":
			if len(out) > 0 {
				out = out[:len(out)-1]
			}
		default:
			out = append(out, seg)
		}
	}
	return strings.Join(out, "/")
}

// Display renders a path the way a prompt should: rooted at ~.
func Display(path string) string {
	if path == "" {
		return "~"
	}
	return "~/" + path
}

// Abs renders a path the way pwd should: absolute, no tilde.
func Abs(path string) string {
	if path == "" {
		return Home
	}
	return Home + "/" + path
}

// Base is the final segment of a path.
func Base(path string) string {
	if i := strings.LastIndex(path, "/"); i >= 0 {
		return path[i+1:]
	}
	return path
}

// Join appends a child name to a directory path.
func Join(dir, name string) string {
	if dir == "" {
		return name
	}
	return dir + "/" + name
}

// IsMarkdown reports whether a path should be rendered rather than printed.
func IsMarkdown(path string) bool {
	return strings.HasSuffix(path, ".md")
}
