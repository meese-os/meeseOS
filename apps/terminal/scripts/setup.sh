#!/bin/bash

##############################################################
# See my raspberrypi repo to configure your server securely: #
#          https://github.com/ajmeese7/raspberrypi           #
##############################################################

# Adds the `.env` variables to the shell environment:
# https://gist.github.com/mihow/9c7f559807069a03e302605691f85572?permalink_comment_id=2706921#gistcomment-2706921
if [ -f .env ]; then
	# Exports the .env variables to the shell environment:
	echo "The .env file exists"
	export $(sed 's/#.*//g' .env | xargs)
	echo printenv
elif [[ -n $USERNAME ]]; then
	# The env vars are already set, so just export them to be safe:
	echo "The username is set to '$USERNAME'"
	echo "The password is set to '$PASSWORD'"
	export USERNAME
	export PASSWORD
else
	# If no `.env` file exists and the env vars aren't already set,
	# ask the user for the data:
	read -p "Username: " USERNAME
	export USERNAME
	read -sp "Password: " PASSWORD
	export PASSWORD
	printf "\n"
fi

echo "After the if statements, the USERNAME is set to '$USERNAME'"
echo "After the if statements, the PASSWORD is set to '$PASSWORD'"

# Will create the user only if they do not already exist
sudo bash ./create-user.sh

# Installs some helpful packages used by the app
sudo apt-get install -y sshpass python2 build-essential

# Optional: Install `oh-my-posh`
bash ./oh-my-posh.sh

# Clean up the environment
echo "Cleaning up..."
unset USERNAME
unset PASSWORD
history -c
echo "Done!"
