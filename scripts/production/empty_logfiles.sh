#!/bin/sh

set -e

FILES=/var/www/blot/logs/*
for f in $FILES
do
  echo "> $f"
  > $f
done