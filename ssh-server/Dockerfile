FROM golang:alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build valid static binary
RUN CGO_ENABLED=0 GOOS=linux go build -o ssh-server .

FROM scratch

WORKDIR /

COPY --from=builder /app/ssh-server /ssh-server

# We need a host key for SSH. Since this is a scratch image, we can't generate it easily at runtime using external tools.
# However, wish/ssh can generate it if the path is writable. 
# We'll expose a volume or expect it to be ephemeral and generated in memory if we modify the code, 
# but wish requires a file path usually to persist.
# For this "sandbox", strict persistence might not be needed, but let's try to let it write to a volume if needed.
# Or better, we just run it. The app will try to write "./.ssh/id_ed25519" by default in the code (I set it to .ssh/id_ed25519).
# In scratch, "." is /. / is not writable usually?
# We will use /tmp as a volume target if needed, but scratch doesn't have /tmp.
# Let's just modify the code to store key in /key/id_ed25519 and declare a volume there?
# Actually simpler: The user wants "no files from host". 
# So maybe we don't persist keys?
# If I don't persist keys, clients get a warning every time.
# I will modify main.go to use a specific path, and if I can't write, I might fail.
# Let's adjust main.go to be more robust for scratch, or just use a volume.

EXPOSE 2222

ENTRYPOINT ["/ssh-server"]
