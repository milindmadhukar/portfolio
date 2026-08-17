FROM golang:alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build valid static binary.
#
# -s -w and -trimpath offset glamour, which pulls in chroma's full lexer set for
# syntax highlighting inside code blocks and is most of the binary by itself.
# The Catppuccin style is compiled in via go:embed (see render/styles), so the
# scratch image below still needs no filesystem.
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o ssh-server .

FROM scratch

WORKDIR /

COPY --from=builder /app/ssh-server /ssh-server

# Copy empty directory for data volume if needed (though volume mount handles it)
# COPY --from=builder /app/data /data 

ENV HOST_KEY_PATH=/data/id_ed25519

EXPOSE 2222

ENTRYPOINT ["/ssh-server"]
