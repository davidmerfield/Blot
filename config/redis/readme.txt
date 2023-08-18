TODO:

mounting the backup disk does not work on reboot / shutdown / restart apparently








Move redis into its own instance?
deployment process for new server
1. write a script for the remote server
2. write a script to run here
3. write script to run on existing server which bgsaves, then duplicates dump.rdb so we can rsync to new server

  - since redis is currently on same server, we should have been communicating with unix sockets, not tcp
  - test if systemctl will auto reboot it by doing `kill -9 <pid>` if not, follow this guide:
    https://ma.ttias.be/auto-restart-crashed-service-systemd/
  - check old implementation for switching into read-only mode for redis
  - write new backup script for redis instance
    - make it run hourly
  - test backup procedure on this instance before we switch production to it
  - review best practices for ec2 instance:
    - https://redis.com/blog/5-tips-for-running-redis-over-aws/
    - https://stackoverflow.com/questions/11765502/best-ec2-setup-for-redis-server
      - I've confirmed the xgd2 instance is HVM by checking the AMI associated with it
  - document redis instance setup and config:
    ```sudo dnf install -y redis6
sudo systemctl start redis6
sudo systemctl enable redis6
sudo systemctl is-enabled redis6
redis6-server --version
redis6-cli ping
```
  then changed in redis.conf
    ```
    bind $EC2_PRIVATE_IP 127.0.0.1
    ```
    https://serverfault.com/a/1129059
  
  then modified the systemctl service using systemctl edit:
  https://askubuntu.com/questions/659267/how-do-i-override-or-configure-systemd-services

  Restart=always

  then I transfered the dump file, and moved it to wherever

  redis6-cli config get dir

  I then locked down outbound traffic

  - purchased reserved instance for 3-year convertible, no upfront

# look into transparent huge pages

does this help performance?

i also installed cron:





-------- Perform on Redis server

# stop redis, this takes a while
sudo systemctl stop redis6

# verify that redis is not running
redis6-cli ping

# delete the old dump file
sudo rm /var/lib/redis6/dump.rdb


-------- Perform on Blot server

redis-cli bgsave

# wait for the background save to complete
redis-cli lastsave


-------- Perform on Redis server

# copy the new dump file
sudo scp -v -i projects.pem ec2-user@54.191.179.131:/var/www/blot/db/dump.rdb /var/lib/redis6/dump.rdb

# start redis, takes a while
sudo systemctl start redis6


-------- Perform on Blot server

sudo stop blot

save edits to environment.sh

sudo start blot

edit nginx config

./scripts/production/reload_nginx_configuration.sh




{
  "MaxCount": 1,
  "MinCount": 1,
  "ImageId": "ami-xxx",
  "InstanceType": "x2gd.medium",
  "KeyName": "projects",
  "EbsOptimized": true,
  "NetworkInterfaces": [
    {
      "SubnetId": "subnet-xxx",
      "AssociatePublicIpAddress": true,
      "DeviceIndex": 0,
      "Groups": [
        "sg-xxx"
      ]
    }
  ],
  "TagSpecifications": [
    {
      "ResourceType": "instance",
      "Tags": [
        {
          "Key": "Name",
          "Value": "Staging redis"
        }
      ]
    }
  ],
  "PrivateDnsNameOptions": {
    "HostnameType": "ip-name",
    "EnableResourceNameDnsARecord": false,
    "EnableResourceNameDnsAAAARecord": false
  }
}