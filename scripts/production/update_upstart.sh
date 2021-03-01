#!/bin/sh
set -e
set -x

SOURCE=/var/www/blot/config/upstart
DESTINATION=/etc/init

NGINX=nginx.conf
REDIS=redis.conf
BLOT=blot.conf
MONIT=monit.conf
POSTGRES=postgres.conf

cp "$SOURCE/$NGINX" "$DESTINATION/$NGINX"
cp "$SOURCE/$REDIS" "$DESTINATION/$REDIS"
cp "$SOURCE/$MONIT" "$DESTINATION/$MONIT"
cp "$SOURCE/$BLOT" "$DESTINATION/$BLOT"
cp "$SOURCE/$POSTGRES" "$DESTINATION/$POSTGRES"

initctl reload-configuration
initctl list | grep -e 'blot\|nginx\|redis\|monit\|postgres'