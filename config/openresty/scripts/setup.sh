#!/bin/sh

# exit the script if any statement returns a non-true return value
set -e

# print the commands issued
set -x

yum -y update

yum -y install yum-utils

amazon-linux-extras install redis6

yum-config-manager --add-repo https://openresty.org/package/amazon/openresty.repo

# move our custom openresty.repo file to /etc/yum.repos.d/openresty.repo
# cp /home/ec2-user/scripts/openresty.repo /etc/yum.repos.d/openresty.repo
# make sure yum reloads new repos

yum -y install openresty

# copy the file /home/ec2-user/scripts/openresty.service to /etc/systemd/system/openresty.service
# cp /home/ec2-user/scripts/openresty.service /etc/systemd/system/openresty.service

# copy the file /home/ec2-user/scripts/mount-instance-store.service to /etc/systemd/system/mount-instance-store.service
cp /home/ec2-user/scripts/mount-instance-store.service /etc/systemd/system/mount-instance-store.service

# reload systemd
systemctl daemon-reload

# start and enable the mount-instance-store service
systemctl start mount-instance-store
systemctl enable mount-instance-store

yum -y install make
yum -y install gcc

wget http://luarocks.org/releases/luarocks-2.0.13.tar.gz
tar -xzvf luarocks-2.0.13.tar.gz
cd luarocks-2.0.13/
./configure --prefix=/usr/local/openresty/luajit \
    --with-lua=/usr/local/openresty/luajit/ \
    --lua-suffix=jit \
    --with-lua-include=/usr/local/openresty/luajit/include/luajit-2.1
make
make install

/usr/local/openresty/luajit/bin/luarocks install lua-resty-auto-ssl
mkdir -p /etc/resty-auto-ssl
chown ec2-user /etc/resty-auto-ssl

mv /usr/local/openresty/nginx/conf/nginx.conf /usr/local/openresty/nginx/conf/nginx.conf.bak

# point nginx.conf to the openresty.conf file
echo "include /home/ec2-user/openresty/openresty.conf;" >> /usr/local/openresty/nginx/conf/nginx.conf

# write the SSL keys required for openresty to start
mkdir -p /etc/ssl/private
redis-cli -h $REDIS_IP get 'blot:openresty:ssl:key' > /etc/ssl/private/letsencrypt-domain.key
redis-cli -h $REDIS_IP get 'blot:openresty:ssl:pem' > /etc/ssl/private/letsencrypt-domain.pem

# install cron
yum install -y cronie
systemctl start crond
systemctl enable crond
chkconfig crond on

# every day at 1am, run the script to reload the wildcard certificate
echo  "0 0 1 * * REDIS_IP=$REDIS_IP ./home/ec2-user/scripts/reload-wildcard-cert.sh" | crontab -

# Start openresty and enable it to start on boot
systemctl start openresty
systemctl enable openresty
