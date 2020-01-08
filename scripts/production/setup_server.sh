# run a script which spins:
# up a new instance
# configures that new instance
# fetches previous DB and data directory
# and then starts the server on a staging domain
# then checks it works
# then maps the instance to the production up

#!/bin/sh

# This script assumes we start from a running, bare Amazon Linux instance

# Check if user is root
[ "$(id -u)" != "0" ] && {
    echo "Error: run this script as root. Use 'sudo su - root' to login as root"
    exit 1
}

# Name of the unix user responsible for Blot server
USER=blot

# Updates installed packages
# yum with 'y' flag means answer 'yes' to all questions
yum -y update

# Install required packages
yum -y install git fail2ban ntp


id -u $USER &>/dev/null || useradd $USER

# 
yum install -y yum-utils
yum-config-manager --add-repo https://openresty.org/package/amazon/openresty.repo
yum install -y openresty


# Install Redis
wget http://download.redis.io/redis-stable.tar.gz
tar xvzf redis-stable.tar.gz
cd redis-stable
make
make test