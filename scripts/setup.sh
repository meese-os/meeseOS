#!/bin/bash

##############################################################
# See my raspberrypi repo to configure your server securely: #
#          https://github.com/ajmeese7/raspberrypi           #
##############################################################

USERNAME=xterm
PASSWORD=xterminal123
# TODO: Pull this from an env variable, only use set passwd if it doesn't exist
# Possibly https://stackoverflow.com/a/30969768/6456163 or https://gist.github.com/mihow/9c7f559807069a03e302605691f85572
    # TODO: Implement `cp` for `.env.template` or whatever it was

# https://stackoverflow.com/a/14811915/6456163
if id "$USERNAME" &>/dev/null; then
    echo "User `$USERNAME` already exists, skipping creation"
else
    echo "Creating user `$USERNAME`"

    # TODO: Limited or restricted shell here
			# https://stackoverflow.com/a/14811915/6456163
    	# https://linux.die.net/man/1/lshell
			# https://www.mail-archive.com/secureshell@securityfocus.com/msg00301.html
			# https://docstore.mik.ua/orelly/networking_2ndEd/ssh/ch08_02.htm#ch08-13075.html
			# https://www.google.com/search?q=jailkit&sourceid=chrome&ie=UTF-8
			# https://tecadmin.net/how-to-limit-user-access-with-lshell-limited-shell/
			# https://www.techrepublic.com/article/how-to-use-restricted-shell-to-limit-user-access-to-a-linux-system/
    sudo useradd -m -s /bin/bash "$USERNAME"

    # https://stackoverflow.com/a/33511637/6456163
    echo "$USERNAME:$PASSWORD" | sudo chpasswd;history -d $(history 1)

    # Remove Maildir if it was created
    Maildir=/home/"$USERNAME"/Maildir
    if [ -d "$Maildir" ]; then rm -rf "$Maildir"; fi

    # IDEA: Get user input for Jenkins here with
    # https://www.shellhacks.com/jenkins-pipeline-input-step-example/

    # TODO: Copy custom README template to /home/xterm/README.md
    # TODO: Limit user's permissions so they cannot access directories that they aren't supposed to
    # TODO: Add an intentional vulnerability somewhere for CTF
		# https://www.linuxquestions.org/questions/linux-server-73/motd-or-login-banner-per-user-699925/
fi

sudo apt-get install -y sshpass python2 build-essential

# Optional: Install `oh-my-posh`
sh ./oh-my-posh.sh
