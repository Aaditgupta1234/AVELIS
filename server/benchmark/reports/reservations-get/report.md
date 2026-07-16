# Benchmark Report — reservations-get

> Generated: 2026-07-16T08:52:10.632Z

## Environment

| Field | Value |
| --- | --- |
| Scenario | reservations-get |
| Benchmark Version | 1.0.0 |
| Node.js | v25.1.0 |
| Platform | win32 |
| Arch | x64 |
| Date | 2026-07-16T08:52:10.632Z |

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
| Elapsed | 6.38 ms |

## Latency Summary

| Metric | Value |
| --- | --- |
| Average | 3.36 ms |
| Median | 3.36 ms |
| Minimum | 3.36 ms |
| Maximum | 3.36 ms |
| Std Dev | 0.00 ms |

## Percentiles

| Percentile | Latency |
| --- | --- |
| P50 | 3.36 ms |
| P90 | 3.36 ms |
| P95 | 3.36 ms |
| P99 | 3.36 ms |

## Throughput & Reliability

| Metric | Value |
| --- | --- |
| Total Requests | 1 |
| Successful | 1 |
| Failed | 0 |
| Success Rate | 100.00% |
| Failure Rate | 0.00% |
| Requests / sec | 282.5 req/s |
| Elapsed | 3.54 ms |

## Memory & CPU

| Metric | Value |
| --- | --- |
| Heap Used | 18.54 MB |
| RSS | 81.58 MB |
| Uptime | 4.5 s |
| CPU User | 1500.00 ms |
| CPU System | 781.00 ms |

## Observations

- ✓ Excellent success rate (≥ 99%)
- ✓ P99 latency is under 100 ms
- ✓ Throughput is strong: 282.5 req/s
