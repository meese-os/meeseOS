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

# Be sure pm2 is installed
sudo npm install pm2 -g

# Stop and delete any previously running instances
sudo pm2 delete "npm run serve"

# Set up the terminal app then return to the project root
cd ./apps/terminal/scripts
bash ./setup.sh
cd ../../..

# Run the server in the background so the Jenkins job can complete
cd website
npm run package:discover
sudo pm2 start "npm run serve"
sudo pm2 save

# The final files will be deployed to /var/lib/jenkins/workspace/aaronmeese.com.
# The final process can be monitored with `sudo pm2 monit`
