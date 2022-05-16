#!/bin/bash

# This file installs jailkit to limit specified users' access to the system
# https://www.mikeslab.net/ubuntu-1404-creating-a-very-jailed-user-with-jailkit/

if [ -d "/jail" ]; then
	echo "Jail already exists, skipping creation..."
	exit 0
fi

# Download and unpack jailkit
JAILKIT_VERSION=2.23
cd /tmp
wget "http://olivier.sessink.nl/jailkit/jailkit-$JAILKIT_VERSION.tar.gz"
tar xvfz "jailkit-$JAILKIT_VERSION.tar.gz"

# Install jailkit
cd "jailkit-$JAILKIT_VERSION"
./configure
sudo make
sudo make install

# Configure jailkit
sudo jk_init -v -j /jail ssh
sudo mkdir /jail/home
echo "users:x:100:" | sudo tee /jail/etc/group

# TODO: `sudo jk_check` to check if jailkit is working and secure
