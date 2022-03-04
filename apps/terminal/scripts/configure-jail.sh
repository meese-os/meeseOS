#!/bin/bash

# Copy over commands that you want the new user to have access to
sudo jk_cp -v -f /jail /bin/bash
sudo jk_cp -v -f /jail /bin/ls
