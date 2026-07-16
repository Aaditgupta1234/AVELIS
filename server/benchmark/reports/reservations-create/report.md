# Benchmark Report — reservations-create

> Generated: 2026-07-16T08:52:10.646Z

## Environment

| Field | Value |
| --- | --- |
| Scenario | reservations-create |
| Benchmark Version | 1.0.0 |
| Node.js | v25.1.0 |
| Platform | win32 |
| Arch | x64 |
| Date | 2026-07-16T08:52:10.646Z |

## Configuration

| Setting | Value |
| --- | --- |
| Base URL | http://localhost:5000/api/v1 |
| Warmup Iterations | 1 |
| Iterations | 1 |
| Concurrency Levels | 1, 5, 10, 25, 50 |
| Timeout | 5000 ms |
| Collect Memory | true |
| Collect CPU | true |

## Warm-up

| Field | Value |
| --- | --- |
| Iterations Run | 1 |
| Elapsed | 32.41 ms |

## Latency Summary

| Metric | Value |
| --- | --- |
| Average | 18.55 ms |
| Median | 18.55 ms |
| Minimum | 18.55 ms |
| Maximum | 18.55 ms |
| Std Dev | 0.00 ms |

## Percentiles

| Percentile | Latency |
| --- | --- |
| P50 | 18.55 ms |
| P90 | 18.55 ms |
| P95 | 18.55 ms |
| P99 | 18.55 ms |

## Throughput & Reliability

| Metric | Value |
| --- | --- |
| Total Requests | 1 |
| Successful | 1 |
| Failed | 0 |
| Success Rate | 100.00% |
| Failure Rate | 0.00% |
| Requests / sec | 40.9 req/s |
| Elapsed | 24.45 ms |

## Memory & CPU

| Metric | Value |
| --- | --- |
| Heap Used | 19.12 MB |
| RSS | 81.73 MB |
| Uptime | 4.5 s |
| CPU User | 1531.00 ms |
| CPU System | 796.00 ms |

## Observations

- ✓ Excellent success rate (≥ 99%)
- ✓ P99 latency is under 100 ms
- ⚠ Throughput: 40.9 req/s
