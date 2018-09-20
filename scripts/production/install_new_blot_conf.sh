#!/bin/sh

# Exit immediately on error
set -e

# Show a trace of commands executed
set -x

# Ensure config directory exists for environment file
mkdir -p /etc/blot

# Move environment file across
# Eventually this should not happen here since environment will contain secrets
cp /var/www/blot/config/environment.sh /etc/blot/environment.sh

# Move upstart config file across
cp /var/www/blot/config/upstart/new-blot.conf /etc/init/blot.conf

initctl reload-configuration
initctl list | grep -e 'blot'