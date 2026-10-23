#!/usr/bin/env bash
# Benchmark the two blog cache implementations (nginx proxy_cache vs the
# PROXY_DISK_CACHE prototype) against a stub upstream. See README.md.
#
#   bash proxy/bench/run.sh                 # build both images, run, write results.md
#   SKIP_BUILD=1 bash proxy/bench/run.sh    # reuse blot-proxy:bench-* images
#   DURATION=30s CONNS=64 THREADS=4 bash proxy/bench/run.sh
set -euo pipefail

cd "$(dirname "$0")/../.."   # repo root, so the build paths below work from anywhere
ROOT=$(pwd)
BENCH="$ROOT/proxy/bench"

DURATION=${DURATION:-20s}
CONNS=${CONNS:-64}
THREADS=${THREADS:-4}
SKIP_BUILD=${SKIP_BUILD:-0}
WRK_IMAGE=blot-bench-wrk:alpine3.20

# The proxy gets 2 CPUs, or all of them if Docker has fewer (it refuses more)
NCPU=$(docker info --format '{{.NCPU}}')
CPUS=${PROXY_CPUS:-2}
if [ "$CPUS" -gt "$NCPU" ]; then CPUS=$NCPU; fi

NET=blot-bench-net
REDIS=blot-bench-redis
STUB=blot-bench-stub
PROXY=blot-bench-proxy
WRK=blot-bench-wrk
WORK=$(mktemp -d)
RESULTS="$WORK/results.tsv"
: > "$RESULTS"

