#!/bin/bash

###
# Copy over commands that you want the new user to have access to
###

sudo jk_cp -v -f /jail /bin/rbash
sudo jk_cp -v -f /jail /bin/ls


###
# Copy over additional files that the new user needs access to
###

sudo jk_cp -v -f /jail /usr/bin/clear

# https://unix.stackexchange.com/a/83872/370076
sudo jk_cp -v -f /jail /usr/share/terminfo
sudo jk_cp -v -f /jail /lib/terminfo
