#!/bin/sh

set -e

if [[ -z "$BLOT_DIRECTORY" ]]; then
    echo "Missing env variables. Source them with:" 1>&2
    echo ". /etc/blot/environment.sh" 1>&2
    exit 1
fi

TOTAL_REQUESTS=400000
req_id=$(echo $1 | cut -c 1-6)

echo "In nginx.log:"
tail -n $TOTAL_REQUESTS $BLOT_DIRECTORY/logs/nginx.log | grep $req_id

echo "In app.log:"
tail -n $TOTAL_REQUESTS $BLOT_DIRECTORY/logs/app.log | sed -n -e "/$req_id/{:a" -e "N;/^\n/s/^\n//;/$req_id/{p;s/.*//;};ba" -e "};"
