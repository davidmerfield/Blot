# Proxy cache benchmark

Compares cache hit throughput and proxy CPU per request for the two blog
cache implementations: nginx `proxy_cache` (default, compresses every hit on
the fly) and the `PROXY_DISK_CACHE=true` prototype in `config/diskcache.lua`
(stores `.br`/`.gz` copies, serves hits with sendfile).

```sh
bash proxy/bench/run.sh                 # builds both images, writes results.md
SKIP_BUILD=1 bash proxy/bench/run.sh    # reuse blot-proxy:bench-* images
DURATION=30s CONNS=64 THREADS=4 PROXY_CPUS=2 bash proxy/bench/run.sh
```

`stub.js` is the upstream (seeded, so identical content every run): `/page`
(~60 KB HTML), `/large` (~2 MB HTML), `/image.jpg` (200 KB random). One proxy
runs at a time, limited with `--cpus`; wrk runs in a separate container. CPU
per request is the proxy container's cgroup `usage_usec` delta divided by
requests completed (it includes any background compression).

Caveats:

- Per-host rate limiting (`hostlimit`, burst 30) cannot be whitelisted and a
  single `blog.test` would hit it at ~30k req/s, so `run.sh` deletes those
  `limit_req` lines from the generated `openresty.conf` before `docker build`.
  `proxy/config` is untouched. Per-IP limits are bypassed by whitelisting the
  private ranges over `cdn-ips.default.conf`.
- Docker Desktop's VM may have fewer CPUs than `PROXY_CPUS` (then all of them
  are used) and wrk, the proxy, the stub and Redis share them. Check the
  `wrk cores` column: a client near the VM's CPU count is the bottleneck.
- Check the `non-2xx` column and the "Response checks" section: every case
  should be a HIT with the expected Content-Encoding.
