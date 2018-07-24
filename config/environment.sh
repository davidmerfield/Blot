# This is an example
# fill it out and move it to:
# /etc/blot/environment.sh

# Path to Blot repository folder
# e.g. /var/www/blot
export BLOT_DIRECTORY=

# Name of linux user which should run the app
# e.g. ec2-user
export BLOT_USER=

# Make sure this is installed
export BLOT_NODE_VERSION=4.4.2

export BLOT_START=$BLOT_DIRECTORY/scripts/production/start_blot.sh
export BLOT_MAIN=$BLOT_DIRECTORY/app
export BLOT_LOG=$BLOT_DIRECTORY/logs/app.log

export BLOT_STRIPE_KEY=
export BLOT_STRIPE_SECRET=

export BLOT_DROPBOX_APP_KEY=
export BLOT_DROPBOX_APP_SECRET=
export BLOT_DROPBOX_FULL_KEY=
export BLOT_DROPBOX_FULL_SECRET=

export BLOT_SESSION_SECRET=
export BLOT_BACKUP_SECRET=

export BLOT_AWS_KEY=
export BLOT_AWS_SECRET=

export BLOT_MAILGUN_KEY=

export BLOT_YOUTUBE_SECRET=

export BLOT_TWITTER_CONSUMER_KEY=
export BLOT_TWITTER_CONSUMER_SECRET=
export BLOT_TWITTER_ACCESS_TOKEN_KEY=
export BLOT_TWITTER_ACCESS_TOKEN_SECRET=