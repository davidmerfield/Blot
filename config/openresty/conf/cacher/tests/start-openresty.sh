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

sudo openresty -c $1
