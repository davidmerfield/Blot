#!/bin/sh

# This should only be run once, when the instance is launched
# It will only work when run as root

SETUP_DIRECTORY="/home/ec2-user/setup"
BLOT_DIRECTORY="/var/www/blot"

BLOT_REPO=https://github.com/davidmerfield/Blot
NVM_URL=https://raw.githubusercontent.com/creationix/nvm/v0.32.1/install.sh

# TODO: update pandoc on Blot to 3.1.6.1
PANDOC_URL=https://github.com/jgm/pandoc/releases/download/3.1.6.1/pandoc-3.1.6.1-linux-arm64.tar.gz

NODE_VERSION=16.14.0

if [ ! -d "/home/ec2-user/scripts" ]; then
  echo "The directory /home/ec2-user/scripts does not exist"
  exit 1
fi

echo "Making blot user..."

# if the user 'blot' does not exist, create it
if ! id -u blot > /dev/null 2>&1; then
  adduser --system --no-create-home blot
  groupadd blot_directory
  usermod -a -G blot_directory blot
fi

rm -rf $BLOT_DIRECTORY
mkdir -p $BLOT_DIRECTORY
chown -R root:root $BLOT_DIRECTORY

echo "Installing Blot..."



# install cron
yum install -y cronie
systemctl start crond
systemctl enable crond
chkconfig crond on

# packages required to get npm install working
yum install -y make 
yum install -y gcc
yum install -y gcc-c++

# for sharp and pngquant
yum install -y libpng
yum install -y libpng-devel

# for pupeteer
amazon-linux-extras install firefox


## Blot installation
##########################################################

cd $SETUP_DIRECTORY

# Install Pandoc
mkdir pandoc
wget $PANDOC_URL -O pandoc.tar.gz
tar -xvzf pandoc.tar.gz --strip-components 1 -C pandoc
cp pandoc/bin/pandoc /usr/bin
# make sure that the blot user can access pandoc
chown -R blot:blot_directory /usr/bin/pandoc

rm pandoc.tar.gz
rm -rf ./pandoc
# test that pandoc is installed otherwise exit
if ! command -v pandoc &> /dev/null
then
    echo "pandoc could not be found"
    exit
fi

cd $SETUP_DIRECTORY

# Install node
curl -o- $NVM_URL | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install $NODE_VERSION
node -e "console.log('Running Node.js ' + process.version)"
# test that node is installed otherwise exit
if ! command -v node &> /dev/null
then
    echo "node could not be found"
    exit
fi


# Install Blot
# Install git and ntp
# What is ntp required for?
yum -y install git ntp

# Blot's application uses gifsicle, which requires these build tools
# https://rmoff.net/2017/03/11/install-qemu-on-aws-ec2-amazon-linux/
# resolves /bin/sh: autoreconf: command not found
yum -y install autoconf autogen intltool libtool

# We use a shallow clone to reduce required disk space
git clone --depth 1 -b master --single-branch $BLOT_REPO $BLOT_DIRECTORY
cd $BLOT_DIRECTORY


# swith to the blot user
su blot

PUPPETEER_SKIP_DOWNLOAD=true npm install --also=dev --include=dev

echo "Creating directories..."

# Most of these are required by the Blot application process
# logs and db are required by Redis
# logs is required by NGINX
mkdir -p $BLOT_DIRECTORY/blogs
mkdir -p $BLOT_DIRECTORY/tmp
mkdir -p $BLOT_DIRECTORY/logs
mkdir -p $BLOT_DIRECTORY/static

echo "Running blot tests"

# Run the Blot tests
npm test

echo "Server set up successfully"

chown -R blot:blot_directory $BLOT_DIRECTORY
