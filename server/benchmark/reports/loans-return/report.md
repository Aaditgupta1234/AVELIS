# Benchmark Report — loans-return

> Generated: 2026-07-16T08:52:10.485Z

## Environment

| Field | Value |
| --- | --- |
| Scenario | loans-return |
| Benchmark Version | 1.0.0 |
| Node.js | v25.1.0 |
| Platform | win32 |
| Arch | x64 |
| Date | 2026-07-16T08:52:10.485Z |

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
| Elapsed | 21.96 ms |

## Latency Summary

| Metric | Value |
| --- | --- |
| Average | 13.33 ms |
| Median | 13.33 ms |
| Minimum | 13.33 ms |
| Maximum | 13.33 ms |
| Std Dev | 0.00 ms |

## Percentiles

| Percentile | Latency |
| --- | --- |
| P50 | 13.33 ms |
| P90 | 13.33 ms |
| P95 | 13.33 ms |
| P99 | 13.33 ms |

## Throughput & Reliability

| Metric | Value |
| --- | --- |
| Total Requests | 1 |
| Successful | 1 |
| Failed | 0 |
| Success Rate | 100.00% |
| Failure Rate | 0.00% |
| Requests / sec | 54.9 req/s |
| Elapsed | 18.22 ms |

## Memory & CPU

| Metric | Value |
| --- | --- |
| Heap Used | 21.89 MB |
| RSS | 81.19 MB |
| Uptime | 4.3 s |
| CPU User | 1421.00 ms |
| CPU System | 765.00 ms |

## Observations

- ✓ Excellent success rate (≥ 99%)
- ✓ P99 latency is under 100 ms
- ⚠ Throughput: 54.9 req/s
