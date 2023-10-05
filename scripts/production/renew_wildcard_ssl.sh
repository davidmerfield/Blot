#!/bin/sh
set -e

ACME=/usr/local/bin/acme-nginx
LOGFILE=/var/log/letsencrypt.log
OPENRESTY=/usr/local/openresty/bin/openresty

# Sources the environment variables required
. /etc/blot/environment.sh

if [ -z "$BLOT_HOST" ]; then
  echo "BLOT_HOST variable missing, pass the hostname of the blot instance as an argument to this script"
  exit 1
fi

if [ -z "$BLOT_REDIS_HOST" ]; then
  echo "BLOT_REDIS_HOST variable missing, pass the hostname of the redis instance as an argument to this script"
  exit 1
fi

echo "[`date -u +%Y-%m-%dT%T.%3NZ`] Beginning renewal of wildcard certificate" 
$ACME --no-reload-nginx --dns-provider route53 -d "*.$BLOT_HOST" -d "$BLOT_HOST" 
echo "[`date -u +%Y-%m-%dT%T.%3NZ`] Finished renewal of wildcard certificate" 

# We need to store the key and pem in redis so that the openresty
# reload script can fetch them
echo "[`date -u +%Y-%m-%dT%T.%3NZ`] Beginning storage of key and pem in redis"
cp /etc/ssl/private/letsencrypt-domain.key /tmp/letsencrypt-domain.key
cp /etc/ssl/private/letsencrypt-domain.pem /tmp/letsencrypt-domain.pem

# store the contents of /tmp/letsencrypt-domain.key in redis at the key 'blot:openresty:ssl:key'
# use redis-cli
cat /tmp/letsencrypt-domain.key | redis-cli -h $BLOT_REDIS_HOST set 'blot:openresty:ssl:key'
cat /tmp/letsencrypt-domain.pem | redis-cli -h $BLOT_REDIS_HOST set 'blot:openresty:ssl:pem'

# clean up the temporary files
rm /tmp/letsencrypt-domain.key
rm /tmp/letsencrypt-domain.pem

redis-cli -h $BLOT_REDIS_HOST set 'blot:openresty:ssl:updated' $(date -u +%s)

