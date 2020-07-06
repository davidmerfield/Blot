# Copy this file to /etc/blot/environment.sh and fill it in

# Flags
export NODE_ENV=production
export BLOT_CACHE=true
export BLOT_MAINTENANCE=false
export BLOT_DEBUG=false

# Server configuration
export BLOT_HOST=
export BLOT_IP=
export BLOT_DIRECTORY=
export BLOT_CACHE_DIRECTORY=

# Remove these eventually
export BLOT_PROTOCOL=https

# Name of linux user who runs the blot server
export BLOT_USER=

# Use latest stable version which passes tests
export BLOT_NODE_VERSION=12.16.3

# result of which pandoc
export BLOT_PANDOC_PATH=

# Scripts and variables used by Upstart
export BLOT_START=$BLOT_DIRECTORY/scripts/production/start_blot.sh
export BLOT_MAIN=$BLOT_DIRECTORY/app
export BLOT_LOG=$BLOT_DIRECTORY/logs/app.log

# Admin information
export BLOT_ADMIN_UID=
export BLOT_ADMIN_EMAIL=

#############################################
#               S E C R E T S               #
#############################################

export BLOT_SESSION_SECRET=
export BLOT_BACKUP_SECRET=

# Stripe for payment processing
export BLOT_STRIPE_KEY=
export BLOT_STRIPE_SECRET=

# Dropbox for folder syncing
export BLOT_DROPBOX_APP_KEY=
export BLOT_DROPBOX_APP_SECRET=
export BLOT_DROPBOX_FULL_KEY=
export BLOT_DROPBOX_FULL_SECRET=

# Dropbox credentials for testing purposes
export BLOT_DROPBOX_TEST_ACCOUNT_ID=
export BLOT_DROPBOX_TEST_ACCOUNT_APP_TOKEN=
export BLOT_DROPBOX_TEST_ACCOUNT_FULL_TOKEN=

# Youtube for fetching video player codes
export BLOT_YOUTUBE_SECRET=

# AWS for uploading images to Blot's CDN
export BLOT_AWS_KEY=
export BLOT_AWS_SECRET=

# Mailgun for sending emails to customers
export BLOT_MAILGUN_KEY=

# Twitter for fetching embed codes
export BLOT_TWITTER_CONSUMER_KEY=
export BLOT_TWITTER_CONSUMER_SECRET=
export BLOT_TWITTER_ACCESS_TOKEN_KEY=
export BLOT_TWITTER_ACCESS_TOKEN_SECRET=