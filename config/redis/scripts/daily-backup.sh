#!/bin/sh

# To install this script:
# 1. Copy this file to /backup.sh
# 2. Make it executable: chmod +x /backup.sh
# 3. Add it to cron for root and send stdout to a log file:
#   0 3 * * * /backup.sh >> /var/log/backup.log 2>&1

# There are 10 backups stored in /backups in the following format:
# /backups/$(date +%Y-%m-%d-%H)

# Stops execution of the script if we encounter an error
set -e

BUCKET=s3://blot-redis-backups/daily

# We keep 7 days of backups
NUMBER_OF_BACKUPS_TO_KEEP=7

echo "[$(date +%Y-%m-%d-%H-%M-%S)] Daily backup: Started"

# First we need to work out which backup is the most recent
# We do this by listing all the directories in /backups, sorting them by name
# and then selecting the first one. If there are no backups, this will fail.
LATEST_BACKUP=$(ls /backups | sort -r | head -n 1)

# Now we upload the backup to S3
echo "[$(date +%Y-%m-%d-%H-%M-%S)] Daily backup: Uploading $LATEST_BACKUP to $BUCKET"
aws s3 cp /backups/$LATEST_BACKUP/dump.rdb $BUCKET/$LATEST_BACKUP.rdb

# Now we want to remove all but the last 10 backups from S3
echo "[$(date +%Y-%m-%d-%H-%M-%S)] Daily backup: Removing old backups from $BUCKET"
aws s3 ls $BUCKET/ | sort -r | tail -n +$(($NUMBER_OF_BACKUPS_TO_KEEP + 1)) | awk '{print $4}' | xargs -I {} aws s3 rm $BUCKET/{}

# set redis key 'last_backup' to the current timestamp
redis6-cli set blot:backups:daily $(date +%s)
echo "[$(date +%Y-%m-%d-%H-%M-%S)] Daily backup: complete"