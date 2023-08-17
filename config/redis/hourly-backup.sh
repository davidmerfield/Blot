#!/bin/sh

# To install this script:
# 1. Copy this file to /backup.sh
# 2. Make it executable: chmod +x /backup.sh
# 3. Add it to cron for root and send stdout to a log file: 
#   0 3 * * * /backup.sh >> /var/log/backup.log 2>&1


# Stops execution of the script if we encounter an error
set -e

echo "[$(date +%Y-%m-%d-%H-%M-%S)] Hourly redis backup started "

# will copy the file from /var/lib/redis6/dump.rdb to /backups/$timestamp/dump.rdb
# using rsync with a bandwidth limit to perform the local copy
mkdir -p /backups/$(date +%Y-%m-%d-%H)

# limit of 20mb/s
# the goal is to reduce the impact of the backup on the redis server but i'm not
# sure if this is the best way to do it
rsync --bwlimit=20000 /var/lib/redis6/dump.rdb /backups/$(date +%Y-%m-%d-%H)/dump.rdb

# now we want to remove all but the last 10 backups from /backups
# we can do this by listing all the directories in /backups, sorting them by name
# and then removing all but the last 10. If there are less than 10 backups, this
# will do nothing.
ls /backups | sort -r | tail -n +11 | xargs -I {} rm -rf /backups/{}

echo "[$(date +%Y-%m-%d-%H-%M-%S)] Hourly redis backup completed"

# set redis key 'last_backup' to the current timestamp
redis6-cli set blot:backups:hourly $(date +%s)