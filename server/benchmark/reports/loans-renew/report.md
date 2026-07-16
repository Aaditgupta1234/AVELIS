# Benchmark Report — loans-renew

> Generated: 2026-07-16T08:52:10.530Z

## Environment

| Field | Value |
| --- | --- |
| Scenario | loans-renew |
| Benchmark Version | 1.0.0 |
| Node.js | v25.1.0 |
| Platform | win32 |
| Arch | x64 |
| Date | 2026-07-16T08:52:10.530Z |

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
| Elapsed | 27.34 ms |

## Latency Summary

| Metric | Value |
| --- | --- |
| Average | 15.35 ms |
| Median | 15.35 ms |
| Minimum | 15.35 ms |
| Maximum | 15.35 ms |
| Std Dev | 0.00 ms |

## Percentiles

| Percentile | Latency |
| --- | --- |
| P50 | 15.35 ms |
| P90 | 15.35 ms |
| P95 | 15.35 ms |
| P99 | 15.35 ms |

## Throughput & Reliability

| Metric | Value |
| --- | --- |
| Total Requests | 1 |
| Successful | 1 |
| Failed | 0 |
| Success Rate | 100.00% |
| Failure Rate | 0.00% |
| Requests / sec | 44.7 req/s |
| Elapsed | 22.37 ms |

## Memory & CPU

| Metric | Value |
| --- | --- |
| Heap Used | 17.24 MB |
| RSS | 81.54 MB |
| Uptime | 4.4 s |
| CPU User | 1453.00 ms |
| CPU System | 765.00 ms |

## Observations

- ✓ Excellent success rate (≥ 99%)
- ✓ P99 latency is under 100 ms
- ⚠ Throughput: 44.7 req/s
