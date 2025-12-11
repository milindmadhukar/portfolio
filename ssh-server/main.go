package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/charmbracelet/ssh"
	"github.com/charmbracelet/wish"
	"github.com/charmbracelet/wish/logging"
	"github.com/milindmadhukar/portfolio/ssh-server/commands"
	"golang.org/x/term"
)

const (
	host = "0.0.0.0"
	port = 2222
)

func main() {
	s, err := wish.NewServer(
		wish.WithAddress(fmt.Sprintf("%s:%d", host, port)),
		wish.WithHostKeyPath(getHostKeyPath()),
		wish.WithMiddleware(
			logging.Middleware(),
			func(h ssh.Handler) ssh.Handler {
				return func(s ssh.Session) {
					// Request a PTY logic would go here if we needed complex terminal handling
					// For a simple REPL, we can just handle the session directly or use a Bubble Tea model.
					// Let's implement a simple REPL loop here.

					// Setup terminal
					term := term.NewTerminal(s, "$ ")

					// Welcome message
					fmt.Fprintln(s, "Welcome to the sandboxed SSH server!")
					fmt.Fprintln(s, "Type 'help' for a list of commands.")

					for {
						line, err := term.ReadLine()
						if err != nil {
							break
						}

						line = sortOfSanitize(line)

						if line == "exit" {
							fmt.Fprintln(s, "Goodbye!")
							break
						}

						if line == "clear" {
							fmt.Fprint(s, "\033[H\033[2J")
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
	log.Printf("Starting SSH server on %s:%d", host, port)
	go func() {
		if err = s.ListenAndServe(); err != nil && err != ssh.ErrServerClosed {
			log.Fatalln(err)
		}
	}()

	<-done
	log.Println("Stopping SSH server")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if err := s.Shutdown(ctx); err != nil {
		log.Fatalln(err)
	}
}

func sortOfSanitize(s string) string {
	// Basic trimming, could potentially remove control characters if needed
	return s
}

func getHostKeyPath() string {
	if path := os.Getenv("HOST_KEY_PATH"); path != "" {
		return path
	}
	return "id_ed25519"
}
