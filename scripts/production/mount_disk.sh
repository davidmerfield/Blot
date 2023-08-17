#!/bin/sh
# This is part of the upstart script for Blot so if 
# you move it, make sure to update the upstart script
set -e
set -x 

DEVICE_NAME=xvdf

# Ensure we have mounted the file system
mkfs -t xfs /dev/$DEVICE_NAME || true
mkdir -p $BLOT_CACHE_DIRECTORY
mount /dev/$DEVICE_NAME $BLOT_CACHE_DIRECTORY || true
chown -R $BLOT_USER:$BLOT_USER $BLOT_CACHE_DIRECTORY || true