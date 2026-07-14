# Benchmark Report — verify-report-test

> Generated: 2026-07-14T08:27:03.076Z

## Environment

| Field | Value |
| --- | --- |
| Scenario | verify-report-test |
| Benchmark Version | 1.0.0 |
| Node.js | v25.1.0 |
| Platform | win32 |
| Arch | x64 |
| Date | 2026-07-14T08:27:03.076Z |

## Configuration

| Setting | Value |
| --- | --- |
| Base URL | http://localhost:5000/api/v1 |
| Warmup Iterations | 2 |
| Iterations | 5 |
| Concurrency Levels | 2 |
| Timeout | 5000 ms |
| Collect Memory | true |
| Collect CPU | true |

## Warm-up

| Field | Value |
| --- | --- |
| Iterations Run | 2 |
| Elapsed | 0.04 ms |

## Latency Summary

| Metric | Value |
| --- | --- |
| Average | 5.00 ms |
| Median | 5.00 ms |
| Minimum | 5.00 ms |
| Maximum | 5.00 ms |
| Std Dev | 0.00 ms |

## Percentiles

| Percentile | Latency |
| --- | --- |
| P50 | 5.00 ms |
| P90 | 5.00 ms |
| P95 | 5.00 ms |
| P99 | 5.00 ms |

## Throughput & Reliability

| Metric | Value |
| --- | --- |
| Total Requests | 10 |
| Successful | 10 |
| Failed | 0 |
| Success Rate | 100.00% |
| Failure Rate | 0.00% |
| Requests / sec | 39698.3 req/s |
| Elapsed | 0.25 ms |

## Memory & CPU

| Metric | Value |
| --- | --- |
| Heap Used | 8.64 MB |
| RSS | 57.86 MB |
| Uptime | 0.3 s |
| CPU User | 93.00 ms |
| CPU System | 156.00 ms |

## Observations

- ✓ Excellent success rate (≥ 99%)
- ✓ P99 latency is under 100 ms
- ✓ Throughput is strong: 39698.3 req/s
