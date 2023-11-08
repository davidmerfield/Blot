#!/bin/sh

# Mount EBS data volume to /var/www/blot/data
##########################################################
# This is part of the upstart script for Blot so if 
# you move it, make sure to update the upstart script


# First we try and work out which disks have no mount point
DISKS=( $(lsblk -l -o TYPE,NAME | grep '^disk' | sed 's/disk //') )

# The heuristic we use is whether or not the disk has a file system on it 
# if it has a file system, we assume it is an EBS volume
for disk in "${DISKS[@]}"
do  
    MOUNT_POINT=$(lsblk /dev/${disk} -l -o MOUNTPOINT | tail -n 1)
    FILE_SYSTEM=$(lsblk /dev/${disk} -l -o FSTYPE | tail -n 1)
    if [[ $MOUNT_POINT == "" ]] && [[ $FILE_SYSTEM != "" ]]; then
        EBS_DISK=/dev/${disk}
        break;
    fi
done

if [[ $EBS_DISK == "" ]]; then
    echo "No EBS disk found"
    exit 1
fi

# If you change the cache directory, make sure to update
# the build-config.js propert 'cache_directory'
mkdir -p /var/www/blot/data
mount $EBS_DISK /var/www/blot/data
