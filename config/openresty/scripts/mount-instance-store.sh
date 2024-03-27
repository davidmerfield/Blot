#!/bin/sh

# Mount ephemeral disk to cache
##########################################################
# This is part of the upstart script for Blot so if 
# you move it, make sure to update the upstart script


# First we try and work out which disk is available for mounting
DISKS=( $(lsblk -l -o TYPE,NAME | grep '^disk' | sed 's/disk //') )

# The heuristic we use is whether or not the disk has partitions
# I'm not sure if this is correct or not but it seems to work.
for disk in "${DISKS[@]}"
do
  PARTITIONS=$(lsblk /dev/${disk} -l -o TYPE | grep '^part' | wc -l)
  if [[ $PARTITIONS -eq 0 ]]; then
    EPHEMERAL_DISK=/dev/${disk}
    break;
  fi
done

# Once we work out which disk is the ephemeral disk
# we create a file system on it and mount it to the cache 
# directory, which is used by the application and NGINX
# to store cached rendered web pages
mkfs -t xfs $EPHEMERAL_DISK

# If you change the cache directory, make sure to update
# the build-config.js propert 'cache_directory'
mkdir -p /var/instance-ssd
mount $EPHEMERAL_DISK /var/instance-ssd
