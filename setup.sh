#!/bin/bash

echo "Installing nvm..."
echo
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash

echo "Sourcing nvm..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

echo "Installing Node version specified in .nvmrc..."
echo
nvm install && nvm use

# Optional, can be useful for some issues on Ubuntu
# sudo apt-get purge nodejs npm --auto-remove

echo
echo "Updating npm..."
npm install -g npm@latest

echo
echo "Installing rush and pm2..."
npm install -g @microsoft/rush pm2 2>&1 | grep "npm ERR!"
if [ "$?" -ne "1" ]; then
  # This method of checking for whether `npm install` was successful is from here:
  # https://devops.stackexchange.com/a/1268/41518
  echo
  echo "\e[31m[!] 'npm install' failed! Check your network connection for stability and try again.\e[31m"
  exit 1
fi

echo
echo "Updating rush projects..."
rush update --max-install-attempts 10 2>&1 | grep "ERROR: Error: The command failed with exit code 1"
if [ "$?" -ne "1" ]; then
  echo
  echo "\e[31m[!] 'rush update' failed! Check your network connection for stability and try again.\e[31m"
  exit 1
fi

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
