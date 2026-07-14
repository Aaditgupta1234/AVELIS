# Benchmark Report — smoke

> Generated: 2026-07-14T08:27:16.453Z

## Environment

| Field | Value |
| --- | --- |
| Scenario | smoke |
| Benchmark Version | 1.0.0 |
| Node.js | v25.1.0 |
| Platform | win32 |
| Arch | x64 |
| Date | 2026-07-14T08:27:16.453Z |

## Configuration

| Setting | Value |
| --- | --- |
| Base URL | http://localhost:5000/api/v1 |
| Warmup Iterations | 5 |
| Iterations | 50 |
| Concurrency Levels | 1, 5, 10, 25, 50 |
| Timeout | 5000 ms |
| Collect Memory | true |
| Collect CPU | true |

## Warm-up

| Field | Value |
| --- | --- |
| Iterations Run | 5 |
| Elapsed | 1.43 ms |

## Latency Summary

| Metric | Value |
| --- | --- |
| Average | 0.02 ms |
| Median | 0.00 ms |
| Minimum | 0.00 ms |
| Maximum | 1.00 ms |
| Std Dev | 0.14 ms |

## Percentiles

| Percentile | Latency |
| --- | --- |
| P50 | 0.00 ms |
| P90 | 0.00 ms |
| P95 | 0.00 ms |
| P99 | 1.00 ms |

## Throughput & Reliability

| Metric | Value |
| --- | --- |
| Total Requests | 50 |
| Successful | 50 |
| Failed | 0 |
| Success Rate | 100.00% |
| Failure Rate | 0.00% |
| Requests / sec | 29815.1 req/s |
| Elapsed | 1.68 ms |

## Memory & CPU

| Metric | Value |
| --- | --- |
| Heap Used | 4.80 MB |
| RSS | 49.75 MB |
| Uptime | 0.1 s |
| CPU User | 93.00 ms |
| CPU System | 0.00 ms |

## Observations

- ✓ Excellent success rate (≥ 99%)
- ✓ P99 latency is under 100 ms
- ✓ Throughput is strong: 29815.1 req/s
