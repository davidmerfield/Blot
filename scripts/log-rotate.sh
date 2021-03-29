set -e

# To install:
# sudo crontab -u ec2-user -e
# 0 0 * * * /var/www/blot/scripts/log-rotate.sh
# sudo crontab -e
# 0 0 * * * /var/www/blot/scripts/log-rotate.sh

# We need to run this script multiple times as different users because 
# NGINX runs as root and everything else runs as ec2-user
USER=$(whoami)

# This is hardcoded for now but should use shared environment
BLOT_DIRECTORY=/var/www/blot
LOG_DIRECTORY=$BLOT_DIRECTORY/logs

# Create a new directory for today
ARCHIVED_LOG_DIRECTORY=$BLOT_DIRECTORY/logs/archive-$(date +%Y-%m-%d)-$USER
mkdir $ARCHIVED_LOG_DIRECTORY

# Find all the names of log files for which the current user has ownership
LOGFILE_NAMES=$(find $LOG_DIRECTORY -maxdepth 1 -user $USER -type f -exec basename {} \;)
for logfile in $LOGFILE_NAMES
do
	cp $LOG_DIRECTORY/$logfile $ARCHIVED_LOG_DIRECTORY/$logfile
  truncate -s 0 $LOG_DIRECTORY/$logfile
done

# Move the directory created eight days ago to the tmp directory so it can be eventually
# cleaned up and removed
NOW=$(date +%s)
SEVEN_DAYS_AGO=$((NOW - 8 * 24 * 60 * 60))
DATESTRING=$(date --date @$SEVEN_DAYS_AGO +%Y-%m-%d 2>/dev/null || date -r $SEVEN_DAYS_AGO +%Y-%m-%d 2>/dev/null)
mv $LOG_DIRECTORY/archive-$DATESTRING-$USER $BLOT_DIRECTORY/tmp || true