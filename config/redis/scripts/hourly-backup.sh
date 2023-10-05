#!/bin/sh

# To install this script:
# 1. Copy this file to /backup.sh
# 2. Make it executable: chmod +x /backup.sh
# 3. Add it to cron for root and send stdout to a log file: 
#   0 3 * * * /backup.sh >> /var/log/backup.log 2>&1

# Stops execution of the script if we encounter an error
set -e

echo "[$(date +%Y-%m-%d-%H-%M-%S)] Hourly backup: Started "

BACKUP_NAME=$(date +%Y-%m-%d-hour-%H)
BUCKET=s3://blot-redis-backups/hourly

# We keep 6 most recent hourly backups, and then daily backups are kept for three days
NUMBER_OF_BACKUPS_TO_KEEP=6

# This directory name is important, it must sort before the backup names otherwise it becomes the most recent backup
# and will be uploaded to S3 by the daily backup script
TEMPORARY_DIRECTORY=.tmp 

echo "[$(date +%Y-%m-%d-%H-%M-%S)] Hourly backup: Creating temporary directory /backups/$TEMPORARY_DIRECTORY"

# will copy the file from /var/lib/redis6/dump.rdb to /backups/$timestamp/dump.rdb
# using rsync with a bandwidth limit to perform the local copy
mkdir -p /backups/$TEMPORARY_DIRECTORY/$BACKUP_NAME

echo "[$(date +%Y-%m-%d-%H-%M-%S)] Hourly backup: Copying /var/lib/redis6/dump.rdb to /backups/$TEMPORARY_DIRECTORY/$BACKUP_NAME/dump.rdb"

# limit of 50mb/s with the goal is to reduce the impact of the backup on the redis server
rsync --bwlimit=50000 /var/lib/redis6/dump.rdb /backups/$TEMPORARY_DIRECTORY/$BACKUP_NAME/dump.rdb

echo "[$(date +%Y-%m-%d-%H-%M-%S)] Hourly backup: Moving /backups/$TEMPORARY_DIRECTORY/$BACKUP_NAME to /backups/$BACKUP_NAME"

mv /backups/$TEMPORARY_DIRECTORY/$BACKUP_NAME /backups/$BACKUP_NAME

echo "[$(date +%Y-%m-%d-%H-%M-%S)] Hourly backup: Removing temporary directory /backups/$TEMPORARY_DIRECTORY"

# Now we upload the backup to S3
echo "[$(date +%Y-%m-%d-%H-%M-%S)] Hourly backup: Uploading /backups/$BACKUP_NAME/dump.rdb to $BUCKET/$BACKUP_NAME.rdb"
aws s3 cp /backups/$BACKUP_NAME/dump.rdb $BUCKET/$BACKUP_NAME.rdb

# Now we want to remove all but the last few backups from S3
echo "[$(date +%Y-%m-%d-%H-%M-%S)] Hourly backup: Removing old backups from $BUCKET"
aws s3 ls $BUCKET/ | sort -r | tail -n +$(($NUMBER_OF_BACKUPS_TO_KEEP + 1)) | awk '{print $4}' | xargs -I {} aws s3 rm $BUCKET/{}

# remove the temporary directory - it's important we do this before we remove old backups from /backups
rm -r /backups/$TEMPORARY_DIRECTORY

# now we want to remove all but the last 10 backups from /backups
# we can do this by listing all the directories in /backups, sorting them by name
# and then removing all but the last 10. If there are less than 10 backups, this
# will do nothing.
echo "[$(date +%Y-%m-%d-%H-%M-%S)] Hourly backup: Removing old backups from /backups"
ls /backups | sort -r | tail -n +11 | xargs -I {} rm -rf /backups/{}

echo "[$(date +%Y-%m-%d-%H-%M-%S)] Hourly backup: Completed"

# set redis key 'last_backup' to the current timestamp
redis6-cli set blot:backups:hourly $(date +%s)