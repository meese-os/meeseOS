#!/bin/bash

###
# Copy over commands that you want the new user to have access to
###

echo "Copying over commands for the new user..."

declare -a commands=(
  "/bin/bash"        # The default shell
  "/bin/sh"          # Required for which
  "/bin/dash"        # Required for which
  "/bin/ls"
  "/usr/bin/clear"
  "/usr/bin/which"
  "/usr/bin/tr"      # Required for oh-my-posh
  "/bin/rm"          # Required for oh-my-posh
)

# Props to https://stackoverflow.com/a/22432604/6456163 for array looping code
num_commands=${#commands[@]}
for (( i=0; i<num_commands; i++ ));
do
  sudo jk_cp -v -f /jail "${commands[$i]}"
done

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

###
# Create the /proc directory so the oh-my-posh executable can be found
# https://superuser.com/a/165117/704578
###

echo "Creating the /proc directory..."
sudo mkdir /jail/proc
sudo mount -t proc /proc /jail/proc/
# TODO: Try remounting /proc on every reboot with
# https://serverfault.com/a/302124/537331

# Create a `/tmp` directory for use by oh-my-posh
sudo mkdir /jail/tmp
sudo chmod 777 /jail/tmp # ;)
