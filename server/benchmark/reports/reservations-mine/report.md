# Benchmark Report — reservations-mine

> Generated: 2026-07-16T08:52:10.613Z

## Environment

| Field | Value |
| --- | --- |
| Scenario | reservations-mine |
| Benchmark Version | 1.0.0 |
| Node.js | v25.1.0 |
| Platform | win32 |
| Arch | x64 |
| Date | 2026-07-16T08:52:10.613Z |

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
| Elapsed | 8.33 ms |

## Latency Summary

| Metric | Value |
| --- | --- |
| Average | 5.75 ms |
| Median | 5.75 ms |
| Minimum | 5.75 ms |
| Maximum | 5.75 ms |
| Std Dev | 0.00 ms |

## Percentiles

| Percentile | Latency |
| --- | --- |
| P50 | 5.75 ms |
| P90 | 5.75 ms |
| P95 | 5.75 ms |
| P99 | 5.75 ms |

## Throughput & Reliability

| Metric | Value |
| --- | --- |
| Total Requests | 1 |
| Successful | 1 |
| Failed | 0 |
| Success Rate | 100.00% |
| Failure Rate | 0.00% |
| Requests / sec | 164.6 req/s |
| Elapsed | 6.07 ms |

## Memory & CPU

| Metric | Value |
| --- | --- |
| Heap Used | 18.21 MB |
| RSS | 81.56 MB |
| Uptime | 4.4 s |
| CPU User | 1484.00 ms |
| CPU System | 781.00 ms |

## Observations

- ✓ Excellent success rate (≥ 99%)
- ✓ P99 latency is under 100 ms
- ✓ Throughput is strong: 164.6 req/s
