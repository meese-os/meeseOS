#!/bin/bash

# Deletes the zork directory if it exists
sudo rm -rf ./zork

# Downloads the latest version of the Zork repo
if ! (git clone "https://$GITHUB_USERNAME:$GITHUB_PAT@github.com/meese-enterprises/zork.git" ./zork) then
	echo "ERROR: Failed to clone the repository. Did you set the GITHUB_USERNAME and GITHUB_PAT environment variables?"
	echo "If you did, do you have permission to clone the repository?"
	exit 1
fi

echo "Cloned the Zork repository successfully!"
pushd ./zork

# Deletes everything except the compiled game binaries and the special
# password-protected scripts to run them.
# https://stackoverflow.com/a/69741666/6456163
rm -rf $(ls -A | grep -vE "(COMPILED)|(zork.\.sh)")

# Convert shell files to binaries with shc
echo "Converting Zork shell files to binaries..."
git clone https://github.com/neurobin/shc
pushd shc
sh ./autogen.sh 2>/dev/null
./configure
make
sudo make install
popd
rm -rf shc

# Removes all the original scripts, leaving only the compiled binaries
ls -A | grep -E "zork.\.sh" | while read -r file; do
	echo "Compiling $file..."
	shc -U -f "$file" -o "${file%.*}"
	rm "$file" && rm "$file.x.c"
done

# Change the permissions of the files to disallow writing
sudo chown root:root -R *
sudo chmod 755 -R *

# Install the software necessary to run the game
sudo apt install frotz

# Copy the compiled game binaries to the jail
sudo cp -r * /jail/usr/local/bin

# TODO: Fix this returning strange useless text when executed

popd
