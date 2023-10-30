#!/bin/bash

# kill all nginx processes
PIDS=$(ps -ef | grep nginx | grep -v grep | awk '{print $2}')

if [ -z "$PIDS" ]; then
  echo "No nginx processes running"
else
  
# for each PID, kill it
for PID in $PIDS
    do
      echo "Killing nginx process $PID"
      sudo kill -9 $PID
    done
fi

# determine the path to the openresty executable
# on my mac it will be present in the PATH already, but on github actions 
# we need to use: /usr/local/openresty/bin/openresty
OPENRESTY=$(which openresty)

if [ -z "$OPENRESTY" ]; then
  OPENRESTY="/usr/local/openresty/bin/openresty"
  exit 1
fi

sudo $OPENRESTY -c $1
