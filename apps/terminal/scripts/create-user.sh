#!/bin/bash

# Error if the username is not set
if [ "$USERNAME" == "" ]; then
	echo "ERROR: The username is not set. Please set the USERNAME environment variable and try again."
	exit 1
fi

# https://stackoverflow.com/a/14811915/6456163
if id "$USERNAME" >/dev/null 2>&1; then
	# WSL doesn't work with `&>/dev/null`, so we use the above for compatibility
	echo "User '$USERNAME' already exists, skipping creation..."
	exit 0
fi

echo "Creating user '$USERNAME'..."

# TODO: Use keys instead of a password for SSH authentication
# https://stackoverflow.com/a/50067008/6456163

# TODO: Look into other shells instead of bash for more security:
# https://stackoverflow.com/a/56319942/6456163

# TODO: https://serverfault.com/a/1093244/537331

# Create secure jail for the new user
bash ./create-jail.sh

# Add the new user to the jail
if grep -q -c "/jail/./home/$USERNAME" /etc/passwd; then
	echo "User '$USERNAME' already in jail, not adding again..."
else
	echo "Adding user '$USERNAME' to jail..."
	echo "$USERNAME:x:2000:100::/jail/./home/$USERNAME:/usr/sbin/jk_chrootsh" | sudo tee -a /etc/passwd
	echo "$USERNAME:x:2000:100::/home/$USERNAME:/bin/bash" | sudo tee -a /jail/etc/passwd
	echo "$USERNAME::11302:0:99999:7:::" | sudo tee -a /etc/shadow
	echo "Added user '$USERNAME' to jail..."
fi

# IDEA: https://stackoverflow.com/questions/21498667/how-to-limit-user-commands-in-linux

# Create the new user and their home directory
echo "$USERNAME:$PASSWORD" | sudo chpasswd
sudo jk_cp -v -f /jail /etc/shadow;
sudo jk_cp -v -f /jail /etc/shadow-;
sudo mkdir -p /jail/home/$USERNAME;
sudo chown 2000:100 /jail/home/$USERNAME;

# Create the user's .bashrc file
USERBASH="/jail/home/$USERNAME/.bashrc"
sudo touch $USERBASH

# Configure the user's bash profile and set the file to immutable
while IFS= read -r line
do
	# Adds the lines from the repo's `.bashrc` to the user's `.bashrc` line by line
	echo "$line" | sudo tee -a "$USERBASH";
done < "$PWD/.bashrc";
sudo chattr +i "$USERBASH";

# Remove the SSH banner for the new user
# Props to https://unix.stackexchange.com/a/96982/370076
if grep -q -c "Match User $USERNAME" /etc/ssh/sshd_config; then
	echo "SSH banner already set for user '$USERNAME', skipping..."
else
	echo "Setting SSH banner for user '$USERNAME'..."
	echo "Match User $USERNAME" | sudo tee -a /etc/ssh/sshd_config
	echo "  Banner \"none\"" | sudo tee -a /etc/ssh/sshd_config
	sudo service sshd restart
	echo "SSH banner removed for user '$USERNAME'..."
fi

# Configure what is accessible to the new user
bash ./configure-jail.sh

# TODO: Copy custom README template to /home/xterm/README.md
# TODO: Add an intentional vulnerability somewhere for CTF
# https://www.linuxquestions.org/questions/linux-server-73/motd-or-login-banner-per-user-699925/

echo "Created user '$USERNAME'!"
