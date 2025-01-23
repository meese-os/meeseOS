#!/bin/bash

##
# Useful in testing when you need to start from scratch
##

# Set all the user's .bashrc files to no longer be immutable
if [ -d /jail/home ]; then
  sudo find /jail/home -type f -name '.bashrc' -exec sudo chattr -i {} +
fi

# Unmount's the /jail/proc filesystem
if mountpoint -q /jail/proc; then
  sudo umount /jail/proc
fi

# Delete all the users to ensure there are no artifacts in the system
# https://stackoverflow.com/a/2108296/6456163
for dir in /jail/home/*/; do
	dir=${dir%*/}
	sudo userdel -f "${dir##*/}" 2>/dev/null
done

# Delete the jail
sudo rm -rf /jail
