# Benchmark Report — reviews-rating

> Generated: 2026-07-16T08:52:10.841Z

## Environment

| Field | Value |
| --- | --- |
| Scenario | reviews-rating |
| Benchmark Version | 1.0.0 |
| Node.js | v25.1.0 |
| Platform | win32 |
| Arch | x64 |
| Date | 2026-07-16T08:52:10.841Z |

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
| Elapsed | 6.11 ms |

## Latency Summary

| Metric | Value |
| --- | --- |
| Average | 8.16 ms |
| Median | 8.16 ms |
| Minimum | 8.16 ms |
| Maximum | 8.16 ms |
| Std Dev | 0.00 ms |

## Percentiles

| Percentile | Latency |
| --- | --- |
| P50 | 8.16 ms |
| P90 | 8.16 ms |
| P95 | 8.16 ms |
| P99 | 8.16 ms |

## Throughput & Reliability

| Metric | Value |
| --- | --- |
| Total Requests | 1 |
| Successful | 1 |
| Failed | 0 |
| Success Rate | 100.00% |
| Failure Rate | 0.00% |
| Requests / sec | 119.6 req/s |
| Elapsed | 8.36 ms |

## Memory & CPU

| Metric | Value |
| --- | --- |
| Heap Used | 21.85 MB |
| RSS | 84.49 MB |
| Uptime | 4.7 s |
| CPU User | 1640.00 ms |
| CPU System | 812.00 ms |

## Observations

- ✓ Excellent success rate (≥ 99%)
- ✓ P99 latency is under 100 ms
- ✓ Throughput is strong: 119.6 req/s
