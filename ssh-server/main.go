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
	"github.com/joho/godotenv"

	"github.com/milindmadhukar/portfolio/ssh-server/content"
	"github.com/milindmadhukar/portfolio/ssh-server/session"
)

func main() {
	if err := godotenv.Load(); err != nil {
		// Just log, don't fail: prod uses real env vars.
		log.Println("No .env file found or error loading it")
	}

	host := envOr("SSH_HOST", "0.0.0.0")
	port := envOr("SSH_PORT", "2222")
	hostKeyPath := envOr("HOST_KEY_PATH", "id_ed25519")

	apiURL := os.Getenv("PORTFOLIO_API")
	if apiURL == "" {
		log.Println("Warning: PORTFOLIO_API not set")
	}

	store := content.New(apiURL)

	// One fetch before we start listening, so the first connection doesn't pay
	// for it. Non-fatal: the website may still be coming up alongside us.
	warmCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	store.Warm(warmCtx)
	cancel()

	s, err := wish.NewServer(
		wish.WithAddress(fmt.Sprintf("%s:%s", host, port)),
		wish.WithHostKeyPath(hostKeyPath),
		wish.WithMiddleware(
			logging.Middleware(),
			func(h ssh.Handler) ssh.Handler {
				return func(s ssh.Session) {
					session.New(s, store).Run()
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
		if err := s.ListenAndServe(); err != nil && err != ssh.ErrServerClosed {
			log.Fatalln(err)
		}
	}()

	<-done
	log.Println("Stopping SSH server")
	// Close() immediately closes all active listeners and connections, so
	// clients are disconnected when the server restarts or stops.
	if err := s.Close(); err != nil {
		log.Fatalln(err)
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
