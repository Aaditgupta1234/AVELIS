# Benchmark Report — auth-register

> Generated: 2026-07-16T08:52:07.909Z

## Environment

| Field | Value |
| --- | --- |
| Scenario | auth-register |
| Benchmark Version | 1.0.0 |
| Node.js | v25.1.0 |
| Platform | win32 |
| Arch | x64 |
| Date | 2026-07-16T08:52:07.909Z |

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
| Elapsed | 282.59 ms |

## Latency Summary

| Metric | Value |
| --- | --- |
| Average | 97.35 ms |
| Median | 97.35 ms |
| Minimum | 97.35 ms |
| Maximum | 97.35 ms |
| Std Dev | 0.00 ms |

## Percentiles

| Percentile | Latency |
| --- | --- |
| P50 | 97.35 ms |
| P90 | 97.35 ms |
| P95 | 97.35 ms |
| P99 | 97.35 ms |

## Throughput & Reliability

| Metric | Value |
| --- | --- |
| Total Requests | 1 |
| Successful | 1 |
| Failed | 0 |
| Success Rate | 100.00% |
| Failure Rate | 0.00% |
| Requests / sec | 10.1 req/s |
| Elapsed | 99.19 ms |

## Memory & CPU

| Metric | Value |
| --- | --- |
| Heap Used | 15.63 MB |
| RSS | 76.23 MB |
| Uptime | 2.0 s |
| CPU User | 953.00 ms |
| CPU System | 703.00 ms |

## Observations

- ✓ Excellent success rate (≥ 99%)
- ✓ P99 latency is under 100 ms
- ⚠ Throughput: 10.1 req/s
