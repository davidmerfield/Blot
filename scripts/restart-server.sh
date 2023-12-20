#!/bin/sh

set -e

if [[ -z "$BLOT_DIRECTORY" ]]; then
    echo "Missing env variables. Source them with:" 1>&2
    echo ". /etc/blot/environment.sh" 1>&2
    exit 1
fi

pid=$(cat $BLOT_DIRECTORY/data/process.pid)
logfile=$BLOT_DIRECTORY/logs/app.log

echo "Re-installing dependencies"
npm install
echo "Re-installed dependencies"

echo "Setting up server"
node $BLOT_DIRECTORY/app/setup.js
echo "Set up server"

echo "Stopping the application servers..."

sudo systemctl stop node

echo "Starting the application servers..."

sudo systemctl start node

# purge cache
curl 127.0.0.1/purge?host=$BLOT_HOST

echo "Success"