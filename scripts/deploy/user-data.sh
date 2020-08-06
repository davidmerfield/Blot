#!/bin/sh

# WARNING: contains secrets when it's rendered!
# This script assumes we start from a running, bare Amazon Linux 2 instance

# TODO: remove the output log for this script after it succeeds
# TODO: what happens to this script itself after it runs
# TODO: ensure the instance works after it's 'restarted'
# TODO: ensure the instance works when it's stopped then started

# Prints all commands in this script as they are executed
# TODO: remove this once the script works
set -x

# Stops execution of the script if we encounter an error
set -e

# Name of the unix user responsible for Blot server
# TODO: create users for redis, nginx and Blot (main process, worker process)
USER={{user}}

# URL to the git repository we will clone to get the application code, for example:
# https://github.com/davidmerfield/Blot
BLOT_REPO={{blot_repo}}

# TODO: verify whatever we fetch from these URLs
NVM_URL=https://raw.githubusercontent.com/creationix/nvm/v0.32.1/install.sh
PANDOC_URL=https://github.com/jgm/pandoc/releases/download/2.9.1.1/pandoc-2.9.1.1-linux-amd64.tar.gz
OPENRESTY_URL=https://openresty.org/package/amazon/openresty.repo
EPEL_URL=https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
# TODO: check if we can fetch these over HTTPS
LUAROCKS_URL=http://luarocks.org/releases/luarocks-2.0.13.tar.gz
REDIS_URL=http://download.redis.io/redis-stable.tar.gz

# Updates existing installed packages. The 'y' flag means
# answer 'yes' to all questions yum would otherwise ask
yum -y update

