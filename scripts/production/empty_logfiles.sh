#!/bin/sh

# I should write a script to rotate log files
set -e

FILES=/var/www/blot/logs/*
for f in $FILES
do
  echo "> $f"
  > $f
done