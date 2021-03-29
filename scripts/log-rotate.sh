set -e

# To install:

# sudo crontab -u ec2-user -e
# 0 0 * * * /var/www/blot/scripts/log-rotate.sh
# sudo crontab -e
# 0 0 * * * /var/www/blot/scripts/log-rotate.sh

USER=$(whoami)
BLOT_DIRECTORY=/var/www/blot
LOG_DIRECTORY=$BLOT_DIRECTORY/logs

# Create a new directory for today
ARCHIVED_LOG_DIRECTORY=$BLOT_DIRECTORY/logs/archive-$(date +%Y-%m-%d)-$USER
echo "mkdir $ARCHIVED_LOG_DIRECTORY"

# Find all the names of log files for which the current user has ownership
# We need to run this script multiple times as different users because 
# NGINX runs as root and everything else runs as ec2-user
LOGFILE_NAMES=$(find $LOG_DIRECTORY -maxdepth 1 -user $USER -type f -exec basename {} \;)

for logfile in $LOGFILE_NAMES
do
	echo "cp $LOG_DIRECTORY/$logfile $ARCHIVED_LOG_DIRECTORY/$logfile"
  echo "truncate -s 0 $LOG_DIRECTORY/$logfile"
done

# Remove the directory seven days ago if it exists
NOW=$(date +%s)
SEVEN_DAYS_AGO=$((NOW - 7 * 24 * 60 * 60))
DATESTRING=$(date --date @$SEVEN_DAYS_AGO +%Y-%m-%d 2>/dev/null || date -r $SEVEN_DAYS_AGO +%Y-%m-%d 2>/dev/null)
echo "rm -rf $BLOT_DIRECTORY/logs/archive-$DATESTRING-$USER || true"