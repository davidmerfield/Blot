#!/bin/sh

# Don't delete this, or Blot's upstart script will fail
# Update the environment variable $BLOT_START and the
# upstart/blot.conf if you need to move this

# Otherwise the nvm executable is not available
. ~/.nvm/nvm.sh

# Import environment variables from this file
. /etc/blot/environment.sh

# Make sure we are using the right version of node
nvm use $BLOT_NODE_VERSION

echo "[`date -u +%Y-%m-%dT%T.%3NZ`] Starting Blot server" >> $BLOT_LOG

# Start the node application
# and pipe the stdout and stderr to the log file using tee
node $BLOT_MAIN 2>&1 | tee -a $BLOT_LOG 