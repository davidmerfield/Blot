#!/bin/sh

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

echo "Ephemeral disk is $EPHEMERAL_DISK"

# Once we work out which disk is the ephemeral disk
# we create a file system on it and mount it to the cache
# directory, which is used by the application and NGINX
# to store cached rendered web pages. If  the disk is
# already mounted, we skip this step.
if grep -qs '/backups' /proc/mounts; then
  echo "Ephemeral disk already mounted to /backups"
  exit 0
fi

# if the disk lacks a file system, we create one
# and mount it to /backups
if [[ $(blkid -s TYPE -o value $EPHEMERAL_DISK) == "" ]]; then
  echo "Creating file system on $EPHEMERAL_DISK"
  mkfs -t xfs $EPHEMERAL_DISK
fi

mkdir -p /backups
mount $EPHEMERAL_DISK /backups

echo "Ephemeral disk mounted to /backups"