# Vendored glamour style

`catppuccin-mocha.json` is taken verbatim from
[catppuccin/glamour](https://github.com/catppuccin/glamour) (`themes/`), MIT —
see `LICENSE`. Kept unmodified so it can be re-synced with a plain `curl`; the
one correction we need is applied in Go instead, in `render/markdown.go`.

It is compiled into the binary with `go:embed`. That is not a stylistic choice:
the image is `FROM scratch` and the container runs `read_only: true`, so there
is no filesystem for glamour's `WithStylePath` to read.
