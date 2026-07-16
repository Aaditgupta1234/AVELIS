# Benchmark Report — auth-login

> Generated: 2026-07-16T08:52:08.322Z

## Environment

| Field | Value |
| --- | --- |
| Scenario | auth-login |
| Benchmark Version | 1.0.0 |
| Node.js | v25.1.0 |
| Platform | win32 |
| Arch | x64 |
| Date | 2026-07-16T08:52:08.322Z |

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
| Elapsed | 101.22 ms |

## Latency Summary

| Metric | Value |
| --- | --- |
| Average | 80.38 ms |
| Median | 80.38 ms |
| Minimum | 80.38 ms |
| Maximum | 80.38 ms |
| Std Dev | 0.00 ms |

## Percentiles

| Percentile | Latency |
| --- | --- |
| P50 | 80.38 ms |
| P90 | 80.38 ms |
| P95 | 80.38 ms |
| P99 | 80.38 ms |

## Throughput & Reliability

| Metric | Value |
| --- | --- |
| Total Requests | 1 |
| Successful | 1 |
| Failed | 0 |
| Success Rate | 100.00% |
| Failure Rate | 0.00% |
| Requests / sec | 12.4 req/s |
| Elapsed | 80.60 ms |

## Memory & CPU

| Metric | Value |
| --- | --- |
| Heap Used | 16.26 MB |
| RSS | 76.57 MB |
| Uptime | 2.2 s |
| CPU User | 1125.00 ms |
| CPU System | 703.00 ms |

## Observations

- ✓ Excellent success rate (≥ 99%)
- ✓ P99 latency is under 100 ms
- ⚠ Throughput: 12.4 req/s
