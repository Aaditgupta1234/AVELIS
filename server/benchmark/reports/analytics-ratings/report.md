# Benchmark Report — analytics-ratings

> Generated: 2026-07-16T08:52:11.051Z

## Environment

| Field | Value |
| --- | --- |
| Scenario | analytics-ratings |
| Benchmark Version | 1.0.0 |
| Node.js | v25.1.0 |
| Platform | win32 |
| Arch | x64 |
| Date | 2026-07-16T08:52:11.051Z |

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
| Elapsed | 10.52 ms |

## Latency Summary

| Metric | Value |
| --- | --- |
| Average | 6.26 ms |
| Median | 6.26 ms |
| Minimum | 6.26 ms |
| Maximum | 6.26 ms |
| Std Dev | 0.00 ms |

## Percentiles

| Percentile | Latency |
| --- | --- |
| P50 | 6.26 ms |
| P90 | 6.26 ms |
| P95 | 6.26 ms |
| P99 | 6.26 ms |

## Throughput & Reliability

| Metric | Value |
| --- | --- |
| Total Requests | 1 |
| Successful | 1 |
| Failed | 0 |
| Success Rate | 100.00% |
| Failure Rate | 0.00% |
| Requests / sec | 154.6 req/s |
| Elapsed | 6.47 ms |

## Memory & CPU

| Metric | Value |
| --- | --- |
| Heap Used | 19.24 MB |
| RSS | 88.23 MB |
| Uptime | 4.9 s |
| CPU User | 1703.00 ms |
| CPU System | 828.00 ms |

## Observations

- ✓ Excellent success rate (≥ 99%)
- ✓ P99 latency is under 100 ms
- ✓ Throughput is strong: 154.6 req/s
