###
# Meant to help secure the jailed user's terminal
###

# Display an initial message to the user when the shell is loaded
echo "Welcome to the secure terminal!"

# Set variables in the shell
export TERM=xterm-256color
export SHELL=/nice/try

# Alias commands that are hard to disable to useless cryptic messages
alias ssh="echo \"You wanted a secure shell, you got one!\""
alias whoami="echo \"The better question is, *why* are you?\""

# Implement "cat" so `oh-my-posh` can be used without error;
# clever users can also use this to view the contents of files,
# which is why I wanted to avoid using `cat` in the first place.
# Unfortunately this is the best solution that is currently available.
  # Thanks to https://stackoverflow.com/a/55620350/6456163
  # and https://unix.stackexchange.com/a/195484/370076 for this idea
alias cat='_cat(){ echo "$(<$1)";}; _cat'

# Disable command history
set +o history
