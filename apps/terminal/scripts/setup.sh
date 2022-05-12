#!/bin/bash

##############################################################
# See my raspberrypi repo to configure your server securely: #
#          https://github.com/ajmeese7/raspberrypi           #
##############################################################

# Adds the `.env` variables to the shell environment:
# https://gist.github.com/mihow/9c7f559807069a03e302605691f85572?permalink_comment_id=2706921#gistcomment-2706921
if [ -f .env ]; then
	# Exports the .env variables to the shell environment:
	echo "The .env file exists, sourcing it..."
	export $(sed 's/#.*//g' .env | xargs)
elif [ -v $USERNAME ]; then
	# If no `.env` file exists and the env vars aren't already set,
	# ask the user for the data:
	echo "The USERNAME environment variable is not set, prompting for input..."
	read -p "Username: " USERNAME
	export USERNAME
	read -sp "Password: " PASSWORD
	export PASSWORD
	printf "\n"
else
	# The env vars are already set, so just export them to be safe:
	echo "The USERNAME environment variable is set, exporting it..."
	export USERNAME
	export PASSWORD
fi

# Change to the directory where the script is located:
cd "$(dirname "$0")"

# Will create the user only if they do not already exist
bash ./create-user.sh

# TODO: Secure the server a little more with the following:
# https://serverfault.com/a/766634/537331

# Installs some helpful packages used by the app
sudo apt-get install -y sshpass python2 build-essential

# OPTIONAL: Install `oh-my-posh`
bash ./oh-my-posh.sh

# Clean up the environment
echo "Cleaning up..."
unset USERNAME
unset PASSWORD
history -c 2>/dev/null
echo "Done!"
