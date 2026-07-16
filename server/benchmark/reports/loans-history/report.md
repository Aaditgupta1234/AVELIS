# Benchmark Report — loans-history

> Generated: 2026-07-16T08:52:10.380Z

## Environment

| Field | Value |
| --- | --- |
| Scenario | loans-history |
| Benchmark Version | 1.0.0 |
| Node.js | v25.1.0 |
| Platform | win32 |
| Arch | x64 |
| Date | 2026-07-16T08:52:10.380Z |

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
| Elapsed | 13.45 ms |

## Latency Summary

| Metric | Value |
| --- | --- |
| Average | 7.68 ms |
| Median | 7.68 ms |
| Minimum | 7.68 ms |
| Maximum | 7.68 ms |
| Std Dev | 0.00 ms |

## Percentiles

| Percentile | Latency |
| --- | --- |
| P50 | 7.68 ms |
| P90 | 7.68 ms |
| P95 | 7.68 ms |
| P99 | 7.68 ms |

## Throughput & Reliability

| Metric | Value |
| --- | --- |
| Total Requests | 1 |
| Successful | 1 |
| Failed | 0 |
| Success Rate | 100.00% |
| Failure Rate | 0.00% |
| Requests / sec | 121.8 req/s |
| Elapsed | 8.21 ms |

## Memory & CPU

| Metric | Value |
| --- | --- |
| Heap Used | 19.78 MB |
| RSS | 78.61 MB |
| Uptime | 4.2 s |
| CPU User | 1343.00 ms |
| CPU System | 734.00 ms |

## Observations

- ✓ Excellent success rate (≥ 99%)
- ✓ P99 latency is under 100 ms
- ✓ Throughput is strong: 121.8 req/s
