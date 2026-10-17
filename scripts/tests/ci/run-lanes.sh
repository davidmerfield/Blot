#!/usr/bin/env bash
# Runs one CI test job's lanes in parallel on this runner (see plan.js for how
# the lanes are chosen and .github/workflows/node.yml for the job).
#
# Each lane is a sequence of suite shards and gets everything a shard expects
# to have to itself: its own Docker network, Redis (the runner refuses to start
# against a non-empty database) and MinIO, its own copy of the working tree
# (some specs write into app/), and its own network namespace (the test
# servers listen on fixed ports). Shards in a lane run one after another, each
# in a fresh container against a flushed Redis, like separate CI jobs did.
#
# Env: LANES (JSON: [[{suite, exclude, shard}, ...], ...]), IMAGE_TAG, and the
# BLOT_STRIPE_* secrets. Writes coverage to ./.nyc_output and a timing table to
# $GITHUB_STEP_SUMMARY. Exits non-zero if any shard failed.
set -uo pipefail

REDIS_IMAGE="redis:6.2.12"
# Keep in step with .github/actions/start-minio and scripts/tests/invoke.sh
MINIO_IMAGE="alpine/minio:RELEASE.2025-10-15T17-29-55Z@sha256:cf23643a6cf9ce159c57643ceb88279e431262282428c9e0bf3a7ef1a97e84b4"
# A shard takes a few minutes. A spec that starves the event loop stops
# Jasmine's own timeout firing, so cap each shard rather than hold the runner.
SHARD_TIMEOUT="${SHARD_TIMEOUT:-12m}"
NYC_ARGS="--include=app/**/*.js --exclude=**/tests/** --exclude=**/tests.js --exclude=app/views-built/** --exclude=app/templates/source/**"

WORKSPACE="$(pwd)"
ROOT="${RUNNER_TEMP:-/tmp}/lanes"
LANE_COUNT=$(jq 'length' <<< "$LANES")

rm -rf "$ROOT"
mkdir -p "$ROOT" "$WORKSPACE/.nyc_output"

start_lane() {
  local lane=$1 dir="$ROOT/$1"
  mkdir -p "$dir/logs" "$dir/.nyc_output"
  cp -a "$WORKSPACE/app" "$WORKSPACE/scripts" "$WORKSPACE/config" "$WORKSPACE/proxy" "$dir/"
  docker network create "lane-$lane" > /dev/null
  docker run -d --name "lane-$lane-redis" --network "lane-$lane" "$REDIS_IMAGE" > /dev/null
  # The runner creates the bucket and waits for MinIO (scripts/tests/util/bucket.js)
  docker run -d --name "lane-$lane-minio" --network "lane-$lane" --user root \
    -e MINIO_ROOT_USER=blot-test -e MINIO_ROOT_PASSWORD=blot-test-secret \
    "$MINIO_IMAGE" server /data --address :9000 > /dev/null
  for i in $(seq 1 30); do
    docker exec "lane-$lane-redis" redis-cli ping > /dev/null 2>&1 && return 0
    sleep 1
  done
  echo "lane $lane: Redis did not start"
}

run_shard() {
  local lane=$1 n=$2 suite=$3 exclude=$4 shard=$5 dir="$ROOT/$1"
  local log="$dir/logs/$n.log" name="lane-$lane-test-$n" exclude_arg="" start status

  [ -n "$exclude" ] && exclude_arg="--exclude=$exclude"

  # Some suites leave keys behind; the next shard needs an empty database
  docker exec "lane-$lane-redis" redis-cli flushall > /dev/null

  start=$(date +%s)
  timeout "$SHARD_TIMEOUT" docker run --rm --name "$name" \
    --network "lane-$lane" \
    -e BLOT_REDIS_HOST="lane-$lane-redis" \
    -e BLOT_STORAGE_BUCKET=blot-test-storage \
    -e BLOT_STORAGE_ENDPOINT="http://lane-$lane-minio:9000" \
    -e BLOT_STORAGE_REGION=us-east-1 \
    -e BLOT_AWS_KEY=blot-test \
    -e BLOT_AWS_SECRET=blot-test-secret \
    -e BLOT_STRIPE_KEY -e BLOT_STRIPE_SECRET -e BLOT_STRIPE_PRODUCT \
    -v "$dir/app:/usr/src/app/app" \
    -v "$dir/scripts:/usr/src/app/scripts" \
    -v "$dir/config:/usr/src/app/config" \
    -v "$dir/proxy:/usr/src/app/proxy" \
    -v "$dir/.nyc_output:/usr/src/app/.nyc_output" \
    "$IMAGE_TAG" \
    sh -c "nyc --silent --no-clean $NYC_ARGS node scripts/tests '$suite' --shard='$shard' $exclude_arg" \
    > "$log" 2>&1
  status=$?
  if [ "$status" = 124 ]; then
    echo "Timed out after $SHARD_TIMEOUT" >> "$log"
    docker rm -f "$name" > /dev/null 2>&1
  fi

  printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$n" "$suite" "$exclude" "$shard" "$status" "$(( $(date +%s) - start ))" \
    >> "$dir/results.tsv"
  echo "lane $lane: $suite $shard $([ "$status" = 0 ] && echo passed || echo "FAILED ($status)") in $(( $(date +%s) - start ))s"
}

run_lane() {
  local lane=$1 n=0
  while IFS=$'\t' read -r suite exclude shard; do
    n=$((n + 1))
    run_shard "$lane" "$n" "$suite" "$exclude" "$shard"
  done < <(jq -r ".[$lane] | .[] | [.suite, .exclude, .shard] | @tsv" <<< "$LANES")
}

# Set up every lane before starting any, so the copies and container starts
# don't compete with running specs.
for lane in $(seq 0 $((LANE_COUNT - 1))); do start_lane "$lane" & done
wait

pids=()
for lane in $(seq 0 $((LANE_COUNT - 1))); do
  run_lane "$lane" &
  pids+=($!)
done
for pid in "${pids[@]}"; do wait "$pid"; done

failed=0
{
  echo "| Lane | Suite | Shard | Result | Seconds |"
  echo "|---|---|---|---|---|"
} >> "${GITHUB_STEP_SUMMARY:-/dev/null}"

for lane in $(seq 0 $((LANE_COUNT - 1))); do
  dir="$ROOT/$lane"
  cp -a "$dir/.nyc_output/." "$WORKSPACE/.nyc_output/" 2>/dev/null || true
  while IFS=$'\t' read -r n suite exclude shard status seconds; do
    label="$suite${exclude:+ (excluding $exclude)} $shard"
    if [ "$status" = 0 ]; then
      echo "::group::✓ $label (${seconds}s)"
      cat "$dir/logs/$n.log"
      echo "::endgroup::"
      result=passed
    else
      failed=1
      result="**failed**"
      echo "::error::$label failed (exit $status)"
      echo "──────── $label failed (exit $status), lane $((lane + 1)) ────────"
      cat "$dir/logs/$n.log"
    fi
    echo "| $((lane + 1)) | $suite${exclude:+ (excl. $exclude)} | $shard | $result | $seconds |" \
      >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
  done < "$dir/results.tsv"
done

for lane in $(seq 0 $((LANE_COUNT - 1))); do
  docker rm -f "lane-$lane-redis" "lane-$lane-minio" > /dev/null 2>&1
  docker network rm "lane-$lane" > /dev/null 2>&1
done

exit $failed
