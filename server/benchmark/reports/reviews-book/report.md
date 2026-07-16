# Benchmark Report — reviews-book

> Generated: 2026-07-16T08:52:10.752Z

## Environment

| Field | Value |
| --- | --- |
| Scenario | reviews-book |
| Benchmark Version | 1.0.0 |
| Node.js | v25.1.0 |
| Platform | win32 |
| Arch | x64 |
| Date | 2026-07-16T08:52:10.752Z |

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
| Elapsed | 7.46 ms |

## Latency Summary

| Metric | Value |
| --- | --- |
| Average | 6.89 ms |
| Median | 6.89 ms |
| Minimum | 6.89 ms |
| Maximum | 6.89 ms |
| Std Dev | 0.00 ms |

## Percentiles

| Percentile | Latency |
| --- | --- |
| P50 | 6.89 ms |
| P90 | 6.89 ms |
| P95 | 6.89 ms |
| P99 | 6.89 ms |

## Throughput & Reliability

| Metric | Value |
| --- | --- |
| Total Requests | 1 |
| Successful | 1 |
| Failed | 0 |
| Success Rate | 100.00% |
| Failure Rate | 0.00% |
| Requests / sec | 139.4 req/s |
| Elapsed | 7.18 ms |

## Memory & CPU

| Metric | Value |
| --- | --- |
| Heap Used | 20.30 MB |
| RSS | 82.89 MB |
| Uptime | 4.6 s |
| CPU User | 1593.00 ms |
| CPU System | 796.00 ms |

## Observations

- ✓ Excellent success rate (≥ 99%)
- ✓ P99 latency is under 100 ms
- ✓ Throughput is strong: 139.4 req/s
