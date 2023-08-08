# This should only be run once, when the instance is launched

# The following are recommendations for improving the performance
# of Redis on an AWS instance.
# TODO: fully research each line and document it. Ensure each change
# is persisted across reboot and hard stop/start
sysctl vm.overcommit_memory=1
bash -c "echo never > /sys/kernel/mm/transparent_hugepage/enabled"
dd if=/dev/zero of=/swapfile1 bs=1024 count=4194304

# install redis
dnf install -y redis6

# connect to other instance using projects.pem keys and fetch dump.rdb
scp -i projects.pem ec2-user@{{redis_host}}:/var/lib/redis/dump.rdb .

# install redis systemd service
# start redis server
systemctl start redis6
systemctl enable redis6

# install the backup.sh script in cron
echo  '0 3 * * * /backup.sh' | crontab -
