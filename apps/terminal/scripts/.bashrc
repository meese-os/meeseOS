###
# Meant to help secure the jailed user's terminal
###

# Set variables in the shell
export TERM=xterm-256color
export SHELL=/nice/try

# Alias commands that are hard to disable to useless cryptic messages
alias ssh="echo \"You wanted a secure shell, you got one!\""
alias whoami="echo \"The better question is, *why* are you?\""

# Disable command history
set +o history
