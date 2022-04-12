#!/bin/bash

# Install nvm for Node installation versioning
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

# Attempt to make nvm available to shell:
# https://stackoverflow.com/a/23757895/6456163
export NVM_DIR="$HOME/.nvm"
. $NVM_DIR/nvm.sh;

# Install Node 16.x
nvm install 16
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install rush packages and build
npm install -g @microsoft/rush
rush install
rush build

# Set up the terminal app
sh ./apps/terminal/scripts/setup.sh

# Run the server
cd website
npm run package:discover
npm run serve &
