#!/bin/sh

# Using Volta to install Node.js is better for system permissions because it avoids the need for
# administrator rights, prevents global permission errors, and provides isolated, reproducible
# environments for each user and project. The native installer, by contrast, often requires elevated
# permissions and can lead to permission conflicts, especially when installing global npm packages
# or working in multi-user environments

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Install Volta with error handling
if ! curl -sSf https://get.volta.sh | bash >/dev/null 2>&1; then
    printf "\n${RED}Error: Volta installation failed${NC}\n"
    exit 1
fi

# Configure environment for current session
export VOLTA_HOME="$HOME/.volta"
export PATH="$VOLTA_HOME/bin:$PATH"

append_if_missing() {
    FILE="$1"
    LINE="$2"
    grep -qxF "$LINE" "$FILE" 2>/dev/null || echo "$LINE" >> "$FILE"
}

# Add Volta bin to Bash, Zsh, and Fish if present
BASH_RC="$HOME/.bashrc"
ZSH_RC="$HOME/.zshrc"
FISH_CONFIG="$HOME/.config/fish/config.fish"

if [ -f "$BASH_RC" ]; then
    append_if_missing "$BASH_RC" 'export VOLTA_HOME="$HOME/.volta"'
    append_if_missing "$BASH_RC" 'export PATH="$VOLTA_HOME/bin:$PATH"'
fi

if [ -f "$ZSH_RC" ]; then
    append_if_missing "$ZSH_RC" 'export VOLTA_HOME="$HOME/.volta"'
    append_if_missing "$ZSH_RC" 'export PATH="$VOLTA_HOME/bin:$PATH"'
fi

if [ -f "$FISH_CONFIG" ]; then
    append_if_missing "$FISH_CONFIG" 'set -gx VOLTA_HOME $HOME/.volta'
    append_if_missing "$FISH_CONFIG" 'set -gx PATH $VOLTA_HOME/bin $PATH'
fi

# Node.js installation with spinner
printf "${GREEN}Installing Node.js..."
(
    i=1
    sp='|/-\'
    while :; do
        printf "\b${sp:i++%${#sp}:1}"
        sleep 0.1
    done
) &
SPIN_PID=$!

# Capture installation exit code
INSTALL_EXIT=0
volta install node >/dev/null 2>&1 || INSTALL_EXIT=$?

# Clean up spinner
kill $SPIN_PID 2>/dev/null
wait $SPIN_PID 2>/dev/null

# Handle installation result
if [ $INSTALL_EXIT -ne 0 ]; then
    printf "\b${RED}Error: Node.js installation failed (code $INSTALL_EXIT)${NC}\n"
    exit 2
else
    printf "\b${GREEN}Done!${NC}\n"
fi

# Reload the current shell
printf "${GREEN}Reloading shell...${NC}\n"
exec $SHELL