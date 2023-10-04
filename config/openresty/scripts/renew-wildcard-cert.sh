#!/bin/sh
set -e

ACME=/usr/local/bin/acme-nginx
LOGFILE=/var/log/letsencrypt.log
OPENRESTY=/usr/local/openresty/bin/openresty

# What are we doing here? Resetting the environment variables?
export AWS_ACCESS_KEY_ID=
export AWS_SECRET_ACCESS_KEY=

# Sources the environment variables required
. /etc/blot/environment.sh

echo "[`date -u +%Y-%m-%dT%T.%3NZ`] Beginning renewal of wildcard certificate" 
$ACME --no-reload-nginx --dns-provider route53 -d "*.$BLOT_HOST" -d "$BLOT_HOST" 
echo "[`date -u +%Y-%m-%dT%T.%3NZ`] Finished renewal of wildcard certificate" 

# We reload nginx/openresty manually because the command invoked
# by $ACME doesn't call openresty, it calls nginx
echo "[`date -u +%Y-%m-%dT%T.%3NZ`] Beginning reload of nginx/openresty" 
$OPENRESTY -s stop && $OPENRESTY -s start
echo "[`date -u +%Y-%m-%dT%T.%3NZ`] Finished reload of nginx/openresty" 