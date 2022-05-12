#!/bin/bash

###
# Copy over commands that you want the new user to have access to
###

echo "Copying over commands for the new user..."
sudo jk_cp -v -f /jail /bin/rbash
sudo jk_cp -v -f /jail /bin/ls
sudo jk_cp -v -f /jail /usr/bin/clear
sudo jk_cp -v -f /jail /usr/bin/which
# TODO: Make `which` not throw rbash: /usr/bin/which: /bin/sh: bad interpreter: No such file or directory

###
# Copy over additional files that the new user needs access to
###

# https://unix.stackexchange.com/a/83872/370076
echo "Copying over terminal info, this may take a while..."
sudo jk_cp -v -f /jail /usr/share/terminfo >/dev/null
sudo jk_cp -v -f /jail /lib/terminfo >/dev/null

###
# Remove access to system commands that you don't want the new user to have access to
###

echo "Removing access to system commands..."
sudo rm -rf /jail/usr/bin/ssh
