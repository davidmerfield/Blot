#!/bin/sh

# Used to run the app server in such a way that stdout
# is piped to the logfile used in production

set -e

if [[ -z "$BLOT_DIRECTORY" ]]; then
    echo "Missing env variables. Source them with:" 1>&2
    echo ". /etc/blot/environment.sh" 1>&2
    exit 1
fi

if [[ "$NODE_ENV" != "development" ]]; then
    echo "Do not run this in production" 1>&2
    exit 1
fi

node $BLOT_DIRECTORY/app | tee $BLOT_DIRECTORY/logs/app.log