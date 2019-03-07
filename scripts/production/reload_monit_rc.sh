#!/bin/sh
set -e
set -x

SOURCE=/var/www/blot/config/
DESTINATION=/etc
FILE=monit.rc

cp "$SOURCE/$FILE" "$DESTINATION/$FILE"

# Monit requires that root owns the configuration file and that is has ```0700``` permissions.
chmod 0700 "$DESTINATION/$FILE"

stop monit
start monit

echo "Make sure localhost can be pinged by monit"