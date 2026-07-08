package commands

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

var apiURL string

type APIResponse struct {
	Fastfetch string `json:"fastfetch"`
	Whoami    string `json:"whoami"`
	Projects  string `json:"projects"`
	Help      string `json:"help"`
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
	case "ls":
		// Only `ls projects` / `ls projects/` maps to the projects listing.
		if len(args) > 1 && (args[1] == "projects" || args[1] == "projects/") {
			return data.Projects + "\n"
		}
		return fmt.Sprintf("ls: cannot access '%s': No such file or directory\n", strings.Join(args[1:], " "))
	case "help":
		return data.Help + "\n"
	case "exit":
		return "Goodbye!\n"
	default:
		return fmt.Sprintf("command not found: %s\n", cmd)
	}
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
