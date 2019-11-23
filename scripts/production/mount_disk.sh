#!/bin/sh

set -e

# This is part of the upstart script for Blot
DEVICE_NAME=nvme0n1

# Ensure we have mounted the file system
mkfs -t xfs /dev/$DEVICE_NAME
mount /dev/$DEVICE_NAME $CACHE_DIRECTORY
chown -R $BLOT_USER:$BLOT_USER $BLOT_CACHE_DIRECTORY