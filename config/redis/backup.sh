
# Backs up redis to S3


# can we copy the dump to the 118gb disk?
# we can do this with fewer resources using rsync?
# https://unix.stackexchange.com/questions/117680/make-disk-disk-copy-slower

redis-cli bgsave

# wait for the background save to complete
while [ "$(redis-cli lastsave)" -lt "$(date +%s)" ]; do
  sleep 1
done

# copy the dump file to S3 and give it a name starting with today's date
aws s3 cp /var/lib/redis/dump.rdb s3://{{redis_backup_bucket}}/$(date +%Y-%m-%d).rdb

# remove all but the last 7 backups
aws s3 ls s3://{{redis_backup_bucket}}/ | awk '{print $4}' | sort -r | tail -n +8 | xargs -I {} aws s3 rm s3://{{redis_backup_bucket}}/{}

# remove the dump file
rm /var/lib/redis/dump.rdb



