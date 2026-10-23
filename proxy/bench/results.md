# Proxy cache benchmark results

Run: 2026-10-23T15:36:21Z

Machine: Docker 29.8.2, 1 CPUs, 4107534336 bytes memory, Docker Desktop, aarch64 ; host Darwin arm64, 8 logical CPUs

wrk: `-t4 -c64 -d20s --latency`, from a separate container on the same network. Proxy limited to `--cpus=1`. Stub upstream and Redis idle during the runs (all requests are cache hits).

| Case | Impl | req/s | p50 ms | p99 ms | transfer/s | non-2xx | CPU us/req | proxy cores | wrk cores |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| page br+gzip | proxycache | 1080.12 | 53.33 | 119.91 | 21.03MB | 0 | 816.6 | 0.88 | 0.01 |
| page br+gzip | diskcache | 18722.88 | 2.94 | 10.84 | 314.99MB | 0 | 31.0 | 0.58 | 0.20 |
| page gzip | proxycache | 948.41 | 62.28 | 124.74 | 18.42MB | 0 | 955.9 | 0.91 | 0.01 |
| page gzip | diskcache | 19722.03 | 2.90 | 10.82 | 364.43MB | 0 | 28.8 | 0.57 | 0.21 |
| page identity | proxycache | 22199.37 | 2.57 | 8.48 | 1.28GB | 0 | 22.2 | 0.49 | 0.29 |
| page identity | diskcache | 18637.85 | 3.08 | 10.37 | 1.08GB | 0 (Socket errors: connect 0, read 0, write 0, timeout 64) | 28.9 | 0.54 | 0.25 |
| large br+gzip | proxycache | 39.05 | 1620.00 | 1900.00 | 24.30MB | 0 (Socket errors: connect 0, read 0, write 0, timeout 2) | 24233.2 | 0.95 | 0.01 |
| large br+gzip | diskcache | 9160.27 | 4.53 | 13.68 | 4.16GB | 0 (Socket errors: connect 0, read 0, write 0, timeout 64) | 38.8 | 0.36 | 0.52 |
| image br+gzip | proxycache | 15368.39 | 3.79 | 11.08 | 2.93GB | 0 | 28.3 | 0.44 | 0.40 |
| image br+gzip | diskcache | 14772.00 | 3.94 | 10.16 | 2.82GB | 0 | 30.0 | 0.44 | 0.38 |

Ratio diskcache / proxycache:

| Case | req/s | CPU us/req |
| --- | ---: | ---: |
| page br+gzip | 17.33x | 0.04x |
| page gzip | 20.79x | 0.03x |
| page identity | 0.84x | 1.30x |
| large br+gzip | 234.58x | 0.00x |
| image br+gzip | 0.96x | 1.06x |

Response checks (Blot-Cache HIT and expected Content-Encoding, before each wrk run):

- proxycache: page br+gzip ok, page gzip ok, page identity ok, large br+gzip ok, image br+gzip ok
- diskcache: page br+gzip ok, page gzip ok, page identity ok, large br+gzip ok, image br+gzip ok

Proxy error/crit/alert log lines:

- proxycache: none
- diskcache: none
