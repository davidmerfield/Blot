#!/bin/sh

set -e

if [[ -z "$BLOT_DIRECTORY" ]]; then
    echo "Missing env variables. Source them with:" 1>&2
    echo ". /etc/blot/environment.sh" 1>&2
    exit 1
fi

pid=$(cat $BLOT_DIRECTORY/data/process.pid)
logfile=$BLOT_DIRECTORY/logs/app.log

kill -s USR2 $pid
echo "Waiting for 'Replaced all workers' to appear in logs/app.log"
tail -f $logfile | sed '/Replaced all workers/ q'
echo "Restarted the application servers!"
