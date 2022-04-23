#!/bin/bash

if sudo su -c "command -v oh-my-posh" $USERNAME; then
	echo "oh-my-posh is already installed for this user..."
	exit 0
fi

# Optional: Install a Nerd Font for best results.
# Otherwise you should stick with the minimal themes:
# https://ohmyposh.dev/docs/config-fonts
bash ./install-nerdfont.sh

# Create the binaries folder if it doesn't exist
BINARIES=/jail/usr/local/bin
sudo mkdir -p "$BINARIES"

# Depending on the architecture of your server, you may need to change `arm`.
# See all the available architectures here:
# https://github.com/JanDeDobbeleer/oh-my-posh/releases
sudo wget https://github.com/JanDeDobbeleer/oh-my-posh/releases/latest/download/posh-linux-arm -O "$BINARIES/oh-my-posh"
sudo chmod +x "$BINARIES/oh-my-posh"
sudo chown -R $USERNAME "$BINARIES/oh-my-posh"
USERDIR="/jail/home/$USERNAME"
sudo mkdir -p "$USERDIR/.poshthemes"

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
	echo "eval \"\$(oh-my-posh init bash --strict --config $USERDIR/.poshthemes/$OHMYPOSHTHEME.omp.json)\"" | sudo tee -a "$USERDIR/.bashrc"
fi
