#!/bin/sh

# This should only be run once, when the instance is launched
# It will only work when run as root

SETUP_DIRECTORY="/home/ec2-user/setup"
PANDOC_URL=https://github.com/jgm/pandoc/releases/download/3.1.1/pandoc-3.1.1-linux-arm64.tar.gz


if [ ! -d "/home/ec2-user/scripts" ]; then
  echo "The directory /home/ec2-user/scripts does not exist"
  exit 1
fi

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


# Install Blot
# Install git and ntp
# What is ntp required for?
yum -y install git ntp

# Blot's application uses gifsicle, which requires these build tools
# https://rmoff.net/2017/03/11/install-qemu-on-aws-ec2-amazon-linux/
# resolves /bin/sh: autoreconf: command not found
yum -y install autoconf autogen intltool libtool

## Pandoc installation
##########################################################

cd $SETUP_DIRECTORY

# Install Pandoc only if the binary is not already installed
if ! command -v pandoc &> /dev/null
then
  mkdir pandoc
  wget $PANDOC_URL -O pandoc.tar.gz
  tar -xvzf pandoc.tar.gz --strip-components 1 -C pandoc
  cp pandoc/bin/pandoc /usr/bin
  rm pandoc.tar.gz
  rm -rf ./pandoc
fi

# print the pandoc version or exit if pandoc is not installed
if ! command -v pandoc &> /dev/null
then
  echo "pandoc could not be found"
  exit 1
fi

pandoc --version

echo "preparing blot directory..."

rm -rf $BLOT_DIRECTORY
mkdir -p $BLOT_DIRECTORY
chown -R ec2-user:ec2-user $BLOT_DIRECTORY


# Create a systemd service for the blot application using the file ./node.service
cp $SETUP_DIRECTORY/node.service /etc/systemd/system/node.service
systemctl daemon-reload

# list systemd services
systemctl list-unit-files --type=service


# change default font
git clone https://github.com/sahibjotsaggu/San-Francisco-Pro-Fonts.git
mkdir -p /usr/share/fonts/sanfrancisco
cp -r San-Francisco-Pro-Fonts/* /usr/share/fonts/sanfrancisco
fc-cache -f -v
mkdir -p ~/.config/fontconfig

# install the following to fonts.conf
# <?xml version='1.0'?>
# <!DOCTYPE fontconfig SYSTEM 'fonts.dtd'>
# <fontconfig>
# <alias>
#     <family>sans-serif</family>
#     <prefer><family>SF Pro Text</family></prefer>
#   </alias>
# </fontconfig>
echo "<?xml version='1.0'?>
<!DOCTYPE fontconfig SYSTEM 'fonts.dtd'>
<fontconfig>
<alias>
    <family>sans-serif</family>
    <prefer><family>SF Pro Text</family></prefer>
  </alias>
</fontconfig>" > ~/.config/fontconfig/fonts.conf

# check that the alias is working
fc-match sans-serif




echo "Installing Blot..."


#  add the following to '.bashrc'

# export PS1='[BLOT:\u] \W > '

# cd /var/www/blot

# . /etc/blot/environment.sh


# alias access="node /var/www/blot/scripts/access"
# alias info="node /var/www/blot/scripts/info"
# alias deploy="cd /var/www/blot && git pull origin master && /var/www/blot/scripts/reload-server.sh"
# alias restart="cd /var/www/blot && git pull origin master && sudo systemctl stop node && sudo systemctl start node"

