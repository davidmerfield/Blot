#!/bin/sh

# This should only be run once, when the instance is launched
# It will only work when run as root

# the cron scripts are in the home directory of the user 'ec2-user'
# throw an error if they don't exist
if [ ! -d "/home/ec2-user/scripts" ]; then
  echo "The directory /home/ec2-user/scripts does not exist"
  exit 1
fi

# throw an error if the environment variable 'PRIVATE_IP' is not set
if [ -z "$PRIVATE_IP" ]; then
  echo "PRIVATE_IP variable missing, pass the private ip address of the redis instance as an argument to this script"
  exit 1
fi

# The following are recommendations for improving the performance
# of Redis on an AWS instance.
# TODO: fully research each line and document it. Ensure each change
# is persisted across reboot and hard stop/start
sysctl vm.overcommit_memory=1
bash -c "echo never > /sys/kernel/mm/transparent_hugepage/enabled"
dd if=/dev/zero of=/swapfile1 bs=1024 count=4194304

# install redis
dnf install -y redis6

# install redis systemd service
# start redis server
systemctl start redis6
systemctl enable redis6
chkconfig redis6 on

# edit the redis6 service and all the following:
# under [Service]:   'Restart=always'
mkdir -p /etc/systemd/system/redis6.service.d
echo "[Service]" > /etc/systemd/system/redis6.service.d/override.conf
echo "Restart=" >> /etc/systemd/system/redis6.service.d/override.conf
echo "Restart=always" >> /etc/systemd/system/redis6.service.d/override.conf

# before the redis server launches, run the bash script 
# located at /home/ec2-user/scripts/mount-instance-store.sh
echo "[Unit]" > /etc/systemd/system/redis6.service.d/override.conf
echo "Before=redis6.service" >> /etc/systemd/system/redis6.service.d/override.conf
echo "ExecStartPre=/home/ec2-user/scripts/mount-instance-store.sh" >> /etc/systemd/system/redis6.service.d/override.conf

systemctl daemon-reload

# update redis configuration so it listens on the private ip
# and accepts connections from the private ip. the configuration
# file is stored in /etc/redis6/redis6.conf
echo -e "config set bind $PRIVATE_IP\nconfig set protected-mode no\nconfig rewrite" | redis6-cli

systemctl restart redis6

# check that the redis server is listening on the private ip
# and accepting connections from the private ip. return an error if not
if [[ $(redis6-cli -h $PRIVATE_IP ping) != "PONG" ]]; then
  echo "Redis is not listening on $PRIVATE_IP"
  exit 1
fi

# install cron
yum install -y cronie
systemctl start crond
systemctl enable crond
chkconfig crond on

# install the backup scripts in cron
echo  '0 * * * * /home/ec2-user/scripts/hourly-backup.sh' | crontab -
echo  '0 0 * * * /home/ec2-user/scripts/daily-backup.sh' | crontab -

# run the script /home/ec2-user/scripts/mount-instance-store.sh
# to mount the instance store if it's not already
/home/ec2-user/scripts/mount-instance-store.sh


