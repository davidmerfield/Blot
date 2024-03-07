# the point of this script is to cat the logfile logs/app.log and return the most popular 404'd url paths

# error if the BLOT_LOG_DIRECTORY variable is not set
if [ -z "$BLOT_LOG_DIRECTORY" ]; then
  echo "BLOT_LOG_DIRECTORY variable missing, source it"
  exit 1
fi


# POPULAR 404s
# each line looks like:
# [09/Nov/2023:08:23:08 +0000] a123ed61e973e85c13cf27a1f6244879 404 0.002 PID=9139 https://carmen.blot.im/wp-json/acf/v3/options/a?id=active&field=plugins
# we don't care about the host, just the path, so we'll use awk to get the 7th column and then extract the path with sed
# note that the protocol and host can changes so we'll use a regex to extract the path
cat $BLOT_LOG_DIRECTORY/app.log | grep " 404 " | awk '{print $7}' | sed -E 's/https?:\/\/[^\/]+(.*)/\1/' | sort | uniq -c | sort -nr | head -n 10

# SLOW REQUESTS
# now we want to print the entire line for slow requests (where the reponse time after the status code and before the PID=) is greater than 1 second
cat $BLOT_LOG_DIRECTORY/app.log  | grep " 200 " | awk '{if ($5 > 1) print $0}' | sort -nr -k 5 | head -n 100

# UNRESPONDED REQUESTS
# every 5 seconds the server logs a line like this:
# [09/Nov/2023:09:49:07 +0000] PID=21724 PENDING=5 9c7a155b, 64c5a9e8, d8bef2e9, 22661972, ce896590
# we want to grep app.log for every request in the comma separated list
cat $BLOT_LOG_DIRECTORY/app.log | grep " PENDING=" | tail -n 2 | cut -d' ' -f 7- | sed -E 's/, /\n/g' | xargs -I{} sh -c "grep {} $BLOT_LOG_DIRECTORY/app.log | head -n 1"

# most popular status codes
cat $BLOT_LOG_DIRECTORY/access.log | awk '{print $4}' |  sort | uniq -c | sort -nr

# renewal errors
cat $BLOT_LOG_DIRECTORY/error.log | grep "ocsp stapling" | sed -E 's/.*ssl_certificate.lua:260: set_response_cert\(\): auto-ssl: failed to set ocsp stapling for ([^ ]+) .*/\1/' | sort | uniq | tr '\n' ' '

# check that we are not issuing too many certificates
find /etc/resty-auto-ssl/letsencrypt/certs/*blot.im

# free space
cat $BLOT_LOG_DIRECTORY/error.log | grep "free_space" |  cut -d' ' -f 1,2,9 | tr -d ',' | sort -u -t ' ' -k 3,3 | sort

# list all the duplicate cache files for the index page of the blog
HOST=www.theuntitled.site cat /$BLOT_LOG_DIRECTORY/error.log | grep "rehydrate" | grep -e "https://$HOST.com:443/," -e "https://$HOST.com:443/ "