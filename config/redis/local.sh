scp -i ~/projects.pem remote.sh ec2-user@{{redis_host}}:/var/remote.sh

# scp the scripts
scp -i ~/projects.pem backup.sh ec2-user@{{redis_host}}:/var/backup.sh

# scp the redis config
scp -i ~/projects.pem redis.conf ec2-user@{{redis_host}}:/var/redis.conf
