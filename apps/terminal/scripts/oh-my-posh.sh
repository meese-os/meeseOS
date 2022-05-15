#!/bin/bash

if sudo su -c "command -v oh-my-posh" "$USERNAME"; then
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
echo "Installing oh-my-posh..."
sudo wget https://github.com/JanDeDobbeleer/oh-my-posh/releases/latest/download/posh-linux-arm -O "$BINARIES/oh-my-posh" >/dev/null
sudo chmod +x "$BINARIES/oh-my-posh"
sudo chown "$USERNAME:users" "$BINARIES/oh-my-posh"

USERDIR="/jail/home/$USERNAME"
THEMESPATH="$USERDIR/.poshthemes"
sudo mkdir -p "$THEMESPATH"

# Pick a theme to your liking from here:
# https://ohmyposh.dev/docs/themes
echo "Installing the oh-my-posh theme..."
OHMYPOSHTHEME=material
THEMELINK="https://raw.githubusercontent.com/JanDeDobbeleer/oh-my-posh/main/themes/$OHMYPOSHTHEME.omp.json"
sudo wget "$THEMELINK" -O "$THEMESPATH/$OHMYPOSHTHEME.omp.json" >/dev/null
sudo chown -R "$USERNAME:users" "$THEMESPATH"

# /dev/null reference explained: https://unix.stackexchange.com/a/164628/370076
USERBASH="$USERDIR/.bashrc"
if ! grep -q -c "oh-my-posh" /dev/null "$USERBASH";
then
	echo "Adding oh-my-posh to the user's '.bashrc'..."
	sudo chattr -i "$USERBASH";

	# https://stackoverflow.com/a/19738137/6456163
	printf "\n# Loads the user's 'oh-my-posh' configuration when the shell starts\n" | sudo tee -a "$USERBASH"
	echo "eval \"\$(oh-my-posh init bash --strict --config /home/$USERNAME/.poshthemes/$OHMYPOSHTHEME.omp.json)\"" | sudo tee -a "$USERBASH"

	sudo chattr +i "$USERBASH";
fi
