#!/bin/bash

##############################################################
# See my raspberrypi repo to configure your server securely: #
#          https://github.com/ajmeese7/raspberrypi           #
##############################################################

# Adds the `.env` variables to the shell environment:
# https://gist.github.com/mihow/9c7f559807069a03e302605691f85572?permalink_comment_id=2706921#gistcomment-2706921
if [ -f .env ]
then
	export $(cat .env | sed 's/#.*//g' | xargs)
else
	read -p "Username: " USERNAME
	read -sp "Password: " PASSWORD
	printf "\n"
fi

# Will create the user only if they do not already exist
sh ./create-user.sh

# Installs some helpful packages used by the app
sudo apt-get install -y sshpass python2 build-essential

# Optional: Install `oh-my-posh`
sh ./oh-my-posh.sh

# Clean up the environment
echo "Cleaning up..."
unset USERNAME
unset PASSWORD
history -c
echo "Done!"
