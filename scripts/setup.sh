#!/bin/bash

if [ ! -d "${HOME}/.nvm/.git" ]; then
	echo "Installing nvm..."
	echo
	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
else
	echo "NVM already installed, skipping..."
fi

echo "Sourcing nvm..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

echo "Installing Node version specified in .nvmrc..."
echo
nvm install
nvm use

# Optional, can be useful for some issues on Ubuntu
# sudo apt-get purge nodejs npm --auto-remove

echo
echo "Installing global dependencies..."

# Check and install @microsoft/rush
if command -v rush &> /dev/null; then
	echo "Rush already installed, skipping..."
else
	echo "Installing @microsoft/rush..."
	npm install -g @microsoft/rush
fi

# Check and install pm2
if command -v pm2 &> /dev/null; then
	echo "PM2 already installed, skipping..."
else
	echo "Installing pm2..."
	npm install -g pm2
fi

# Check and install/update pnpm
if command -v pnpm &> /dev/null; then
	echo "PNPM already installed, updating with self-update..."
	pnpm self-update
else
	echo "Installing pnpm..."
	npm install -g pnpm
	echo
	echo "Setting up pnpm..."
	pnpm setup
	source ~/.bashrc
fi

echo
echo "Updating rush projects..."
rush update --purge --max-install-attempts 10

echo
echo "Installing rush dependencies..."
rush install

echo
echo "Building rush projects..."
rush build

echo
echo "Starting up pm2..."
pm2 startup

echo
echo "Setting up the terminal app..."
pushd ./apps/terminal/scripts
bash ./setup.sh
popd
