#!/bin/sh

# This script assumes we start from a running, 
# bare Amazon Linux instance. When built this
# contains secrets and should not be shared!

# Print all commands in this script as they are executed
set -x

# Stop execution of the script if we encounter an error
set -e

# Name of the unix user responsible for Blot server
USER={{user}}

# URL to the git repository we will clone when we 
# get the application code, for example:
# https://github.com/davidmerfield/Blot
BLOT_REPO={{blot_repo}}

# todo: Check whatever is stored at these URLs
NVM_URL=https://raw.githubusercontent.com/creationix/nvm/v0.32.1/install.sh
LUAROCKS_URL=http://luarocks.org/releases/luarocks-2.0.13.tar.gz
REDIS_URL=http://download.redis.io/redis-stable.tar.gz
PANDOC_URL=https://github.com/jgm/pandoc/releases/download/2.9.1.1/pandoc-2.9.1.1-linux-amd64.tar.gz
OPENRESTY_URL=https://openresty.org/package/amazon/openresty.repo

# Store environment variables required to 
# run the application. We use them in this
# script and in other processes
mkdir -p $(dirname {{environment_file}})
cat > {{environment_file}} <<EOL
{{#env}}
export {{key}}={{value}}
{{/env}}
EOL

# Source those environment variables in this script
. {{environment_file}}

# Mount ephemeral disk to cache
DISKS=( $(lsblk -l -o TYPE,NAME | grep '^disk' | sed 's/disk //') )

# Try and work out which disk is available for mounting
for disk in "${DISKS[@]}"
do
  PARTITIONS=$(lsblk /dev/${disk} -l -o TYPE | grep '^part' | wc -l)
  if [[ $PARTITIONS -eq 0 ]]; then
    EPHEMERAL_DISK=/dev/${disk}
    break;
  fi
done

# Once we work out which disk is the ephemeral disk
# we create a file system on it and mount it to 
# the directory used by the application and NGINX
# to store cached rendered web pages
mkfs -t xfs $EPHEMERAL_DISK
mkdir {{cache_directory}}
mount $EPHEMERAL_DISK {{cache_directory}}

# Updates installed packages
# The 'y' flag means answer 'yes' to all questions
yum -y update

# Install and start fail2ban
# The 'y' flag means answer 'yes' to all questions
# https://www.digitalocean.com/community/tutorials/how-to-protect-ssh-with-fail2ban-on-centos-7
# While Fail2ban is not available in the official CentOS package repository,
# it is packaged for the EPEL project. EPEL, standing for Extra Packages
# for Enterprise Linux, can be installed with a release package that is 
# available from CentOS:
yum -y install https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
yum -y install fail2ban
systemctl enable fail2ban
systemctl start fail2ban

## Redis installation
##########################################################
# gcc and tcl are required to run the tests
# todo: re-enable next line to run tests (tests are slow in developing this script)
yum install -y gcc tcl
wget $REDIS_URL
tar xvzf redis-stable.tar.gz
cd redis-stable
make
# todo: re-enable next line to run tests (tests are slow in developing this script)
# make test
cp src/redis-server {{redis.server}}
cp src/redis-cli {{redis.cli}}
cd ../
mkdir -p {{directory}}/db
mkdir -p {{directory}}/logs
sysctl vm.overcommit_memory=1
bash -c "echo never > /sys/kernel/mm/transparent_hugepage/enabled"
dd if=/dev/zero of=/swapfile1 bs=1024 count=4194304

## NGINX installation
##########################################################
yum-config-manager --add-repo $OPENRESTY_URL
yum install -y yum-utils openresty

# Install Luarocks (required by auto-ssl)
wget $LUAROCKS_URL
tar -xzvf luarocks-2.0.13.tar.gz
cd luarocks-2.0.13/
./configure --prefix=/usr/local/openresty/luajit \
    --with-lua=/usr/local/openresty/luajit/ \
    --lua-suffix=jit \
    --with-lua-include=/usr/local/openresty/luajit/include/luajit-2.1
make
make install
cd ../

# Generate SSL fallback cert for NGINX
mkdir -p $(dirname {{fallback_certificate_key}})
openssl req -new -newkey rsa:2048 -days 3650 -nodes -x509 \
	-subj '/CN=sni-support-required-for-valid-ssl' \
	-keyout {{fallback_certificate_key}} \
	-out {{fallback_certificate}}

# Todo install this package:
/usr/local/openresty/luajit/bin/luarocks install lua-resty-auto-ssl
mkdir /etc/resty-auto-ssl



## Blot installation
##########################################################

# Create a user for Blot
id -u $USER &>/dev/null || useradd -m $USER

# Install Pandoc
mkdir pandoc
wget $PANDOC_URL
tar xvzf pandoc-2.9.1.1-linux-amd64.tar.gz --strip-components 1 -C pandoc
cp pandoc/bin/pandoc /usr/bin

# Install node
curl -o- $NVM_URL | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install {{node.version}}
node -e "console.log('Running Node.js ' + process.version)"

# gifsicle build tools
# https://rmoff.net/2017/03/11/install-qemu-on-aws-ec2-amazon-linux/
# resolves /bin/sh: autoreconf: command not found
sudo yum install -y autoconf autogen intltool libtool

# Install Blot
# Install git and ntp
# What is ntp required for?
yum -y install git ntp
git clone $BLOT_REPO {{directory}}
cd Blot
npm ci

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
mkdir -p $(dirname {{log_file}})
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