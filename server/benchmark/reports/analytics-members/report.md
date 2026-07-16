# Benchmark Report — analytics-members

> Generated: 2026-07-16T08:52:11.034Z

## Environment

| Field | Value |
| --- | --- |
| Scenario | analytics-members |
| Benchmark Version | 1.0.0 |
| Node.js | v25.1.0 |
| Platform | win32 |
| Arch | x64 |
| Date | 2026-07-16T08:52:11.034Z |

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
| Elapsed | 8.58 ms |

## Latency Summary

| Metric | Value |
| --- | --- |
| Average | 4.12 ms |
| Median | 4.12 ms |
| Minimum | 4.12 ms |
| Maximum | 4.12 ms |
| Std Dev | 0.00 ms |

## Percentiles

| Percentile | Latency |
| --- | --- |
| P50 | 4.12 ms |
| P90 | 4.12 ms |
| P95 | 4.12 ms |
| P99 | 4.12 ms |

## Throughput & Reliability

| Metric | Value |
| --- | --- |
| Total Requests | 1 |
| Successful | 1 |
| Failed | 0 |
| Success Rate | 100.00% |
| Failure Rate | 0.00% |
| Requests / sec | 233.5 req/s |
| Elapsed | 4.28 ms |

## Memory & CPU

| Metric | Value |
| --- | --- |
| Heap Used | 18.69 MB |
| RSS | 87.80 MB |
| Uptime | 4.9 s |
| CPU User | 1687.00 ms |
| CPU System | 828.00 ms |

## Observations

- ✓ Excellent success rate (≥ 99%)
- ✓ P99 latency is under 100 ms
- ✓ Throughput is strong: 233.5 req/s
