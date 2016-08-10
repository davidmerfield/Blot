#!/bin/sh
set -e
set -x

sudo nginx -t -c /var/www/blot/config/nginx.conf
sudo nginx -s reload