#!/bin/bash

# Automatically detect the root directory (where this script is located)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check for development mode flag (skip git reset in development)
DEV_MODE="${MEESEOS_DEV_MODE:-false}"
SKIP_RESET="${MEESEOS_SKIP_RESET:-false}"

# Fetches the latest code from the repo (unless in dev mode or --no-reset flag)
if [ "$DEV_MODE" = "true" ] || [ "$SKIP_RESET" = "true" ] || [ "$1" = "--no-reset" ]; then
	echo "Development mode: Skipping git reset to preserve local changes..."
else
	echo "Fetching latest code from repo..."
	git fetch --all
	git reset --hard origin/master
fi

# Ensures that the dependencies are up to date and rebuilds the project
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use
pnpm add -g pnpm
rush update
NODE_ENV=production rush build

# Ensure logs directory exists
mkdir -p "$REPO_ROOT/logs"
chmod 755 "$REPO_ROOT/logs"

# Starts the server using ecosystem config for proper log file management
cd "$REPO_ROOT"

# Delete old process first to ensure clean start
pm2 delete meeseos --silent 2>/dev/null || true
pm2 delete "pnpm run deploy" --silent 2>/dev/null || true

# Update PM2 silently
pm2 update --silent 2>/dev/null || true

# Start PM2 with ecosystem config
pm2 start ecosystem.config.js --silent 2>/dev/null

# Save PM2 process list
pm2 save --force --silent 2>/dev/null || true

echo "meeseOS service started successfully"
