#!/bin/sh

# Otherwise the nvm executable is not available
. ~/.nvm/nvm.sh

# Import environment variables from this file
. /etc/blot/environment.sh

# Make sure we are using the right version of node
nvm use $BLOT_NODE_VERSION

# Install dependencies
# npm install
# Wipe the log
# rm $BLOT_LOG

echo "[`date -u +%Y-%m-%dT%T.%3NZ`] Starting Blot server" >> $BLOT_LOG

# Start the node application
# "2>&1" redirects STERR to STDOUT so it is logged too
node $BLOT_MAIN >> $BLOT_LOG 2>&1