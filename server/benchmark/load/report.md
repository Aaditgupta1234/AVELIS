# AVELIS Load Testing Report

> **Run ID**: `2026-07-16T09-23-08-578Z` | **Generated**: 2026-07-16T09:23:44.601Z
> **Schema Version**: 1.0 | **Phase**: 13.5.6.4

## 1. Executive Summary

| Parameter | Value |
| --- | --- |
| **Start Time** | 2026-07-16T09:23:08.580Z |
| **Finish Time** | 2026-07-16T09:23:44.601Z |
| **Overall Suite Duration** | 36021.27 ms |
| **Random Seed (LCG PRNG)** | Unseeded (Random) |
| **Benchmark Status** | **PASS** |
| **Performance Status** | **WARNING** |
| **Node.js Version** | v25.1.0 |
| **Prisma version** | 6.19.3 |
| **PostgreSQL version** | PostgreSQL 18.3 on x86_64-windows, compiled by msvc-19.44.35225, 64-bit |
| **Platform / Arch** | win32 / x64 (CPUs: 8) |

## 2. Concurrent User Comparison

| Concurrency | Benchmark | Performance | Total Requests | Success Rate | Throughput | Avg Latency | P95 | P99 | Node Process CPU | Heap Growth |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **50 Users** | PASS | ⚠ Exceeded latency limit | 688 | 66.42% | 129.03 RPS | 421.11 ms | 1058.27 ms | 1348.44 ms | 34.18% | 20.22 MB |
| **100 Users** | PASS | ⚠ Exceeded latency limit | 562 | 64.95% | 105.07 RPS | 991.36 ms | 1730.23 ms | 1818.06 ms | 34.33% | 35.34 MB |
| **250 Users** | PASS | ⚠ Exceeded latency limit | 830 | 27.23% | 123.81 RPS | 1334.67 ms | 1957.27 ms | 2016.44 ms | 57.58% | -40.39 MB |
| **500 Users** | PASS | ⚠ Exceeded latency limit | 1287 | 5.98% | 210.58 RPS | 1717.25 ms | 2641.03 ms | 2650.14 ms | 40.82% | 2.90 MB |

## 3. Stability Metrics Trace

| Interval / Concurrency | Avg Process CPU | Heap Memory | RSS Memory | Event Loop Delay |
| --- | --- | --- | --- | --- |
| 50 | 34.18% | 52.03 MB | 173.60 MB | 9.03 ms |
| 100 | 34.33% | 87.50 MB | 239.82 MB | 9.41 ms |
| 250 | 57.58% | 47.19 MB | 287.03 MB | 7.23 ms |
| 500 | 40.82% | 50.14 MB | 302.75 MB | 25.30 ms |

## 4. Connection Pool Analysis

* **PostgreSQL Connection Count**: `9`
* **Prisma Connection Status**: `Stable`

#### Connection Recommendations:
* ⚠ Active database connections are approaching pool capacity limit. Consider increasing the Prisma connection_limit in your DATABASE_URL.

## 5. Soak Test Results

### Core Soak Test Metrics

* **Soak Duration**: `10000 ms`
* **Total Requests**: `2760`
* **Success Rate**: `64.96%`
* **First Half Avg Latency**: `84.00 ms` | **Second Half Avg Latency**: `63.76 ms`
* **Latency Drift**: `-20.24 ms`
* **Throughput Degradation**: `0.00%`
* **Event Loop Delay**: `9.61 ms`

### Resource Usage Trends during Soak

* **Heap Memory**: Started at `50.17 MB` | Finished at `106.14 MB` (Growth: `55.97 MB`)
* **RSS Memory**: Started at `302.75 MB` | Finished at `295.16 MB` (Growth: `-7.60 MB`)
* **Node CPU Usage**: Started at `0.00%` | Finished at `58.74%`
* **Active Event Loop Handles**: Started at `496` | Finished at `31` (Growth: `-465`)

### Errors Breakdown

* **Timeouts**: `0`
* **Network Errors**: `20`
* **Unexpected Exceptions**: `0`
* **HTTP Error Codes**:
  - Status `400`: `400` occurrences
  - Status `409`: `547` occurrences

### Soak Test Anomalies

* ⚠ **Potential Memory Leak**: Significant heap memory growth detected during run.

## 6. Performance Recommendations & Scalability Assessment

### Scalability Rating:
**CONGESTED (C)** — Scalability limits reached. System latency increases significantly under high concurrent load, indicating potential thread or connection blocks.

### Strategic Recommendations:
1. **Connection Pooling**: Use PgBouncer or scale connection pools to mitigate database handshake latency under high user numbers.
2. **Horizontal Scaling**: If Node Process CPU is saturated (>80%), spawn multiple instances using Node.js cluster module or Kubernetes replicas.
3. **Memory Optimization**: Monitor and flush transient caches to prevent Heap/RSS accumulation observed during soak testing.
