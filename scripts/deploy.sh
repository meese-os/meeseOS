#!/bin/bash

# Fetches the latest code from the repo
if [ "$1" != "--no-reset" ]; then
	echo "Fetching latest code from repo..."
	git fetch --all
	git reset --hard origin/master
else
	echo "Skipping git fetch..."
fi

# Ensures that the dependencies are up to date and rebuilds the project
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use
pnpm add -g pnpm
node ./scripts/update-browserslist-db.mjs
rush update
NODE_ENV=production rush build

# Deletes the old server process if it exists, done last to minimize downtime
pm2 delete "pnpm run deploy" 2>/dev/null

# Starts the server
cd ./website
pm2 update
pm2 start "pnpm run deploy"
pm2 save --force
