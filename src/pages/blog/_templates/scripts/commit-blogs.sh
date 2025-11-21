#!/bin/bash

# Navigate to repo root (go up 5 levels from script location)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../../.." && pwd)"
cd "$REPO_ROOT"

# Add everything in the blogs folder
git add src/pages/blog/

# Check if there are changes
if git diff --staged --quiet; then
  echo "No changes to commit"
  exit 0
fi

# Commit with timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
git commit -m "Update blogs - $TIMESTAMP"

# Push
git push origin dev

echo "✓ Committed and pushed successfully!"
