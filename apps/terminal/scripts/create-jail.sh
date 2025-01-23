#!/bin/bash

# This file installs jailkit to limit specified users' access to the system
# https://www.mikeslab.net/ubuntu-1404-creating-a-very-jailed-user-with-jailkit/

if [ -d "/jail" ]; then
  echo "Jail already exists, skipping creation..."
  exit 0
fi

# Configure pyenv to use Python 3.12
sudo apt-get install -y libbz2-dev lzma liblzma-dev
pyenv install 3.12
pyenv global 3.12

# Add the pyenv path to the PATH
export PYENV_ROOT="$HOME/.pyenv"
[[ -d $PYENV_ROOT/bin ]] && export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"

set -e

# Download and unpack jailkit
JAILKIT_VERSION=2.23
cd /tmp
wget "http://olivier.sessink.nl/jailkit/jailkit-$JAILKIT_VERSION.tar.gz"
tar xvfz "jailkit-$JAILKIT_VERSION.tar.gz"

# Install jailkit
cd "jailkit-$JAILKIT_VERSION"
bash ./configure
sudo make
sudo make install

# Configure jailkit
sudo jk_init -v -j /jail ssh
sudo mkdir -p /jail/home
echo "users:x:100:" | sudo tee /jail/etc/group

set +e
