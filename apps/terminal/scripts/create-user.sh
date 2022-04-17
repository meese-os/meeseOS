#!/bin/bash

# Error if the username is not set
if [ "$USERNAME" == "" ]; then
	echo "ERROR: The username is not set. Please set the USERNAME environment variable."
	exit 1
fi

# https://stackoverflow.com/a/14811915/6456163
if id "$USERNAME" >/dev/null 2>&1; then
	# WSL doesn't work with `&>/dev/null`, so we use the above for compatibility
	echo "User '$USERNAME' already exists, skipping creation..."
	exit 0
fi

echo "Creating user '$USERNAME'..."

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

# Create the new user and their home directory
echo "$USERNAME:$PASSWORD" | sudo chpasswd
cd /jail/home
sudo jk_cp -v -f /jail /etc/shadow
sudo jk_cp -v -f /jail /etc/shadow-
sudo mkdir -p $USERNAME
sudo chown 2000:100 $USERNAME

# Configure what is accessible to the new user
bash ./configure-jail.sh

# TODO: Copy custom README template to /home/xterm/README.md
# TODO: Add an intentional vulnerability somewhere for CTF
# https://www.linuxquestions.org/questions/linux-server-73/motd-or-login-banner-per-user-699925/

echo "Created user '$USERNAME'!"
