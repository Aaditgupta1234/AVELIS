# Benchmark Report — reports-member

> Generated: 2026-07-16T08:52:11.123Z

## Environment

| Field | Value |
| --- | --- |
| Scenario | reports-member |
| Benchmark Version | 1.0.0 |
| Node.js | v25.1.0 |
| Platform | win32 |
| Arch | x64 |
| Date | 2026-07-16T08:52:11.123Z |

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
| Elapsed | 19.55 ms |

## Latency Summary

| Metric | Value |
| --- | --- |
| Average | 11.11 ms |
| Median | 11.11 ms |
| Minimum | 11.11 ms |
| Maximum | 11.11 ms |
| Std Dev | 0.00 ms |

## Percentiles

| Percentile | Latency |
| --- | --- |
| P50 | 11.11 ms |
| P90 | 11.11 ms |
| P95 | 11.11 ms |
| P99 | 11.11 ms |

## Throughput & Reliability

| Metric | Value |
| --- | --- |
| Total Requests | 1 |
| Successful | 1 |
| Failed | 0 |
| Success Rate | 100.00% |
| Failure Rate | 0.00% |
| Requests / sec | 88.0 req/s |
| Elapsed | 11.36 ms |

## Memory & CPU

| Metric | Value |
| --- | --- |
| Heap Used | 21.14 MB |
| RSS | 89.04 MB |
| Uptime | 5.0 s |
| CPU User | 1765.00 ms |
| CPU System | 859.00 ms |

## Observations

- ✓ Excellent success rate (≥ 99%)
- ✓ P99 latency is under 100 ms
- ⚠ Throughput: 88.0 req/s
