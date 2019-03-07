#!/bin/sh
set -e
set -x

DAEMON=/usr/local/openresty/bin/openresty
CONF=/var/www/blot/config/nginx/server.conf

sudo $DAEMON -t -c $CONF
sudo $DAEMON -s reload