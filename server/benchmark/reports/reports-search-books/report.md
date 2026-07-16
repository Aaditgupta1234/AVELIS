# Benchmark Report — reports-search-books

> Generated: 2026-07-16T08:52:11.158Z

## Environment

| Field | Value |
| --- | --- |
| Scenario | reports-search-books |
| Benchmark Version | 1.0.0 |
| Node.js | v25.1.0 |
| Platform | win32 |
| Arch | x64 |
| Date | 2026-07-16T08:52:11.158Z |

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
| Elapsed | 12.93 ms |

## Latency Summary

| Metric | Value |
| --- | --- |
| Average | 4.38 ms |
| Median | 4.38 ms |
| Minimum | 4.38 ms |
| Maximum | 4.38 ms |
| Std Dev | 0.00 ms |

## Percentiles

| Percentile | Latency |
| --- | --- |
| P50 | 4.38 ms |
| P90 | 4.38 ms |
| P95 | 4.38 ms |
| P99 | 4.38 ms |

## Throughput & Reliability

| Metric | Value |
| --- | --- |
| Total Requests | 1 |
| Successful | 1 |
| Failed | 0 |
| Success Rate | 100.00% |
| Failure Rate | 0.00% |
| Requests / sec | 218.7 req/s |
| Elapsed | 4.57 ms |

## Memory & CPU

| Metric | Value |
| --- | --- |
| Heap Used | 21.71 MB |
| RSS | 89.23 MB |
| Uptime | 5.0 s |
| CPU User | 1781.00 ms |
| CPU System | 875.00 ms |

## Observations

- ✓ Excellent success rate (≥ 99%)
- ✓ P99 latency is under 100 ms
- ✓ Throughput is strong: 218.7 req/s