# Environment
##########################################################
# Write environment variables required to run the application.
# We use them in this script and in other processes
mkdir -p $(dirname {{environment_file}})
cat > {{environment_file}} <<EOL
{{#env}}
export {{key}}={{value}}
{{/env}}
EOL

# Source those environment variables in this script
. {{environment_file}}

# Mount ephemeral disk to cache
##########################################################

# First we try and work out which disk is available for mounting
DISKS=( $(lsblk -l -o TYPE,NAME | grep '^disk' | sed 's/disk //') )

# The heuristic we use is whether or not the disk has partitions
# I'm not sure if this is correct or not but it seems to work.
for disk in "${DISKS[@]}"
do
  PARTITIONS=$(lsblk /dev/${disk} -l -o TYPE | grep '^part' | wc -l)
  if [[ $PARTITIONS -eq 0 ]]; then
    EPHEMERAL_DISK=/dev/${disk}
    break;
  fi
done

# Once we work out which disk is the ephemeral disk
# we create a file system on it and mount it to the cache 
# directory, which is used by the application and NGINX
# to store cached rendered web pages
mkfs -t xfs $EPHEMERAL_DISK
mkdir {{cache_directory}}
mount $EPHEMERAL_DISK {{cache_directory}}

# Install and start fail2ban
# https://www.digitalocean.com/community/tutorials/how-to-protect-ssh-with-fail2ban-on-centos-7
# While Fail2ban is not available in the default package repository,
# it is packaged for the EPEL project. 
yum -y install $EPEL_URL
yum -y install fail2ban
systemctl enable fail2ban
systemctl start fail2ban

## Redis installation
##########################################################
# gcc and tcl are required to run the tests
yum install -y gcc tcl
wget $REDIS_URL -O redis.tar.gz
mkdir redis
tar xvzf redis.tar.gz -C redis
cd redis
make
# TODO: re-enable next line to run tests (tests are slow)
# make test
cp src/redis-server {{redis.server}}
cp src/redis-cli {{redis.cli}}
cd ../
rm -rf ./redis
rm redis-stable.tar.gz

# The following are recommendations for improving the performance
# of Redis on an AWS instance.
# TODO: fully research each line and document it. Ensure each change
# is persisted across reboot and hard stop/start
sysctl vm.overcommit_memory=1
bash -c "echo never > /sys/kernel/mm/transparent_hugepage/enabled"
dd if=/dev/zero of=/swapfile1 bs=1024 count=4194304

## NGINX installation
##########################################################
yum-config-manager --add-repo $OPENRESTY_URL
yum install -y yum-utils openresty

# Install Luarocks (required by auto-ssl)
wget $LUAROCKS_URL -O luarocks.tar.gz
mkdir luarocks
tar xzvf luarocks.tar.gz -C luarocks
cd luarocks
./configure --prefix=/usr/local/openresty/luajit \
    --with-lua=/usr/local/openresty/luajit/ \
    --lua-suffix=jit \
    --with-lua-include=/usr/local/openresty/luajit/include/luajit-2.1
make
make install
cd ../
rm luarocks.tar.gz
rm -rf ./luarocks

# Generate SSL fallback cert for NGINX
mkdir -p $(dirname {{fallback_certificate_key}})
openssl req -new -newkey rsa:2048 -days 3650 -nodes -x509 \
	-subj '/CN=sni-support-required-for-valid-ssl' \
	-keyout {{fallback_certificate_key}} \
	-out {{fallback_certificate}}

/usr/local/openresty/luajit/bin/luarocks install lua-resty-auto-ssl
mkdir /etc/resty-auto-ssl



## Blot installation
##########################################################

# Create a user for Blot
id -u $USER &>/dev/null || useradd -m $USER

# Install Pandoc
mkdir pandoc
wget $PANDOC_URL -O pandoc.tar.gz
tar xvzf pandoc.tar.gz --strip-components 1 -C pandoc
cp pandoc/bin/pandoc /usr/bin
rm pandoc.tar.gz
rm -rf ./pandoc

# Install node
curl -o- $NVM_URL | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install {{node.version}}
node -e "console.log('Running Node.js ' + process.version)"

# Install Blot
# Install git and ntp
# What is ntp required for?
yum -y install git ntp

# Blot's application uses gifsicle, which requires these build tools
# https://rmoff.net/2017/03/11/install-qemu-on-aws-ec2-amazon-linux/
# resolves /bin/sh: autoreconf: command not found
yum -y install autoconf autogen intltool libtool

# We use a shallow clone to reduce required disk space
git clone --depth 1 -b master --single-branch $BLOT_REPO {{directory}}
cd {{directory}}
npm ci

# Most of these are required by the Blot application process
# logs and db are required by Redis
# logs is required by NGINX
mkdir -p {{directory}}/blogs
mkdir -p {{directory}}/tmp
mkdir -p {{directory}}/logs
mkdir -p {{directory}}/db
mkdir -p {{directory}}/static

# Whitelist domains for ssl certificate issuance
echo "SET domain:{{host}} true" | {{redis.cli}}
echo "SET domain:www.{{host}} true" | {{redis.cli}}

# Generate systemd service configuration files
node scripts/deploy/build

# Start Redis service
cp scripts/deploy/out/redis.service /etc/systemd/system/redis.service
systemctl enable redis.service
systemctl start redis.service

# Start NGINX service
cp scripts/deploy/out/nginx.service /etc/systemd/system/nginx.service
systemctl enable nginx.service
systemctl start nginx.service

# Start Blot service
cp scripts/deploy/out/blot.service /etc/systemd/system/blot.service
systemctl enable blot.service
systemctl start blot.service

echo "Server set up successfully"

# We might need to allow read permissions to NGINX user
# chown -R blot:blot {{cache_directory}}

# We use rsync to transfer the database dump and blog folder from the other instance
# yum -y install rsync
# copy redis dump from other instance
# rysnc -i $PATH_TO_PREVIOUS_PEM ec2-user@:$PREVIOUS_IP:/var/www/blot/db/dump.rdb $DUMP

# copy blogs folder from other instance
# rysync -i $PATH_TO_PREVIOUS_PEM ec2-user@:$PREVIOUS_IP:/var/www/blot/db/dump.rdb $DUMP

# Monit

# Logrotate
# yum install logrotate