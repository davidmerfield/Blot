#!/bin/sh
set -e

ACME=/usr/local/bin/acme-nginx
LOGFILE=/var/log/letsencrypt.log

# Sources the environment variables required
. /etc/blot/environment.sh

# This is required to allow the cron script to work correctly
alias nginx='/usr/local/openresty/bin/openresty'

echo "[`date -u +%Y-%m-%dT%T.%3NZ`] Beginning attempt to renew wildcard certificate" 

$ACME --dns-provider route53 -d "*.$BLOT_HOST" -d "$BLOT_HOST" 

echo "[`date -u +%Y-%m-%dT%T.%3NZ`] Finished attempt to renew wildcard certificate" 