#!/bin/sh

# ------------------

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
# 0 1 * * * find /tmp -mtime +1 -delete

# To install to script to run once per day at midnight as ec2-user:
# sudo crontab -u ec2-user -e
# 0 0 * * * /var/www/blot/scripts/log-rotate.sh
# 0 1 * * * find /tmp -mtime +1 -delete

# Exit this script upon error
set -e

BLOT_DIRECTORY=/var/www/blot
LOG_DIRECTORY=$BLOT_DIRECTORY/data/logs
USER=$(whoami)

## If the user is root, we want to log as nobody
## because nginx creates logfiles as nobody
## since I have not configured it to run as a different user
if [ "$USER" == "root" ] 
then
   LOG_USER=nobody
else
   LOG_USER=$USER
fi

# Create a new directory for yesterday's logs
ARCHIVED_LOG_DIRECTORY=$LOG_DIRECTORY/archive-$(date +%Y-%m-%d)-$USER
mkdir $ARCHIVED_LOG_DIRECTORY

# Find all the names of log files owned by this user.
# Remember we run this script multiple times as different users
LOGFILE_NAMES=$(find $LOG_DIRECTORY -maxdepth 1 -user $LOG_USER -type f -exec basename {} \;)
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
mv $LOG_DIRECTORY/archive-$DATESTRING-$USER /tmp 2>/dev/null || true