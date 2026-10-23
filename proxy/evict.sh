#!/bin/sh
#
# Keeps the disk cache (proxy/config/diskcache.lua) within its budget. Run
# hourly by worker 0 of every proxy container (diskcache:start_sweeper); the
# flock lets only one of the containers sharing the cache sweep at a time.
#
#   diskcache-evict <cache directory> <max bytes> [<max filesystem use %>]
#
# 1. Empties .trash, in case a purge's background removal died.
# 2. Deletes .tmp files untouched for an hour: fills a dead worker left.
# 3. Deletes bodies with no metadata, an hour old: a fill or eviction that
#    stopped half way.
# 4. If the cache is over <max bytes>, or the filesystem over <max use %>,
#    deletes whole entries (the .meta and every body of a key), least
#    recently read first, until it is 10% under the budget or 5 points under
#    the filesystem limit. "Recently read" is the .meta file's atime: every
#    hit reads it, and relatime updates it about once a day, which is enough
#    to tell a page read this week from one not read for months.
#
# Deleting an entry while a hit is serving it is safe: a hit that finds its
# body gone falls through to a fill.
#
# Needs GNU find (-printf), from the findutils package.

set -eu

DIR=$1
MAX_BYTES=$2
FS_MAX=${3:-90}

[ -d "$DIR" ] || exit 0

exec 9>"$DIR/.evict.lock"

if ! flock -n 9; then
  echo "evict: another sweep is running"
  exit 0
fi

started=$(date +%s)

if [ -d "$DIR/.trash" ]; then
  find "$DIR/.trash" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
fi

# <a>/<bc>/<host>/.tmp/<file>
find "$DIR" -mindepth 5 -maxdepth 5 -path '*/.tmp/*' -type f -mmin +60 -delete

# One line per key: "<atime of .meta or -> <newest mtime> <bytes> <path of key>",
# where a key's files are <key>.meta and <key>.<id>[.br|.gz]
keys=$(mktemp)
trap 'rm -f "$keys"' EXIT

find "$DIR" -mindepth 4 -maxdepth 4 -type f -printf '%A@ %T@ %s %h/%f\n' | awk '
  {
    path = $4
    slash = match(path, /[^\/]*$/)
    name = substr(path, slash)
    key = substr(path, 1, slash - 1) substr(name, 1, index(name ".", ".") - 1)
    bytes[key] += $3
    if ($2 > newest[key]) newest[key] = $2
    if (name ~ /\.meta$/) atime[key] = $1
  }
  END {
    for (key in bytes) {
      print (key in atime ? atime[key] : "-"), newest[key], bytes[key], key
    }
  }
' > "$keys"

# Deletes the keys read from stdin, the metadata first so no new hit finds
# a body that is about to go
delete_keys() {
  xargs -r sh -c 'for key; do rm -f -- "$key.meta" "$key".*; done' sh
}

victims=$(mktemp)
trap 'rm -f "$keys" "$victims"' EXIT

awk -v before="$((started - 3600))" '$1 == "-" && $2 < before { print $4 }' "$keys" > "$victims"
orphans=$(wc -l < "$victims")
delete_keys < "$victims"

total=$(awk '$1 != "-" { sum += $3 } END { printf "%.0f", sum }' "$keys")
entries=$(awk '$1 != "-"' "$keys" | wc -l)

# Bytes to free: down to 90% of the budget, and down to FS_MAX - 5 percent
# of the filesystem
need=$(awk -v total="$total" -v max="$MAX_BYTES" 'BEGIN { n = total - max * 0.9; printf "%.0f", (total > max && n > 0) ? n : 0 }')

set -- $(df -Pk "$DIR" | awk 'NR == 2 { print $2, $3 }')
fs_size=$(($1 * 1024))
fs_used=$(($2 * 1024))
fs_need=$(awk -v size="$fs_size" -v used="$fs_used" -v max="$FS_MAX" 'BEGIN { n = used - size * (max - 5) / 100; printf "%.0f", (used > size * max / 100 && n > 0) ? n : 0 }')

[ "$fs_need" -gt "$need" ] && need=$fs_need

evicted=0
freed=0

if [ "$need" -gt 0 ]; then
  awk '$1 != "-"' "$keys" | sort -n -k1,1 | awk -v need="$need" '
    freed >= need { exit }
    { freed += $3; print $4 }
  ' > "$victims"

  evicted=$(wc -l < "$victims")
  freed=$(awk 'NR == FNR { victim[$1] = 1; next } ($4 in victim) { sum += $3 } END { printf "%.0f", sum }' "$victims" "$keys")
  delete_keys < "$victims"
fi

echo "evict: entries=$entries bytes=$total orphans_deleted=$orphans evicted=$evicted freed=$freed seconds=$(($(date +%s) - started))"
