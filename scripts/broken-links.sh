#!/bin/sh

# Used to detect broken links into Blot which might be worth
# setting up redirects for. To set up a redirect add rules
# to app/brochure/redirector.js

set -e

if [[ -z "$BLOT_DIRECTORY" ]]; then
    echo "Missing env variables. Source them with:" 1>&2
    echo ". /etc/blot/environment.sh" 1>&2
    exit 1
fi

cat $BLOT_DIRECTORY/logs/nginx.log | grep //$BLOT_HOST | grep " 404 " | grep -oE "[^ ]+$" | sort | uniq
