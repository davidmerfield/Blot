#!/bin/sh

# Prints all commands in this script as they are executed
# TODO: remove this once the script works
set -x

# Stops execution of the script if we encounter an error
set -e

# Mount ephemeral disk to cache
##########################################################

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
mkdir /backups
mount $EPHEMERAL_DISK /backups

