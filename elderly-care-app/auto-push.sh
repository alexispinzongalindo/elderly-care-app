#!/bin/bash
# Auto-push script - runs git add, commit, and push automatically
# Usage: ./auto-push.sh "commit message"

cd "/Users/alexispinzon/Library/Mobile Documents/com~apple~CloudDocs/CURSOR PROYECECT ONE"

# Get commit message from argument or use default
COMMIT_MSG="${1:-Auto-commit: $(date '+%Y-%m-%d %H:%M:%S')}"

# Add all changes
git add -A

# Commit with message
git commit -m "$COMMIT_MSG"

# Push to main
git push origin main

echo "✅ Auto-pushed successfully!"
echo "Commit: $COMMIT_MSG"

