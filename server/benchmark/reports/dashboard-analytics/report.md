# Benchmark Report — dashboard-analytics

> Generated: 2026-07-16T08:52:10.969Z

## Environment

| Field | Value |
| --- | --- |
| Scenario | dashboard-analytics |
| Benchmark Version | 1.0.0 |
| Node.js | v25.1.0 |
| Platform | win32 |
| Arch | x64 |
| Date | 2026-07-16T08:52:10.969Z |

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
| Elapsed | 2.42 ms |

## Latency Summary

| Metric | Value |
| --- | --- |
| Average | 1.34 ms |
| Median | 1.34 ms |
| Minimum | 1.34 ms |
| Maximum | 1.34 ms |
| Std Dev | 0.00 ms |

## Percentiles

| Percentile | Latency |
| --- | --- |
| P50 | 1.34 ms |
| P90 | 1.34 ms |
| P95 | 1.34 ms |
| P99 | 1.34 ms |

## Throughput & Reliability

| Metric | Value |
| --- | --- |
| Total Requests | 1 |
| Successful | 0 |
| Failed | 1 |
| Success Rate | 0.00% |
| Failure Rate | 100.00% |
| Requests / sec | 677.2 req/s |
| Elapsed | 1.48 ms |

## Memory & CPU

| Metric | Value |
| --- | --- |
| Heap Used | 17.69 MB |
| RSS | 86.09 MB |
| Uptime | 4.8 s |
| CPU User | 1671.00 ms |
| CPU System | 828.00 ms |

## Observations

- ✗ Low success rate (0.00%)
- ✓ P99 latency is under 100 ms
- ✓ Throughput is strong: 677.2 req/s
