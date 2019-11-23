#!/bin/sh

# I should write a script to rotate log files
set -e

DEVICE_NAME=nvme0n1
CACHE_DIRECTORY=/cache
BLOT_USER=ec2-user

# Ensure we have mounted the file system
mkfs -t xfs /dev/$DEVICE_NAME
mount /dev/$DEVICE_NAME $CACHE_DIRECTORY
chown -R $BLOT_USER:$BLOT_USER $CACHE_DIRECTORY

# Restart the server
stop blot
start blot