# Benchmark Report — books-list

> Generated: 2026-07-16T08:52:08.507Z

## Environment

| Field | Value |
| --- | --- |
| Scenario | books-list |
| Benchmark Version | 1.0.0 |
| Node.js | v25.1.0 |
| Platform | win32 |
| Arch | x64 |
| Date | 2026-07-16T08:52:08.507Z |

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
| Elapsed | 1598.49 ms |

## Latency Summary

| Metric | Value |
| --- | --- |
| Average | 9.28 ms |
| Median | 9.28 ms |
| Minimum | 9.28 ms |
| Maximum | 9.28 ms |
| Std Dev | 0.00 ms |

## Percentiles

| Percentile | Latency |
| --- | --- |
| P50 | 9.28 ms |
| P90 | 9.28 ms |
| P95 | 9.28 ms |
| P99 | 9.28 ms |

## Throughput & Reliability

| Metric | Value |
| --- | --- |
| Total Requests | 1 |
| Successful | 1 |
| Failed | 0 |
| Success Rate | 100.00% |
| Failure Rate | 0.00% |
| Requests / sec | 103.8 req/s |
| Elapsed | 9.64 ms |

## Memory & CPU

| Metric | Value |
| --- | --- |
| Heap Used | 16.84 MB |
| RSS | 77.08 MB |
| Uptime | 3.9 s |
| CPU User | 1234.00 ms |
| CPU System | 718.00 ms |

## Observations

- ✓ Excellent success rate (≥ 99%)
- ✓ P99 latency is under 100 ms
- ✓ Throughput is strong: 103.8 req/s
