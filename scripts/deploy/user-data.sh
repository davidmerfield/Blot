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
ACME_NGINX_URL=https://github.com/kshcherban/acme-nginx/releases/download/v0.2.0/acme-nginx

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
# We use tar with --strip-components 1 to 
# remove the 'top level' directory after 
# tarring, which has the version number in it
tar -xvzf redis.tar.gz -C redis --strip-components 1
make --directory redis
# TODO: re-enable next line to run tests (tests are slow)
# make test
cp redis/src/redis-server {{redis.server}}
cp redis/src/redis-cli {{redis.cli}}
rm -rf redis
rm redis.tar.gz

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
# We use tar with --strip-components 1 to 
# remove the 'top level' directory after 
# tarring, which has the version number in it
tar -xzvf luarocks.tar.gz -C luarocks --strip-components 1
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

/usr/local/openresty/luajit/bin/luarocks install lua-resty-auto-ssl
mkdir /etc/resty-auto-ssl

# Generate SSL fallback cert for NGINX
# Fetch script to generate the wildcard certificate
mkdir -p $(dirname {{fallback_certificate_key}})
AWS_ACCESS_KEY_ID=$BLOT_WILDCARD_SSL_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$BLOT_WILDCARD_SSL_AWS_SECRET_ACCESS_KEY

wget $ACME_NGINX_URL 
chmod +x acme-nginx

# TODO: enable this to generate the wildcard ssl certificate
# ./acme-nginx --no-reload-nginx --dns-provider route53 -d "*.{{host}}" -d "{{host}}"

# mv /etc/ssl/private/letsencrypt-account.key {{fallback_certificate_key}}
# mv /etc/ssl/private/letsencrypt-domain.pem {{fallback_certificate}}

# cat > /etc/cron.d/renew-cert <<EOL
# # Renews SSL certificate for blot.im
# 12 11 10 * * root timeout -k 600 -s 9 3600 AWS_ACCESS_KEY_ID=$BLOT_WILDCARD_SSL_AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY=$BLOT_WILDCARD_SSL_AWS_SECRET_ACCESS_KEY /acme-nginx --no-reload-nginx --dns-provider route53 -d "*.{{host}}" -d "{{host}}" >> /var/log/letsencrypt.log 2>&1 || echo "Failed to renew certificate"
# EOL

# TODO: remove the following
mkdir -p $(dirname {{fallback_certificate_key}})
openssl req -new -newkey rsa:2048 -days 3650 -nodes -x509 \
  -subj '/CN=sni-support-required-for-valid-ssl' \
  -keyout {{fallback_certificate_key}} \
  -out {{fallback_certificate}}


## Blot installation
##########################################################

# Install Pandoc
mkdir pandoc
wget $PANDOC_URL -O pandoc.tar.gz
tar -xvzf pandoc.tar.gz --strip-components 1 -C pandoc
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
mkdir -p {{directory}}/static

# Make the users required to run all the scripts
adduser --system --no-create-home redis
adduser --system --no-create-home nginx
adduser --system --no-create-home blot

groupadd blot_directory
usermod -a -G blot_directory redis
usermod -a -G blot_directory blot
usermod -a -G blot_directory nginx

sudo chgrp -R blot_directory {{directory}}
sudo chmod -R 770 {{directory}}

groupadd cache_directory
usermod -a -G cache_directory blot
usermod -a -G cache_directory nginx

sudo chgrp -R cache_directory {{cache_directory}}
sudo chmod -R 770 {{cache_directory}}

# 701 is just execute, as far as I know
chown redis:redis {{redis.server}}
chmod 701 {{redis.server}}
chown redis:redis {{redis.cli}}
chmod 701 {{redis.cli}}
chown blot:blot {{node.bin}}
chmod 701 {{node.bin}}

# Per ./systemd/redis.service, the pidfile for the
# redis daemon is written to /var/run/redis/redis.pid
REDIS_PID_DIRECTORY=$(dirname {{redis.pid}})
mkdir $REDIS_PID_DIRECTORY
chown redis:redis $REDIS_PID_DIRECTORY
chmod -R 770 $REDIS_PID_DIRECTORY

mkdir {{directory}}/db
chown redis:redis {{directory}}/db
chmod -R 770 {{directory}}/db

# Generate systemd service configuration files
node scripts/deploy/build

# Start Redis service
cp scripts/deploy/out/redis.service /etc/systemd/system/redis.service
systemctl enable redis.service
systemctl start redis.service

# Run the Blot tests
npm test

# Reset DB after running tests
echo "flushall" | /usr/bin/redis-cli

# Whitelist domains for ssl certificate issuance
# which must happen once redis is running
echo "SET domain:{{host}} true" | {{redis.cli}}
echo "SET domain:www.{{host}} true" | {{redis.cli}}

# Start NGINX service
cp scripts/deploy/out/nginx.service /etc/systemd/system/nginx.service
systemctl enable nginx.service
systemctl start nginx.service

# Start Blot service
cp scripts/deploy/out/blot.service /etc/systemd/system/blot.service
systemctl enable blot.service
systemctl start blot.service


# We use rsync to transfer the database dump and blog folder from the other instance
# TODO
# MAKE SURE YOU CREATE AN INSTANCE IN THE SAME AVAILABILITY ZONE
# TO PREVENT UNEEDED DATA TRANSFER CHARGES 
yum -y install rsync
# copy redis dump from other instance
# rysnc -i $PATH_TO_PREVIOUS_PEM ec2-user@:$PREVIOUS_IP:/var/www/blot/db/dump.rdb $DUMP

# copy blogs folder from other instance
# rysync -i $PATH_TO_PREVIOUS_PEM ec2-user@:$PREVIOUS_IP:/var/www/blot/db/dump.rdb $DUMP

# Monit

# Logrotate
# yum install logrotate

echo "Server set up successfully"