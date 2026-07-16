# Benchmark Report — reservations-cancel

> Generated: 2026-07-16T08:52:10.712Z

## Environment

| Field | Value |
| --- | --- |
| Scenario | reservations-cancel |
| Benchmark Version | 1.0.0 |
| Node.js | v25.1.0 |
| Platform | win32 |
| Arch | x64 |
| Date | 2026-07-16T08:52:10.712Z |

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
| Elapsed | 17.68 ms |

## Latency Summary

| Metric | Value |
| --- | --- |
| Average | 11.41 ms |
| Median | 11.41 ms |
| Minimum | 11.41 ms |
| Maximum | 11.41 ms |
| Std Dev | 0.00 ms |

## Percentiles

| Percentile | Latency |
| --- | --- |
| P50 | 11.41 ms |
| P90 | 11.41 ms |
| P95 | 11.41 ms |
| P99 | 11.41 ms |

## Throughput & Reliability

| Metric | Value |
| --- | --- |
| Total Requests | 1 |
| Successful | 1 |
| Failed | 0 |
| Success Rate | 100.00% |
| Failure Rate | 0.00% |
| Requests / sec | 65.8 req/s |
| Elapsed | 15.19 ms |

## Memory & CPU

| Metric | Value |
| --- | --- |
| Heap Used | 19.82 MB |
| RSS | 82.39 MB |
| Uptime | 4.5 s |
| CPU User | 1562.00 ms |
| CPU System | 796.00 ms |

## Observations

- ✓ Excellent success rate (≥ 99%)
- ✓ P99 latency is under 100 ms
- ⚠ Throughput: 65.8 req/s
