// Package content is the SSH server's only link to the website.
//
// Everything this server prints is authored there: the fastfetch banner, the
// `ls` listings, the filesystem manifest, the markdown bodies. This package
// fetches that, caches it, and keeps serving the last good copy when the
// website is unreachable — a portfolio's `ls` output does not rot, and a failed
// refresh is no reason to break someone's session.
package content

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"golang.org/x/sync/singleflight"

	"github.com/milindmadhukar/portfolio/ssh-server/vfs"
)

// Snapshot is the whole /api/commands payload.
type Snapshot struct {
	Fastfetch string `json:"fastfetch"`
	Whoami    string `json:"whoami"`
	Projects  string `json:"projects"`
	Uptime    string `json:"uptime"`
	Help      string `json:"help"`

	// The filesystem, inlined rather than nested so the JSON stays flat.
	Entries       map[string][]vfs.Entry `json:"entries"`
	Listings      map[string]string      `json:"listings"`
	Files         map[string]string      `json:"files"`
	MarkdownPaths []string               `json:"markdownPaths"`
}

func (s *Snapshot) Tree() *vfs.Tree {
	return vfs.NewTree(vfs.Manifest{
		Entries:       s.Entries,
		Listings:      s.Listings,
		Files:         s.Files,
		MarkdownPaths: s.MarkdownPaths,
	})
}

const (
	// How long a snapshot is served before a refresh is attempted. The live
	// values inside it (uptime, presence) are the reason this is seconds
	// rather than minutes; uptime is measured in years, so nobody can see 15s
	// of staleness, but a Discord status going green should not lag a session.
	snapshotTTL = 15 * time.Second
	// Markdown changes only when the website is redeployed.
	markdownTTL = 5 * time.Minute
	// Generous enough for a cold Astro render, short enough that a wedged
	// website does not hang a keystroke. DefaultClient has no timeout at all,
	// which is what made a single bad request able to freeze a session.
	requestTimeout = 5 * time.Second
)

type cached struct {
	body string
	at   time.Time
}

type Store struct {
	base   string
	client *http.Client
	group  singleflight.Group

	mu   sync.RWMutex
	snap *Snapshot
	at   time.Time
	// Whether the last fetch succeeded, so failures are logged on transition
	// rather than once per command against a website that is down.
	healthy bool

	mdMu sync.RWMutex
	md   map[string]cached
}

// New builds a store for the /api/commands endpoint. The markdown endpoint is
// derived from it, since they are served by the same app.
func New(commandsURL string) *Store {
	return &Store{
		base:   commandsURL,
		client: &http.Client{Timeout: requestTimeout},
		md:     map[string]cached{},
	}
}

// fsURL turns the commands endpoint into the filesystem one:
// http://host/api/commands -> http://host/api/fs/<path>
func (s *Store) fsURL(path string) string {
	base := strings.TrimSuffix(s.base, "/")
	base = strings.TrimSuffix(base, "/commands")
	return base + "/fs/" + path
}

// Snapshot returns the current payload, refreshing it if the TTL has passed.
//
// On a failed refresh it returns the previous snapshot, so the session degrades
// to slightly stale rather than to an error. It only fails when there has never
// been a successful fetch.
func (s *Store) Snapshot(ctx context.Context) (*Snapshot, error) {
	s.mu.RLock()
	snap, at := s.snap, s.at
	s.mu.RUnlock()

	if snap != nil && time.Since(at) < snapshotTTL {
		return snap, nil
	}

	// singleflight so a burst of connections costs one request, not N.
	v, err, _ := s.group.Do("snapshot", func() (any, error) {
		fresh, err := s.fetchSnapshot(ctx)
		if err != nil {
			s.noteUnhealthy(err)
			s.mu.RLock()
			defer s.mu.RUnlock()
			if s.snap != nil {
				return s.snap, nil // stale beats nothing
			}
			return nil, err
		}
		s.noteHealthy()
		s.mu.Lock()
		s.snap, s.at = fresh, time.Now()
		s.mu.Unlock()
		return fresh, nil
	})
	if err != nil {
		return nil, err
	}
	return v.(*Snapshot), nil
}

func (s *Store) fetchSnapshot(ctx context.Context) (*Snapshot, error) {
	body, err := s.get(ctx, s.base)
	if err != nil {
		return nil, err
	}
	var snap Snapshot
	if err := json.Unmarshal(body, &snap); err != nil {
		return nil, fmt.Errorf("decoding commands payload: %w", err)
	}
	return &snap, nil
}

// Markdown fetches one file's raw markdown, cached per path.
func (s *Store) Markdown(ctx context.Context, path string) (string, error) {
	s.mdMu.RLock()
	hit, ok := s.md[path]
	s.mdMu.RUnlock()
	if ok && time.Since(hit.at) < markdownTTL {
		return hit.body, nil
	}

	v, err, _ := s.group.Do("md:"+path, func() (any, error) {
		body, err := s.get(ctx, s.fsURL(path))
		if err != nil {
			// Serve a stale body rather than failing a `cat` outright.
			s.mdMu.RLock()
			defer s.mdMu.RUnlock()
			if prev, ok := s.md[path]; ok {
				return prev.body, nil
			}
			return nil, err
		}
		s.mdMu.Lock()
		s.md[path] = cached{body: string(body), at: time.Now()}
		s.mdMu.Unlock()
		return string(body), nil
	})
	if err != nil {
		return "", err
	}
	return v.(string), nil
}

func (s *Store) get(ctx context.Context, url string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("%s: %s", url, resp.Status)
	}
	return io.ReadAll(resp.Body)
}

// Warm does one blocking fetch at boot so the first connection does not pay
// for it. A failure is logged, not fatal: the website may simply be starting
// up alongside us.
func (s *Store) Warm(ctx context.Context) {
	if _, err := s.Snapshot(ctx); err != nil {
		log.Printf("content: initial fetch failed, will retry on demand: %v", err)
	}
}

func (s *Store) noteHealthy() {
	s.mu.Lock()
	defer s.mu.Unlock()
	if !s.healthy {
		if s.snap != nil {
			log.Print("content: website reachable again")
		}
		s.healthy = true
	}
}

func (s *Store) noteUnhealthy(err error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.healthy {
		log.Printf("content: website unreachable, serving stale: %v", err)
		s.healthy = false
	}
}
