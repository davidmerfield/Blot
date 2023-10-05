#!/bin/sh

# This script uses redis to fetch the key and pem for the wildcard certificate and store them at
# /etc/ssl/private/letsencrypt-domain.key and /etc/ssl/private/letsencrypt-domain.pem
# the key is stored in 'blot:openresty:ssl:key' and the pem is stored in 'blot:openresty:ssl:pem'

set -e

if [ -z "$REDIS_IP" ]; then
  echo "REDIS_IP variable missing, pass the private ip address of the redis instance as an argument to this script"
  exit 1
fi

redis-cli -h $REDIS_IP get 'blot:openresty:ssl:key' > /etc/ssl/private/letsencrypt-domain.key
redis-cli -h $REDIS_IP get 'blot:openresty:ssl:pem' > /etc/ssl/private/letsencrypt-domain.pem

# restart openresty
systemctl restart openresty

echo "Restarted openresty"
