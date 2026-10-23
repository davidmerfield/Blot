# Proxy cache benchmark results

Run: 2026-10-23T13:33:31Z

Machine: Docker 29.8.2, 1 CPUs, 4107534336 bytes memory, Docker Desktop, aarch64 ; host Darwin arm64, 8 logical CPUs

wrk: `-t4 -c64 -d20s --latency`, from a separate container on the same network. Proxy limited to `--cpus=1`. Stub upstream and Redis idle during the runs (all requests are cache hits).

| Case | Impl | req/s | p50 ms | p99 ms | transfer/s | non-2xx | CPU us/req | proxy cores | wrk cores |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| page br+gzip | proxycache | 1278.13 | 45.29 | 98.98 | 24.88MB | 0 | 685.8 | 0.88 | 0.01 |
| page br+gzip | diskcache | 19708.17 | 2.90 | 10.03 | 331.57MB | 0 | 29.0 | 0.57 | 0.21 |
| page gzip | proxycache | 941.02 | 62.58 | 141.36 | 18.28MB | 0 | 959.8 | 0.90 | 0.01 |
| page gzip | diskcache | 18724.37 | 2.96 | 13.09 | 346.00MB | 0 | 29.9 | 0.56 | 0.20 |
| page identity | proxycache | 22173.23 | 2.59 | 8.89 | 1.28GB | 0 | 22.4 | 0.50 | 0.29 |
| page identity | diskcache | 18594.45 | 3.09 | 11.46 | 1.07GB | 0 | 29.1 | 0.54 | 0.25 |
| large br+gzip | proxycache | 46.02 | 1380.00 | 1520.00 | 28.66MB | 0 (Socket errors: connect 0, read 0, write 0, timeout 2) | 20422.7 | 0.94 | 0.01 |
| large br+gzip | diskcache | 9078.83 | 4.80 | 16.60 | 4.12GB | 0 | 39.5 | 0.36 | 0.51 |
| image br+gzip | proxycache | 15264.88 | 3.79 | 11.46 | 2.91GB | 0 | 28.5 | 0.44 | 0.39 |
| image br+gzip | diskcache | 14475.06 | 3.95 | 12.38 | 2.76GB | 0 | 30.3 | 0.44 | 0.38 |

Ratio diskcache / proxycache:

| Case | req/s | CPU us/req |
| --- | ---: | ---: |
| page br+gzip | 15.42x | 0.04x |
| page gzip | 19.90x | 0.03x |
| page identity | 0.84x | 1.30x |
| large br+gzip | 197.28x | 0.00x |
| image br+gzip | 0.95x | 1.06x |

Response checks (Blot-Cache HIT and expected Content-Encoding, before each wrk run):

- proxycache: page br+gzip ok, page gzip ok, page identity ok, large br+gzip ok, image br+gzip ok
- diskcache: page br+gzip ok, page gzip ok, page identity ok, large br+gzip ok, image br+gzip ok

Proxy error/crit/alert log lines:

- proxycache: none
- diskcache: none
