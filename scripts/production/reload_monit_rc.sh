#!/bin/sh
set -e
set -x

SOURCE=/var/www/blot/config/
DESTINATION=/etc
FILE=monit.rc

cp "$SOURCE/$FILE" "$DESTINATION/$FILE"
chmod 0700 "$DESTINATION/$FILE"
stop monit
start monit