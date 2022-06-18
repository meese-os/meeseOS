#!/bin/bash

jail_bin="/jail/usr/local/bin"
zork_dir="$jail_bin/zork"

# Deletes the zork directory + files if they exist
pushd "$jail_bin"
sudo rm -rf $(ls -A | grep -E "(COMPILED)|(zork*)")
popd

# Downloads the latest version of the Zork repo
if ! (sudo git clone "https://$GITHUB_USERNAME:$GITHUB_PAT@github.com/meese-enterprises/zork.git" "$zork_dir") then
	echo "ERROR: Failed to clone the repository. Did you set the GITHUB_USERNAME and GITHUB_PAT environment variables?"
	echo "If you did, do you have permission to clone the repository?"
	exit 1
fi

echo "Cloned the Zork repository successfully!"
pushd "$zork_dir"

# Install the software necessary to run the game files
sudo apt install frotz
sudo jk_cp -v -f /jail /usr/games/frotz

# Deletes everything except the encrypted game binaries and
# executables that are necessary to run them
# https://stackoverflow.com/a/69741666/6456163
sudo rm -rf $(ls -A | grep -vE "(COMPILED)|(EXECUTABLES)")
sudo mv EXECUTABLES/* .
sudo rm -rf EXECUTABLES

# Move the contents of the folder to the proper directory
sudo mv "$zork_dir/"* "$jail_bin"
popd

# Moving the symlink breaks it, so instead we can delete it and create a new one
pushd "$jail_bin"
sudo rm -rf "$zork_dir" zork
sudo ln -sf zork1 zork
popd
