#!/bin/sh

# Don't delete this, or Postgres's upstart script will fail
# Update the environment variable $POSTGRES_START and the
# upstart/postgres.conf if you need to move this

# Import environment variables from this file
. /etc/blot/environment.sh

POSTGRES_SERVER=/usr/pgsql-12/bin/postgres
DATA_DIRECTORY=$BLOT_DIRECTORY/data/db/postgres
CONFIG_FILE=$BLOT_DIRECTORY/config/postgres.conf
LOG=$BLOT_DIRECTORY/logs/postgres.log

echo "[`date -u +%Y-%m-%dT%T.%3NZ`] Starting Postgres server" >> $LOG

# Start the node application
# "2>&1" redirects STERR to STDOUT so it is logged too
$POSTGRES_SERVER --config-file $CONFIG_FILE >> $LOG 2>&1