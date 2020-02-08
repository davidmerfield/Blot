#!/bin/sh
set -x
set -e

# This script assumes we start from a running, bare Amazon Linux instance

# Name of the unix user responsible for Blot server
USER={{user}}
BLOT_REPO={{blot_repo}}

# Updates installed packages
# yum with 'y' flag means answer 'yes' to all questions
yum -y update

# Install required packages
yum -y install git fail2ban ntp

# Create a user for Blot
id -u $USER &>/dev/null || useradd -m $USER

# Install NGINX/Openresty
yum install -y yum-utils
yum-config-manager --add-repo https://openresty.org/package/amazon/openresty.repo
yum install -y openresty

# Install Luarocks (required by auto-ssl)
wget http://luarocks.org/releases/luarocks-2.0.13.tar.gz
tar -xzvf luarocks-2.0.13.tar.gz
cd luarocks-2.0.13/
./configure --prefix=/usr/local/openresty/luajit \
    --with-lua=/usr/local/openresty/luajit/ \
    --lua-suffix=jit \
    --with-lua-include=/usr/local/openresty/luajit/include/luajit-2.1
make
make install
cd ../

# Todo install this package:
# luarocks install lua-resty-auto-ssl
mkdir /etc/resty-auto-ssl

# Install Redis
# gcc and tcl are required to run the tests
# todo: re-enable next line to run tests (tests are slow in developing this script)
yum install -y gcc tcl
wget http://download.redis.io/redis-stable.tar.gz
tar xvzf redis-stable.tar.gz
cd redis-stable
make

# todo: re-enable next line to run tests (tests are slow in developing this script)
# make test
cp src/redis-server {{redis.server}}
cp src/redis-cli {{redis.cli}}
cd ../

# Install node
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.32.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 10.16.3
node -e "console.log('Running Node.js ' + process.version)"

# Install Blot
git clone $BLOT_REPO
cd Blot
npm ci

node scripts/deploy/build

# Run redis as blot user
cp scripts/deploy/out/redis.service /etc/systemd/system/redis.service
systemctl enable redis.service
systemctl start redis.service

# Run nginx as blot user
cp scripts/deploy/out/nginx.service /etc/systemd/system/nginx.service
systemctl enable nginx.service
systemctl start nginx.service

# Setup monit for 