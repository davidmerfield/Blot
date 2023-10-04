#!/bin/sh

# To install this script:
# 1. Copy this file to /backup.sh
# 2. Make it executable: chmod +x /backup.sh
# 3. Add it to cron for root and send stdout to a log file:
#   0 3 * * * /backup.sh >> /var/log/backup.log 2>&1

# There are 10 backups stored in /backups in the following format:
# /backups/$(date +%Y-%m-%d-%H)

# Configure the aws cli: aws configure

# Stops execution of the script if we encounter an error
set -e

set -x

echo "[$(date +%Y-%m-%d-%H-%M-%S)] Daily redis backup started "

BUCKET=blot-redis-backups

# We select the most recent backup from /backups and then upload it to S3
# using the AWS CLI. We then delete all but the last 10 backups from S3.

# First we need to work out which backup is the most recent
# We do this by listing all the directories in /backups, sorting them by name
# and then selecting the first one. If there are no backups, this will fail.
LATEST_BACKUP=$(ls /backups | sort -r | head -n 1)

# Now we upload the backup to S3
aws s3 cp /backups/$LATEST_BACKUP/dump.rdb s3://$BUCKET/$LATEST_BACKUP-uploaded-$(date +%H-%M).rdb

# Now we want to remove all but the last 10 backups from S3
# We can do this by listing all the backups in S3, sorting them by name
# and then removing all but the last 10. If there are less than 10 backups, this
# will do nothing.
aws s3 ls s3://$BUCKET/ | sort -r | tail -n +11 | awk '{print $4}' | xargs -I {} aws s3 rm s3://$BUCKET/{}

# set redis key 'last_backup' to the current timestamp
redis6-cli set blot:backups:daily $(date +%s)

echo "[$(date +%Y-%m-%d-%H-%M-%S)] Daily redis backup completed"
