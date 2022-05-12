###
# Meant to help secure the jailed user's terminal
###

# Set variables in the shell
export TERM=xterm-256color
export SHELL=/nice/try

# Alias commands that are hard to disable to useless cryptic messages
alias ssh="echo \"You wanted a secure shell, you got one!\""
alias whoami="echo \"The better question is, *why* are you?\""

# Make things *slightly* more difficult for the user, so they have to
# work a little harder to escape rbash into real bash
  # TODO: Try to prevent escape from rbash to bash
alias bash="bash -r"

# Disable command history
set +o history
