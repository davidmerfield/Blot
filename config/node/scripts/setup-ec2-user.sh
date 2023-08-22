#!/bin/sh

# This should only be run once, when the instance is launched
# It will only work when run as root

BLOT_REPO=https://github.com/davidmerfield/Blot
BLOT_DIRECTORY="/var/www/blot"
NVM_URL=https://raw.githubusercontent.com/creationix/nvm/v0.32.1/install.sh
NODE_VERSION=16.14.0

echo "Installing node..."

# Install node
curl -o- $NVM_URL | bash

export NVM_DIR="$HOME/.nvm"

[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

source ~/.bashrc

nvm install $NODE_VERSION
nvm alias default $NODE_VERSION
nvm use $NODE_VERSION

# test that node is installed otherwise exit
if ! command -v node &> /dev/null
then
    echo "node could not be found"
    exit 1
fi

node -e "console.log('Running Node.js ' + process.version)"

echo "Installing Blot..."

# We use a shallow clone to reduce required disk space
git clone --depth 1 -b master --single-branch $BLOT_REPO $BLOT_DIRECTORY
cd $BLOT_DIRECTORY

echo "Installing Blot dependencies..."

PUPPETEER_SKIP_DOWNLOAD=true npm ci --include=dev

echo "Creating directories..."

# Most of these are required by the Blot application process
# logs and db are required by Redis
# logs is required by NGINX
mkdir -p $BLOT_DIRECTORY/blogs
mkdir -p $BLOT_DIRECTORY/tmp
mkdir -p $BLOT_DIRECTORY/logs
mkdir -p $BLOT_DIRECTORY/static

echo "Running blot tests"

source ~/scripts/environment.sh

# Run the Blot tests
npm test

echo "Server set up successfully"