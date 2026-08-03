package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"github.com/charmbracelet/ssh"
	"github.com/charmbracelet/wish"
	"github.com/charmbracelet/wish/logging"
	"github.com/joho/godotenv"
	"github.com/milindmadhukar/portfolio/ssh-server/commands"
	"golang.org/x/term"
)

func main() {
	// Load .env file if present
	if err := godotenv.Load(); err != nil {
		// Just log, don't fail, as prod might use proper env vars
		log.Println("No .env file found or error loading it")
	}

	// Load configuration
	host := os.Getenv("SSH_HOST")
	if host == "" {
		host = "0.0.0.0"
	}
	port := os.Getenv("SSH_PORT")
	if port == "" {
		port = "2222"
	}
	apiURL := os.Getenv("PORTFOLIO_API")
	if apiURL == "" {
		// Default warning if not set
		fmt.Println("Warning: PORTFOLIO_API not set")
	}

	// Initialize command package with API URL
	commands.Init(apiURL)

	hostKeyPath := os.Getenv("HOST_KEY_PATH")
	if hostKeyPath == "" {
		hostKeyPath = "id_ed25519"
	}

	s, err := wish.NewServer(
		wish.WithAddress(fmt.Sprintf("%s:%s", host, port)),
		wish.WithHostKeyPath(hostKeyPath),
		wish.WithMiddleware(
			logging.Middleware(),
			func(h ssh.Handler) ssh.Handler {
				return func(s ssh.Session) {
					// Define colors for prompt
					// Catppuccin Macchiato/Mocha approximations
					cRed := "\033[38;5;203m"     // Red/Pink
					cBlue := "\033[38;5;117m"    // Sky/Blue
					cGrey := "\033[38;5;240m"    // Overlay
					cMagenta := "\033[38;5;183m" // Mauve/Magenta
					cReset := "\033[0m"

					// Prompt: ❯ user@milind.dev:~$
					prompt := fmt.Sprintf("%s❯ %s%s%s@%smilind.dev%s:~$ ",
						cMagenta,
						cRed, s.User(),
						cGrey,
						cBlue,
						cReset)

					// Setup terminal
					term := term.NewTerminal(s, prompt)

					// Project names for tab completion, fetched once per
					// session — AutoCompleteCallback fires on every keypress,
					// so it must never touch the network itself.
					projectIDs := commands.ProjectIDs()

					term.AutoCompleteCallback = func(line string, pos int, key rune) (string, int, bool) {
						c := commands.Complete(line, pos, key, projectIDs)
						if len(c.Candidates) > 0 {
							// Writing through the terminal clears the current
							// line and redraws the prompt afterwards.
							fmt.Fprintf(term, "%s\r\n", strings.Join(c.Candidates, "  "))
						}
						return c.Line, c.Pos, c.Replace
					}

					// Welcome message
					// "When a client connects run the fast fetch command and say type help for more commands"

					// We can manually invoke the command logic for the welcome message
					// or just print generic welcome. The user asked to "run the fast fetch command".
					// Let's call HandleCommand strictly.

					// Note: output depends on the API being reachable.
					welcome := commands.HandleCommand("fastfetch", s.User())
					fmt.Fprint(s, welcome)
					fmt.Fprintln(s, "Type 'help' for more commands")

					for {
						line, err := term.ReadLine()
						if err != nil {
							break
						}

						// Sanitize
						// line = strings.TrimSpace(line) // Optional, term.ReadLine usually handles well

						if line == "exit" {
							fmt.Fprintln(s, "Goodbye!")
							break
						}

						if line == "clear" {
							// Clear screen escape code
							fmt.Fprint(s, "\033[H\033[2J")
							continue
						}

						if line == "" {
							continue
						}

						output := commands.HandleCommand(line, s.User())
						fmt.Fprint(s, output)
					}

					h(s)
				}
			},
		),
	)
	if err != nil {
		log.Fatalln(err)
	}

	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)
	log.Printf("Starting SSH server on %s:%s", host, port)
	go func() {
		if err = s.ListenAndServe(); err != nil && err != ssh.ErrServerClosed {
			log.Fatalln(err)
		}
	}()

	<-done
	log.Println("Stopping SSH server")
	// Close() immediately closes all active listeners and all active connections.
	// This ensures clients are disconnected when the server restarts or stops.
	if err := s.Close(); err != nil {
		log.Fatalln(err)
	}
}
