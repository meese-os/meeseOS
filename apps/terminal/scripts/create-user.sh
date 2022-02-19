#!/bin/bash

# https://stackoverflow.com/a/14811915/6456163
if id "$USERNAME" >/dev/null 2>&1; then
	# WSL doesn't work with `&>/dev/null`, so we use the above
	echo "User '$USERNAME' already exists, skipping creation..."
	exit 0
fi

echo "Creating user '$USERNAME'..."

# TODO: Limited or restricted shell here
	# https://stackoverflow.com/a/14811915/6456163
	# https://linux.die.net/man/1/lshell
	# https://www.mail-archive.com/secureshell@securityfocus.com/msg00301.html
	# https://docstore.mik.ua/orelly/networking_2ndEd/ssh/ch08_02.htm#ch08-13075.html
	# https://www.google.com/search?q=jailkit&sourceid=chrome&ie=UTF-8
	# https://tecadmin.net/how-to-limit-user-access-with-lshell-limited-shell/
	# https://www.techrepublic.com/article/how-to-use-restricted-shell-to-limit-user-access-to-a-linux-system/
sudo useradd -m -s /bin/bash "$USERNAME"
echo "$USERNAME:$PASSWORD" | sudo chpasswd

# Remove Maildir if it was created by the system
Maildir=/home/"$USERNAME"/Maildir
if [ -d "$Maildir" ]; then rm -rf "$Maildir"; fi

# IDEA: Get user input for Jenkins here with
# https://www.shellhacks.com/jenkins-pipeline-input-step-example/

# TODO: Copy custom README template to /home/xterm/README.md
# TODO: Limit user's permissions so they cannot access directories that they aren't supposed to
# TODO: Add an intentional vulnerability somewhere for CTF
# https://www.linuxquestions.org/questions/linux-server-73/motd-or-login-banner-per-user-699925/

echo "Created user '$USERNAME'!"