cleanup() {
  docker rm -f "$PROXY" "$WRK" "$STUB" "$REDIS" >/dev/null 2>&1 || true
  docker network rm "$NET" >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT
cleanup >/dev/null 2>&1 || true
WORK=$(mktemp -d); RESULTS="$WORK/results.tsv"; : > "$RESULTS"

# ---- images ---------------------------------------------------------------

# Render the config, drop the per-host rate limit from the GENERATED copy only
# (hostlimit is per Host header whatever the client IP, so the whitelist below
# does not exempt it; and burst=30 means at most 30 requests in the same
# millisecond, which a single blog.test would exceed at ~30k req/s, so raising
# the rate is not enough), then bake the image. proxy/config is not touched.
build_image() { # tag
  bash proxy/build/build.sh --skip-confirmation >/dev/null
  sed -i.bak '/limit_req zone=hostlimit burst=30;/d' proxy/build/data/latest/openresty.conf
  rm -f proxy/build/data/latest/openresty.conf.bak
  if grep -q 'limit_req zone=hostlimit burst=30;' proxy/build/data/latest/openresty.conf; then echo "hostlimit still present" >&2; exit 1; fi
  docker build -q -f proxy/Dockerfile -t "$1" proxy/ >/dev/null
}

if [ "$SKIP_BUILD" != 1 ]; then
  echo "== building proxy images"
  FETCH_CDN_IPS=false BLOT_HOST=example.com build_image blot-proxy:bench-proxycache
  PROXY_DISK_CACHE=true FETCH_CDN_IPS=false BLOT_HOST=example.com build_image blot-proxy:bench-diskcache
fi

# wrk and curl in one small image, built once and pinned to an Alpine release
if ! docker image inspect "$WRK_IMAGE" >/dev/null 2>&1; then
  printf 'FROM alpine:3.20\nRUN apk add --no-cache wrk curl\n' | docker build -q -t "$WRK_IMAGE" - >/dev/null
fi

# ---- shared services ------------------------------------------------------

docker network create "$NET" >/dev/null

# Blog requests are rate limited per client IP unless the IP is in the
# whitelist geo (cdn-ips.conf); whitelist every private range so wrk is exempt
cat > "$WORK/cdn-ips.conf" <<'WL'
10.0.0.0/8 1;
172.16.0.0/12 1;
192.168.0.0/16 1;
WL

docker run -d --name "$REDIS" --network "$NET" redis:7-alpine >/dev/null
docker run -d --name "$STUB" --network "$NET" -v "$BENCH/stub.js:/stub.js:ro" node:20-alpine node /stub.js >/dev/null
docker run -d --name "$WRK" --network "$NET" "$WRK_IMAGE" sleep infinity >/dev/null
sleep 2
docker logs "$STUB" 2>&1 | head -2

# ---- helpers --------------------------------------------------------------

# usage_usec of a container's cgroup (CPU time of every process inside it)
cpu_usec() { docker exec "$1" cat /sys/fs/cgroup/cpu.stat | awk '$1=="usage_usec"{print $2}'; }

# Headers of one request from the wrk container: "<Blot-Cache> <Content-Encoding>"
probe() { # path accept-encoding
  local args=(-s -o /dev/null -D - -H "Host: blog.test")
  [ -n "$2" ] && args+=(-H "Accept-Encoding: $2")
  docker exec "$WRK" curl "${args[@]}" "http://$PROXY$1" | tr -d '\r' | awk '
    tolower($1)=="blot-cache:"{c=$2} tolower($1)=="content-encoding:"{e=$2}
    END{print (c==""?"-":c), (e==""?"identity":e)}'
}

# Wait until "<path>" is served as a HIT with the given encoding
wait_for() { # path accept-encoding want-encoding seconds
  local i
  for ((i = 0; i < $4; i++)); do
    [ "$(probe "$1" "$2")" = "HIT $3" ] && return 0
    sleep 1
  done
  echo "timed out waiting for $1 ($2) to be HIT $3, last: $(probe "$1" "$2")" >&2
  return 1
}

# wrk output -> tab separated: rps p50_ms p99_ms transfer non2xx requests
parse_wrk() {
  awk '
    function ms(v,  n) { n = v + 0; if (v ~ /us$/) return n / 1000; if (v ~ /ms$/) return n; if (v ~ /s$/) return n * 1000; return n }
    /^ +50%/ { p50 = ms($2) }
    /^ +99%/ { p99 = ms($2) }
    /requests in/ { reqs = $1 }
    /Requests\/sec:/ { rps = $2 }
    /Transfer\/sec:/ { xfer = $2 }
    /Non-2xx/ { bad = $NF }
    /Socket errors/ { err = $0 }
    END { printf "%s\t%.2f\t%.2f\t%s\t%d\t%d\t%s\n", rps, p50, p99, xfer, bad, reqs, err }'
}

CASES=(
  "page br+gzip|/page|gzip, deflate, br|br"
  "page gzip|/page|gzip|gzip"
  "page identity|/page||identity"
  "large br+gzip|/large|gzip, deflate, br|br"
  "image br+gzip|/image.jpg|gzip, deflate, br|identity"
)

# ---- one run per implementation -------------------------------------------

bench() { # impl image
  local impl=$1 image=$2
  echo "== $impl ($image)"
  docker rm -f "$PROXY" >/dev/null 2>&1 || true
  docker run -d --name "$PROXY" --network "$NET" --cpus="$CPUS" --cap-add SYS_NICE \
    -v "$WORK/cdn-ips.conf:/etc/openresty/cdn-ips.default.conf:ro" \
    -e BLOT_HOST=example.com -e PROXY_UPSTREAM_YELLOW="$STUB:8090" -e PROXY_UPSTREAM_BLUE="$STUB:8090" \
    -e PROXY_UPSTREAM_GREEN="$STUB:8090" -e PROXY_REDIS_HOST="$REDIS" -e PROXY_RESOLVER=127.0.0.11 \
    -e PROXY_FETCH_CDN_IPS=false "$image" >/dev/null

  local i
  for ((i = 0; i < 60; i++)); do
    docker exec "$WRK" curl -sf -o /dev/null "http://$PROXY/health" && break
    sleep 1
  done

  # Warm every URL (the first request fills the cache), then for the disk
  # cache wait for the background .br/.gz copies
  local c
  for c in "${CASES[@]}"; do
    IFS='|' read -r name path ae want <<<"$c"
    probe "$path" "$ae" >/dev/null
  done
  sleep 1
  if [ "$impl" = diskcache ]; then
    wait_for /page "gzip, deflate, br" br 60
    wait_for /page "gzip" gzip 60
    wait_for /large "gzip, deflate, br" br 90
    wait_for /large "gzip" gzip 90
  fi
  # One more pass so nginx's own cache has the compressed path warm too
  for c in "${CASES[@]}"; do
    IFS='|' read -r name path ae want <<<"$c"
    probe "$path" "$ae" >/dev/null
  done

  local secs=${DURATION%s}
  for c in "${CASES[@]}"; do
    IFS='|' read -r name path ae want <<<"$c"
    local check; check=$(probe "$path" "$ae")
    local hdr=(-H "Host: blog.test"); [ -n "$ae" ] && hdr+=(-H "Accept-Encoding: $ae")

    local p0 w0 p1 w1
    p0=$(cpu_usec "$PROXY"); w0=$(cpu_usec "$WRK")
    local out
    out=$(docker exec "$WRK" wrk -t"$THREADS" -c"$CONNS" -d"$DURATION" --latency "${hdr[@]}" "http://$PROXY$path")
    p1=$(cpu_usec "$PROXY"); w1=$(cpu_usec "$WRK")

    local parsed; parsed=$(printf '%s\n' "$out" | parse_wrk)
    local reqs; reqs=$(printf '%s' "$parsed" | cut -f6)
    local cpu_req; cpu_req=$(awk -v d=$((p1 - p0)) -v n="$reqs" 'BEGIN{printf "%.1f", n ? d / n : 0}')
    local proxy_cores; proxy_cores=$(awk -v d=$((p1 - p0)) -v s="$secs" 'BEGIN{printf "%.2f", d / (s * 1e6)}')
    local wrk_cores; wrk_cores=$(awk -v d=$((w1 - w0)) -v s="$secs" 'BEGIN{printf "%.2f", d / (s * 1e6)}')
    local want_check="HIT $want"
    local flag=ok; [ "$check" = "$want_check" ] || flag="UNEXPECTED($check)"
    printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$impl" "$name" "$parsed" "$cpu_req" "$proxy_cores" "$wrk_cores" >> "$RESULTS"
    printf '%s\t%s\n' "$name" "$flag" >> "$WORK/checks-$impl.tsv"
    echo "   $name: $check, $(printf '%s' "$parsed" | cut -f1) req/s, ${cpu_req} us/req, proxy ${proxy_cores} cores, wrk ${wrk_cores} cores"
  done

  docker logs "$PROXY" 2>&1 | grep -E '\[(error|crit|alert)\]' > "$WORK/errors-$impl.txt" || true
  echo "   proxy error/crit/alert log lines: $(wc -l < "$WORK/errors-$impl.txt" | tr -d ' ')"
}

bench proxycache blot-proxy:bench-proxycache
bench diskcache blot-proxy:bench-diskcache

# ---- report ---------------------------------------------------------------

{
  echo "# Proxy cache benchmark results"
  echo
  echo "Run: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo
  echo "Machine: $(docker info --format 'Docker {{.ServerVersion}}, {{.NCPU}} CPUs, {{.MemTotal}} bytes memory, {{.OperatingSystem}}, {{.Architecture}}') ; host $(uname -sm), $(sysctl -n hw.ncpu 2>/dev/null || nproc) logical CPUs"
  echo
  echo "wrk: \`-t$THREADS -c$CONNS -d$DURATION --latency\`, from a separate container on the same network. Proxy limited to \`--cpus=$CPUS\`. Stub upstream and Redis idle during the runs (all requests are cache hits)."
  echo
  node "$BENCH/table.js" "$RESULTS" "$WORK"
} | tee "$BENCH/results.md"
