
#!/bin/sh

set -e

if [[ -z "$BLOT_DIRECTORY" ]]; then
    echo "Missing env variables. Source them with:" 1>&2
    echo ". /etc/blot/environment.sh" 1>&2
    exit 1
fi

# if we pass the flag -fast to this script, it will skip the npm install step

FAST=false

if [[ $1 == "-fast" ]]; then
    FAST=true
fi

pid=$(cat $BLOT_DIRECTORY/data/process.pid)
logfile=$BLOT_DIRECTORY/logs/app.log

if [[ -z "$pid" ]]; then
    echo "No pid found in $BLOT_DIRECTORY/data/process.pid" 1>&2
    exit 1
fi

# if fast=false then we will reinstall dependencies

if [[ $FAST == false ]]; then
    echo "Re-installing dependencies"
    npm install
    echo "Re-installed dependencies"

    echo "Setting up server"
    node $BLOT_DIRECTORY/app/setup.js
    echo "Set up server"
fi

kill -s USR2 $pid
echo "Waiting for 'Replaced all workers' to appear in logs/app.log"
tail -f $logfile | sed '/Replaced all workers/ q'
echo "Restarted the application servers! Rebuilding the demo folders"

node $BLOT_DIRECTORY/app/templates/folders/index.js

echo "Rebuilt the folders"