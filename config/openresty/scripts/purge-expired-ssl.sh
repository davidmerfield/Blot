#!/bin/sh

# This script will reset the SSL certificate for the domain passed

# the log lines look like this:
# 2023/11/21 15:00:40 [error] 7264#7264: failed to set ocsp stapling for www.theuntitled.site - continuing anyway - failed to get ocsp response: failed to validate OCSP response (http://r3.o.lencr.org): OCSP response not successful (6: unauthorized), context: ssl_certificate_by_lua*, client: 66.249.66.132, server: 0.0.0.0:443
# extract the host from the line above
LOGLINE=$1
HOST=$(echo $LOGLINE | sed -E 's/.*failed to set ocsp stapling for ([^ ]+) .*/\1/')

SSL_CERT_DIR=/etc/resty-auto-ssl/letsencrypt/certs

set -e


if [ -z "$HOST" ]; then
  echo "Missing host argument"
  exit 1
fi

if [ -z "$BLOT_REDIS_HOST" ]; then
  echo "BLOT_REDIS_HOST variable missing, source it"
  exit 1
fi

KEY="ssl:$HOST:latest"

# ask the user to confirm the key to delete before deleting it
echo "About to delete $KEY from redis"
echo "Press enter to continue or ctrl+c to cancel"
read

redis-cli -h $BLOT_REDIS_HOST del $KEY

echo "Deleted $KEY from redis"

# DIRECTORY_TO_DELETE=$SSL_CERT_DIR/$HOST/

# # if the directory exists, remove its contents
# if [ -d "$DIRECTORY_TO_DELETE" ]; then

#     # ask the user to confirm the files to delete before deleting them
#     echo "About to delete the contents of $DIRECTORY_TO_DELETE"
#     sudo find $DIRECTORY_TO_DELETE -type f 

#     echo "Press enter to continue or ctrl+c to cancel"
#     read

#     sudo find $DIRECTORY_TO_DELETE -type f -exec rm {} \;

#     echo "Deleted the contents of $DIRECTORY_TO_DELETE"

#     # otherwise, echo "no directory to delete"
# else
#     echo "No directory to delete: $DIRECTORY_TO_DELETE"
# fi

# restart openresty
sudo systemctl restart openresty

echo "Restarted openresty"

echo "Checking cert on $HOST"

# making a request to the domain to reissue the certificate, get status code only
curl -s -o /dev/null -w "%{http_code}" https://$HOST
echo ""
echo "Done!"
