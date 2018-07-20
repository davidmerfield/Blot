# This is an example
# fill it out and move it to:
# /etc/blot/environment.sh

export BLOT_DIRECTORY=/var/www/blot

export BLOT_USER=ec2-user
export BLOT_START=$BLOT_DIRECTORY/scripts/production/start_blot.sh

export BLOT_MAIN=$BLOT_DIRECTORY/app
export BLOT_NODE_VERSION=4.4.2
export BLOT_LOG=$BLOT_DIRECTORY/logs/app.log