#!/bin/sh

# This script will save redis stats in the db
# it should be run every minute

# 1. gather disk stats

# root disk is the disk mounted at /
ROOT_DISK_STATS=$(df / | tail -1)
ROOT_DISK_USED=$(echo $ROOT_DISK_STATS | awk '{print $3}')
ROOT_DISK_FREE=$(echo $ROOT_DISK_STATS | awk '{print $4}')

# backup disk is the disk mounted at /backups
BACKUP_DISK_STATS=$(df /backups | tail -1)
BACKUP_DISK_USED=$(echo $BACKUP_DISK_STATS | awk '{print $3}')
BACKUP_DISK_FREE=$(echo $BACKUP_DISK_STATS | awk '{print $4}')

# gather cpu stats
CPU_LOAD=$(awk '{u=$2+$4; t=$2+$4+$5; if (NR==1){u1=u; t1=t;} else print ($2+$4-u1) * 100 / (t-t1) "%"; }' <(grep 'cpu ' /proc/stat) <(sleep 1;grep 'cpu ' /proc/stat))

# gather redis stats
SYSTEM_MEMORY=$(redis6-cli info | grep "total_system_memory:" | awk -F: '{print $2}' | sed 's/\r//g')
PEAK_MEMORY=$(redis6-cli info | grep "used_memory_peak:" | awk -F: '{print $2}' | sed 's/\r//g')
USED_MEMORY=$(redis6-cli info | grep "used_memory:" | awk -F: '{print $2}' | sed 's/\r//g')
CONNECTED_CLIENTS=$(redis6-cli info | grep "connected_clients" | awk -F: '{print $2}' | sed 's/\r//g')


STATS="{\"root_disk_used\": \"$ROOT_DISK_USED\", \"root_disk_free\": \"$ROOT_DISK_FREE\", \"backup_disk_used\": \"$BACKUP_DISK_USED\", \"backup_disk_free\": \"$BACKUP_DISK_FREE\", \"cpu_load\": \"$CPU_LOAD\", \"system_memory\": \"$SYSTEM_MEMORY\", \"peak_memory\": \"$PEAK_MEMORY\", \"used_memory\": \"$USED_MEMORY\", \"connected_clients\": \"$CONNECTED_CLIENTS\", \"timestamp\": \"$(date +%s)\"}"

# add to list and trim so we only keep the last 2 hours of data - the node server will fetch and process this list
redis6-cli lpush blot:stats "$STATS"
redis6-cli ltrim blot:stats 0 119
