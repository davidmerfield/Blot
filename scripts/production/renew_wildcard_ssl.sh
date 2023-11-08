#!/bin/sh
set -e

ACME=/usr/local/bin/acme-nginx
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

HASH_OF_KEY_BEFORE=$(cat /etc/ssl/private/letsencrypt-domain.key | openssl md5 | cut -d' ' -f2)
HASH_OF_PEM_BEFORE=$(cat /etc/ssl/private/letsencrypt-domain.pem | openssl md5 | cut -d' ' -f2)

echo "[`date -u +%Y-%m-%dT%T.%3NZ`] Key and pem hashes before renewal: $HASH_OF_KEY_BEFORE $HASH_OF_PEM_BEFORE"

echo "[`date -u +%Y-%m-%dT%T.%3NZ`] Beginning renewal of wildcard certificate" 
$ACME --debug --no-reload-nginx --dns-provider route53 -d "*.$BLOT_HOST" -d "$BLOT_HOST" 
echo "[`date -u +%Y-%m-%dT%T.%3NZ`] Finished renewal of wildcard certificate" 

HASH_OF_KEY_AFTER=$(cat /etc/ssl/private/letsencrypt-domain.key | openssl md5 | cut -d' ' -f2)
HASH_OF_PEM_AFTER=$(cat /etc/ssl/private/letsencrypt-domain.pem | openssl md5 | cut -d' ' -f2)

echo "[`date -u +%Y-%m-%dT%T.%3NZ`] Key and pem hashes after renewal: $HASH_OF_KEY_AFTER $HASH_OF_PEM_AFTER"

# We need to store the key and pem in redis so that the openresty reload script can fetch them
echo "[`date -u +%Y-%m-%dT%T.%3NZ`] Beginning storage of key and pem in redis"

# store the contents of /tmp/letsencrypt-domain.key in redis at the key 'blot:openresty:ssl:key'
# use redis-cli
cat /etc/ssl/private/letsencrypt-domain.key | redis-cli -h $BLOT_REDIS_HOST -x set 'blot:openresty:ssl:key'
cat /etc/ssl/private/letsencrypt-domain.pem | redis-cli -h $BLOT_REDIS_HOST -x set 'blot:openresty:ssl:pem'

redis-cli -h $BLOT_REDIS_HOST set 'blot:openresty:ssl:updated' $(date -u +%s)

