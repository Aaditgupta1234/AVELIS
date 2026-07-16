# Benchmark Report — dashboard-summary

> Generated: 2026-07-16T08:52:10.861Z

## Environment

| Field | Value |
| --- | --- |
| Scenario | dashboard-summary |
| Benchmark Version | 1.0.0 |
| Node.js | v25.1.0 |
| Platform | win32 |
| Arch | x64 |
| Date | 2026-07-16T08:52:10.861Z |

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
| Elapsed | 96.42 ms |

## Latency Summary

| Metric | Value |
| --- | --- |
| Average | 7.89 ms |
| Median | 7.89 ms |
| Minimum | 7.89 ms |
| Maximum | 7.89 ms |
| Std Dev | 0.00 ms |

## Percentiles

| Percentile | Latency |
| --- | --- |
| P50 | 7.89 ms |
| P90 | 7.89 ms |
| P95 | 7.89 ms |
| P99 | 7.89 ms |

## Throughput & Reliability

| Metric | Value |
| --- | --- |
| Total Requests | 1 |
| Successful | 1 |
| Failed | 0 |
| Success Rate | 100.00% |
| Failure Rate | 0.00% |
| Requests / sec | 124.6 req/s |
| Elapsed | 8.03 ms |

## Memory & CPU

| Metric | Value |
| --- | --- |
| Heap Used | 22.31 MB |
| RSS | 85.37 MB |
| Uptime | 4.8 s |
| CPU User | 1656.00 ms |
| CPU System | 828.00 ms |

## Observations

- ✓ Excellent success rate (≥ 99%)
- ✓ P99 latency is under 100 ms
- ✓ Throughput is strong: 124.6 req/s
