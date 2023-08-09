
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

