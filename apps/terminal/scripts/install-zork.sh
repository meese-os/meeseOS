#!/bin/bash
set -e

jail_bin="/jail/usr/local/bin"
zork_dir="$jail_bin/zork"

echo "[>] Deleting any existing Zork directory + files..."
pushd "$jail_bin"
sudo rm -rf $(ls -A | grep -E "(COMPILED)|(zork*)")
popd

echo "[>] Cloning the Zork repository..."
if ! (sudo git clone "https://$GITHUB_USERNAME:$GITHUB_PAT@github.com/meeseOS/zork.git" "$zork_dir") then
	echo "ERROR: Failed to clone the repository. Did you set the GITHUB_USERNAME and GITHUB_PAT environment variables?"
	echo "If you did, do you have permission to clone the repository?"
	echo
	exit 1
fi

echo "[+] Cloned the Zork repository successfully!"
pushd "$zork_dir"

echo "[>] Installing the software necessary to run the game files..."
sudo apt-get install -y frotz
sudo jk_cp -v -f /jail /usr/games/frotz

# Deletes everything except the encrypted game binaries and
# executables that are necessary to run them
# https://stackoverflow.com/a/69741666/6456163
echo "[>] Deleting everything except the encrypted game binaries and executables..."
sudo rm -rf $(ls -A | grep -vE "(COMPILED)|(EXECUTABLES)")
sudo mv EXECUTABLES/* .
sudo rm -rf EXECUTABLES

echo "[>] Moving the contents of the Zork folder to the proper directory..."
sudo rm -rf "$zork_dir/zork"
sudo mv "$zork_dir/"* "$jail_bin"
popd

echo "[>] Creating the symlink..."
pushd "$jail_bin"
sudo rm -rf "$zork_dir" zork
sudo ln -sf zork1 zork
popd

echo "[+] Installed Zork successfully!"
