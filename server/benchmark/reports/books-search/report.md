# Benchmark Report — books-search

> Generated: 2026-07-16T08:52:10.158Z

## Environment

| Field | Value |
| --- | --- |
| Scenario | books-search |
| Benchmark Version | 1.0.0 |
| Node.js | v25.1.0 |
| Platform | win32 |
| Arch | x64 |
| Date | 2026-07-16T08:52:10.158Z |

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
| Elapsed | 13.99 ms |

## Latency Summary

| Metric | Value |
| --- | --- |
| Average | 11.53 ms |
| Median | 11.53 ms |
| Minimum | 11.53 ms |
| Maximum | 11.53 ms |
| Std Dev | 0.00 ms |

## Percentiles

| Percentile | Latency |
| --- | --- |
| P50 | 11.53 ms |
| P90 | 11.53 ms |
| P95 | 11.53 ms |
| P99 | 11.53 ms |

## Throughput & Reliability

| Metric | Value |
| --- | --- |
| Total Requests | 1 |
| Successful | 1 |
| Failed | 0 |
| Success Rate | 100.00% |
| Failure Rate | 0.00% |
| Requests / sec | 80.2 req/s |
| Elapsed | 12.48 ms |

## Memory & CPU

| Metric | Value |
| --- | --- |
| Heap Used | 17.93 MB |
| RSS | 77.16 MB |
| Uptime | 4.0 s |
| CPU User | 1265.00 ms |
| CPU System | 734.00 ms |

## Observations

- ✓ Excellent success rate (≥ 99%)
- ✓ P99 latency is under 100 ms
- ⚠ Throughput: 80.2 req/s
