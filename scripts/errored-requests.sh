#!/bin/sh

set -e

if [[ -z "$BLOT_DIRECTORY" ]]; then
    echo "Missing env variables. Source them with:" 1>&2
    echo ". /etc/blot/environment.sh" 1>&2
    exit 1
fi

cat $BLOT_DIRECTORY/logs/nginx.log | grep -e " 500 " -e " 501 " -e " 502 " -e " 503 " -e " 504 " -e " 505 "