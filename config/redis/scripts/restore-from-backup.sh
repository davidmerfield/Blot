#!/bin/sh

# if the variable 'PRODUCTION_DUMP_FILE' is not set
# then use the value from redis6-cli config get dir
if [ -z "$PRODUCTION_DUMP_FILE" ]; then
    PRODUCTION_DUMP_FILE=/var/lib/redis6/dump.rdb
fi

BUCKET_HOURLY=s3://blot-redis-backups/hourly
BUCKET_DAILY=s3://blot-redis-backups/daily

echo "PRODUCTION_DUMP_FILE: $PRODUCTION_DUMP_FILE"

# if the variable 'DUMP_FILE' is not set
# then list available dumps and return an error
if [ -z "$DUMP_FILE" ]; then
    echo "DUMP_FILE environment variable not set"

    # list all the dump files in /backups
    echo "Available backups locally:"
    ls /backups

    echo "Available hourly backups on s3"
    aws s3 ls $BUCKET_HOURLY | awk '{print $4}'

    echo "Available daily backups on s3"
    aws s3 ls $BUCKET_DAILY | awk '{print $4}'

    echo "To load the most recent backup, run:"
    echo "sudo DUMP_FILE=XXX ./scripts/restore-from-backup.sh"

  exit 1
fi

# check the directory '/backups' for the 'DUMP_FILE'
if [ ! -f "/backups/$DUMP_FILE" ]; then

  echo "Downloading $DUMP_FILE from $BUCKET_DAILY/$DUMP_FILE"
  aws s3 cp $BUCKET_DAILY/$DUMP_FILE /backups/$DUMP_FILE

  echo "Downloading $DUMP_FILE from $BUCKET_HOURLY/$DUMP_FILE"
  aws s3 cp $BUCKET_HOURLY/$DUMP_FILE /backups/$DUMP_FILE
  
fi

echo "The file /backups/$DUMP_FILE exists"
systemctl stop redis6
cp /backups/$DUMP_FILE $PRODUCTION_DUMP_FILE
systemctl start redis6
echo "Redis restored from /backups/$DUMP_FILE"
exit 0
