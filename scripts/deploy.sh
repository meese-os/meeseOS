#!/bin/bash

# Automatically detect the root directory (where this script is located)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check for development mode flag (skip git reset in development)
DEV_MODE="${MEESEOS_DEV_MODE:-false}"
SKIP_RESET="${MEESEOS_SKIP_RESET:-false}"

# Fetches the latest code from the repo unless one of the following is set:
#   - MEESEOS_DEV_MODE=true (environment variable): for development mode
#   - MEESEOS_SKIP_RESET=true (environment variable): to explicitly skip git reset
#   - --no-reset (command-line flag): to skip git reset for this run
if [ "$DEV_MODE" = "true" ] || [ "$SKIP_RESET" = "true" ] || [ "$1" = "--no-reset" ]; then
	echo "Skipping git reset to preserve local changes..."
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
pm2 update --silent || true

# Start PM2 with ecosystem config
pm2 start ecosystem.config.js --silent
PM2_START_EXIT_CODE=$?
if [ $PM2_START_EXIT_CODE -ne 0 ]; then
    echo "ERROR: PM2 failed to start the service. Check the output above for details." >&2
    exit $PM2_START_EXIT_CODE
fi

# Save PM2 process list
pm2 save --force --silent

if pm2 list | grep -q "meeseos" && pm2 status meeseos | grep -q "online"; then
    echo "meeseOS service started successfully"
else
    echo "ERROR: meeseOS service failed to start. Check PM2 logs for details." >&2
    exit 1
fi
