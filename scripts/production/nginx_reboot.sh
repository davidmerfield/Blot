#!/bin/sh
set -e
set -x

nginx -t -c /var/www/blot/config/nginx.conf
nginx -s reload