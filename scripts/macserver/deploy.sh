#!/bin/bash

# Exit immediately if any command fails
set -e

REMOTE_CODE_DIRECTORY=/Users/admin/blot
REMOTE_MACSERVER_CODE_DIRECTORY=app/clients/icloud/macserver

# Function to run a command over SSH
ssh_macserver() {
  ssh macserver "$@" || { echo "SSH command failed: $@"; exit 1; }
}

# Restart the application using PM2 with nvm loaded
echo "Restarting the macserver process with PM2..."
ssh_macserver "export NVM_DIR=\"\$HOME/.nvm\" && [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\" && cd $REMOTE_CODE_DIRECTORY && git pull && cd $REMOTE_MACSERVER_CODE_DIRECTORY && npm i && pm2 restart macserver"

echo "Deployment completed successfully!"