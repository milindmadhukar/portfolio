package commands

import (
	"fmt"
	"strings"
)

// HandleCommand processes the input command and returns the output.
func HandleCommand(input string, user string) string {
	args := strings.Fields(input)
	if len(args) == 0 {
		return ""
	}

	cmd := args[0]

	switch cmd {
	case "whoami":
		return fmt.Sprintf("%s\n", user)
	case "fastfetch":
		return getFastFetch()
	case "help":
		return "Available commands: whoami, fastfetch, help, exit\n"
	case "exit":
		return "Goodbye!\n"
	default:
		return fmt.Sprintf("command not found: %s\n", cmd)
	}
}

func getFastFetch() string {
	// Lorem Ipsum based fastfetch output
	return `
       .
      / \
     /   \      Lorem Ipsum User
    /     \     ----------------
   /_______\    OS: Custom SSH OS
  /         \   Host: milind.dev
 /___________\  Kernel: 1.0.0-sandbox
                Uptime: Forever
                Packages: 0 (dpkg)
                Shell: ssh-sandbox
                Resolution: 1920x1080
                DE: None
                WM: None
                Theme: Default
                Icons: Default
                Terminal: SSH
                CPU: Virtual CPU
                GPU: Virtual GPU
                Memory: 100MiB / 1GiB

Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
`
}
