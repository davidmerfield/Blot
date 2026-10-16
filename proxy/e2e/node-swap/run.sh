#!/usr/bin/env bash
# Rolling-redeploy e2e: does swapping the Node containers one by one drop
# requests? Run from the repo root on a Linux host with docker.
set -u
D=proxy/e2e/node-swap
PROXY_IMAGE="${PROXY_IMAGE:-blot-proxy:ns}"
export HOSTIP=$(hostname -I | awk '{print $1}')

bash $D/swap.sh start || exit 1
docker run -d --name ns-proxy --network host --cap-add SYS_NICE \
  -e BLOT_HOST=localhost "$PROXY_IMAGE" >/dev/null
for i in $(seq 1 30); do
  [ "$(docker inspect -f '{{.State.Health.Status}}' ns-proxy)" = healthy ] && break
  sleep 2
done

echo "== phase 1: baseline, no deploy =="
if ! DURATION=10 OUT=baseline.json node $D/load.js; then
  echo "BASELINE FAILED: the harness itself is broken (rate limits or routing), not the deploy"
  exit 1
fi

echo "== phase 2: load during rolling swap =="
DURATION=60 OUT=swap.json node $D/load.js &
load=$!
sleep 3
bash $D/swap.sh rolling || echo "swap.sh failed"
wait $load; rc=$?

echo "== proxy errors =="
docker logs ns-proxy 2>&1 | grep -E '\[(error|crit)\]|temporarily disabled|no live' | grep -v cacher | tail -80 || true
for c in blue green yellow; do echo "== blot-container-$c =="; docker logs --tail 15 blot-container-$c 2>&1; done
exit $rc
