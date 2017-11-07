#!/bin/sh
set -e
set -x

sudo /usr/local/openresty/bin/openresty -t -c /var/www/blot/config/nginx.conf
sudo /usr/local/openresty/bin/openresty -s reload