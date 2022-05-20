#!/bin/bash

# Deletes the old server process if it exists
pm2 delete "npm run deploy" 2>/dev/null

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
rush update
NODE_ENV=production rush build

# Starts the server
cd ./website
pm2 start "npm run deploy"
pm2 save --force
