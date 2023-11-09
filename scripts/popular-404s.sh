# the point of this script is to cat the logfile logs/app.log and return the most popular 404'd url paths

# each line looks like:
# [09/Nov/2023:08:23:08 +0000] a123ed61e973e85c13cf27a1f6244879 404 0.002 PID=9139 https://carmen.blot.im/wp-json/acf/v3/options/a?id=active&field=plugins
# we don't care about the host, just the path, so we'll use awk to get the 7th column and then extract the path with sed
# note that the protocol and host can changes so we'll use a regex to extract the path
cat logs/app.log | grep " 404 " | awk '{print $7}' | sed -E 's/https?:\/\/[^\/]+(.*)/\1/' | sort | uniq -c | sort -nr | head -n 10

# now we want to print the entire line for slow requests (where the reponse time after the status code and before the PID=) is greater than 1 second
cat logs/app.log  | grep " 200 " | awk '{if ($5 > 1) print $0}' | sort -nr -k 5 | head -n 100