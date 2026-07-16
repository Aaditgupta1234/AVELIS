# Benchmark Report — loans-list

> Generated: 2026-07-16T08:52:10.226Z

## Environment

| Field | Value |
| --- | --- |
| Scenario | loans-list |
| Benchmark Version | 1.0.0 |
| Node.js | v25.1.0 |
| Platform | win32 |
| Arch | x64 |
| Date | 2026-07-16T08:52:10.226Z |

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
| Elapsed | 109.73 ms |

## Latency Summary

| Metric | Value |
| --- | --- |
| Average | 9.65 ms |
| Median | 9.65 ms |
| Minimum | 9.65 ms |
| Maximum | 9.65 ms |
| Std Dev | 0.00 ms |

## Percentiles

| Percentile | Latency |
| --- | --- |
| P50 | 9.65 ms |
| P90 | 9.65 ms |
| P95 | 9.65 ms |
| P99 | 9.65 ms |

## Throughput & Reliability

| Metric | Value |
| --- | --- |
| Total Requests | 1 |
| Successful | 1 |
| Failed | 0 |
| Success Rate | 100.00% |
| Failure Rate | 0.00% |
| Requests / sec | 97.3 req/s |
| Elapsed | 10.27 ms |

## Memory & CPU

| Metric | Value |
| --- | --- |
| Heap Used | 18.82 MB |
| RSS | 77.79 MB |
| Uptime | 4.2 s |
| CPU User | 1312.00 ms |
| CPU System | 734.00 ms |

## Observations

- ✓ Excellent success rate (≥ 99%)
- ✓ P99 latency is under 100 ms
- ⚠ Throughput: 97.3 req/s
