#!/bin/sh

set -e

if [[ -z "$BLOT_DIRECTORY" ]]; then
    echo "Missing env variables. Source them with:" 1>&2
    echo ". /etc/blot/environment.sh" 1>&2
    exit 1
fi

TOTAL_REQUESTS=400000

tail -n $TOTAL_REQUESTS $BLOT_DIRECTORY/logs/nginx.log | grep //$BLOT_HOST | grep " 404 " | grep -oE "[^ ]+$" | sort | uniq
