#!/bin/bash

if command -v oh-my-posh >/dev/null 2>&1; then
	echo "oh-my-posh is already installed..."
	exit 0
fi

# Depending on the architecture of your server, you may need to change `arm`.
# See all the available architectures here:
# https://github.com/JanDeDobbeleer/oh-my-posh/releases
sudo wget https://github.com/JanDeDobbeleer/oh-my-posh/releases/latest/download/posh-linux-arm -O /usr/local/bin/oh-my-posh
sudo chmod +x /usr/local/bin/oh-my-posh
USERDIR="/home/$USERNAME"
sudo mkdir "$USERDIR/.poshthemes"

# Pick a theme to your liking from here:
# https://ohmyposh.dev/docs/themes
OHMYPOSHTHEME=material
THEMELINK="https://raw.githubusercontent.com/JanDeDobbeleer/oh-my-posh/main/themes/$OHMYPOSHTHEME.omp.json"
sudo wget "$THEMELINK" -O "$USERDIR/.poshthemes/$OHMYPOSHTHEME.omp.json"

# /dev/null reference explained: https://unix.stackexchange.com/a/164628/370076
if ! grep -q -c "oh-my-posh" /dev/null "$USERDIR/.bashrc";
then
	# https://stackoverflow.com/a/19738137/6456163
	printf "\n# Loads the user's oh-my-posh configuration when the shell starts\n" | sudo tee -a "$USERDIR/.bashrc"
	echo "eval \"\$(oh-my-posh --init --shell bash --config $USERDIR/.poshthemes/$OHMYPOSHTHEME.omp.json)\"" | sudo tee -a "$USERDIR/.bashrc"
fi

# TODO: Install a NerdFont as well for full effect,
# otherwise let the user know that they can only use minimal themes:
# https://ohmyposh.dev/docs/config-fonts
