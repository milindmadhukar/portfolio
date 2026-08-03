package commands

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strings"
)

var apiURL string

type APIResponse struct {
	Fastfetch      string            `json:"fastfetch"`
	Whoami         string            `json:"whoami"`
	Projects       string            `json:"projects"`
	ProjectDetails map[string]string `json:"projectDetails"`
	ProjectIDs     []string          `json:"projectIds"`
	Uptime         string            `json:"uptime"`
	Help           string            `json:"help"`
}

// Commands that complete on their own, without an argument.
var commandNames = []string{
	"clear",
	"exit",
	"fastfetch",
	"help",
	"ls",
	"projects",
	"uptime",
	"whoami",
}

func Init(url string) {
	apiURL = url
}

// HandleCommand processes the input command and returns the output.
func HandleCommand(input string, user string) string {
	args := strings.Fields(input)
	if len(args) == 0 {
		return ""
	}

	cmd := args[0]

	// Fetch data from API
	// TODO: Consider caching or error handling if API is down
	data, err := fetchCommands()
	if err != nil {
		// Fallback or error message
		return fmt.Sprintf("Error fetching commands: %v\n", err)
	}

	switch cmd {
	case "whoami":
		return data.Whoami + "\n"
	case "fastfetch":
		return data.Fastfetch + "\n"
	case "projects":
		return data.Projects + "\n"
	case "uptime":
		return data.Uptime + "\n"
	case "ls":
		return handleLs(args[1:], data)
	case "help":
		return data.Help + "\n"
	case "exit":
		return "Goodbye!\n"
	default:
		return fmt.Sprintf("command not found: %s\n", cmd)
	}
}

// handleLs resolves the pseudo-filesystem: the home directory holds a single
// `projects/` directory, and each project inside it is its own page.
func handleLs(args []string, data *APIResponse) string {
	// Bare `ls` — show what's in the home directory.
	if len(args) == 0 {
		return "projects/\n"
	}

	target := strings.TrimSuffix(args[0], "/")

	if target == "projects" {
		return data.Projects + "\n"
	}

	if id, ok := strings.CutPrefix(target, "projects/"); ok {
		if details, found := data.ProjectDetails[id]; found {
			return details + "\n"
		}
	}

	return fmt.Sprintf("ls: cannot access '%s': No such file or directory\n", strings.Join(args, " "))
}

// ProjectIDs fetches just the project names, for tab completion. Called once
// per session — the completion callback itself must never hit the network.
func ProjectIDs() []string {
	data, err := fetchCommands()
	if err != nil {
		return nil
	}
	return data.ProjectIDs
}

// Completion is the outcome of a tab press: either rewrite the line, or show
// the caller the ambiguous candidates so it can print them.
type Completion struct {
	Line       string
	Pos        int
	Replace    bool
	Candidates []string
}

// Complete implements tab completion over commands and project paths. It is
// wired to x/term's AutoCompleteCallback, which fires on *every* keypress, so
// anything but a tab is passed straight through untouched.
func Complete(line string, pos int, key rune, projectIDs []string) Completion {
	if key != '\t' {
		return Completion{}
	}

	// Only complete at the end of the line — mid-line completion would need to
	// splice the remainder back in, and nobody edits mid-line here.
	if pos != len(line) {
		return Completion{}
	}

	prefix, word := splitLastWord(line)

	var candidates []string
	switch {
	case strings.TrimSpace(prefix) == "":
		candidates = matches(commandNames, word)
	case strings.TrimSpace(prefix) == "ls":
		candidates = matches(projectPaths(projectIDs), word)
	}

	if len(candidates) == 0 {
		return Completion{}
	}

	completed := longestCommonPrefix(candidates)
	if len(candidates) == 1 {
		// A finished command gets a trailing space; a directory gets a slash
		// instead, so the next tab can descend into it.
		if strings.HasPrefix(completed, "projects") {
			completed = strings.TrimSuffix(completed, "/") + "/"
		} else {
			completed += " "
		}
	}

	// No further prefix to share — show what's on offer instead of doing nothing.
	if completed == word {
		return Completion{Candidates: candidates}
	}

	newLine := prefix + completed
	return Completion{Line: newLine, Pos: len(newLine), Replace: true}
}

// projectPaths is what `ls <tab>` offers: the projects directory itself, plus
// every project inside it.
func projectPaths(projectIDs []string) []string {
	paths := []string{"projects/"}
	for _, id := range projectIDs {
		paths = append(paths, "projects/"+id)
	}
	sort.Strings(paths)
	return paths
}

// splitLastWord splits a line into everything before the final word and the
// final word itself — the part a tab press is trying to complete.
func splitLastWord(line string) (prefix string, word string) {
	i := strings.LastIndex(line, " ")
	if i < 0 {
		return "", line
	}
	return line[:i+1], line[i+1:]
}

func matches(candidates []string, word string) []string {
	var out []string
	for _, c := range candidates {
		if strings.HasPrefix(c, word) {
			out = append(out, c)
		}
	}
	return out
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

func fetchCommands() (*APIResponse, error) {
	if apiURL == "" {
		return nil, fmt.Errorf("API URL not set")
	}

	resp, err := http.Get(apiURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status: %s", resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var data APIResponse
	if err := json.Unmarshal(body, &data); err != nil {
		return nil, err
	}

	return &data, nil
}
