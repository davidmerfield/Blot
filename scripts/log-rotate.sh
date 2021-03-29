#!/bin/sh

# Why rotate log files?
# Otherwise we run out of disk space fairly quickly.

# Why not use an existing tool like logrotate?
# It seemed annoying to configure for multiple users.

# What issues did you have writing this script?
# The first is that we have log files owned by different
# users. For example, nginx's logfile is owned by root. All
# other logfiles are owned by ec2-user.

# The second is that files must be edited in-place, otherwise
# the process that logs to it loses track of the file.

# To install to script to run once per day at midnight as root:
# $ sudo crontab -e
# 0 0 * * * /var/www/blot/scripts/log-rotate.sh

# To install to script to run once per day at midnight as ec2-user:
# sudo crontab -u ec2-user -e
# 0 0 * * * /var/www/blot/scripts/log-rotate.sh

# Exit this script upon error
set -e

BLOT_DIRECTORY=/var/www/blot
LOG_DIRECTORY=$BLOT_DIRECTORY/logs
USER=$(whoami)

# Create a new directory for yesterday's logs
ARCHIVED_LOG_DIRECTORY=$BLOT_DIRECTORY/logs/archive-$(date +%Y-%m-%d)-$USER
mkdir $ARCHIVED_LOG_DIRECTORY

# Find all the names of log files owned by this user.
# Remember we run this script multiple times as different users
LOGFILE_NAMES=$(find $LOG_DIRECTORY -maxdepth 1 -user $USER -type f -exec basename {} \;)
for logfile in $LOGFILE_NAMES
do
	cp $LOG_DIRECTORY/$logfile $ARCHIVED_LOG_DIRECTORY/$logfile
  truncate -s 0 $LOG_DIRECTORY/$logfile
done

# Move the directory created eight days ago to the tmp directory so it can be eventually
# cleaned up and removed. The complicated line to generate a date string works on
# both MacOS and Linux, which was annoying.
NOW=$(date +%s)
SEVEN_DAYS_AGO=$((NOW - 8 * 24 * 60 * 60))
DATESTRING=$(date --date @$SEVEN_DAYS_AGO +%Y-%m-%d 2>/dev/null || date -r $SEVEN_DAYS_AGO +%Y-%m-%d 2>/dev/null)
mv $LOG_DIRECTORY/archive-$DATESTRING-$USER $BLOT_DIRECTORY/tmp 2>/dev/null || true