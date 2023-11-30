#!/bin/sh

USERNAME=$1
REDIS_CLI=$2

# if no arg passed to script, use redis6-cli otherwise use the arg
if [ -z "$REDIS_CLI" ]; then
  REDIS_CLI=redis6-cli
fi

# lookup blogID using handle:$USERNAME
BLOG_ID=( $($REDIS_CLI get "handle:$USERNAME") )

# map this into a cli command    redis.zrevrange(allKey, 0, -1, callback);
# allKey = 'blog:$BLOG_ID:all'

echo "BLOG_ID: $BLOG_ID"

# we just want newline seperated entry ids
# by default redis-cli returns something like this:
# 1) "/Hello.txt"
# 2) "/Hello, world!.txt"
ENTRY_IDS=$($REDIS_CLI zrevrange "blog:$BLOG_ID:all" 0 -1 | sed 's/\"//g')


# for each entry id, print the entry
# note that entry ids have spaces, they are seperated by a newline
IFS=$'\n'       # make newlines the only separator
for ENTRY_ID in $ENTRY_IDS
do
    ENTRY=$($REDIS_CLI get "blog:$BLOG_ID:entry:$ENTRY_ID")
    ENTRY_DATESTAMP=$(echo $ENTRY | jq .dateStamp)
    ENTRY_DATE=$(date -d @$(($ENTRY_DATESTAMP / 1000)) +%Y-%m-%d)
    ENTRY_URL=$(echo $ENTRY  | jq .url)
    ENTRY_DELETED=$(echo $ENTRY | jq .deleted)
    ENTRY_URL_WITHOUT_QUOTES=$(echo $ENTRY_URL | sed 's/\"//g')

    # if the entry is not deleted
    if [ "$ENTRY_DELETED" = "false" ]; then
        echo "$ENTRY_DATE $ENTRY_URL_WITHOUT_QUOTES"
    fi

    # echo "ENTRY_ID: $ENTRY_ID"
    # echo "ENTRY_DELETED: $ENTRY_DELETED"
    # echo "ENTRY_DATESTAMP: $ENTRY_DATESTAMP"
    # echo "ENTRY_DATE: $ENTRY_DATE"
    # echo "ENTRY_URL: $ENTRY_URL"
    # echo ""
done


