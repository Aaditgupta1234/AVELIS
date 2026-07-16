# AVELIS Final Performance Assessment Summary

> **Run ID**: `2026-07-16T09-23-08-578Z` | **Generated**: 2026-07-16T09:57:48.978Z
> **Schema Version**: 1.0 | **Report Version**: 1.0.0 | **Phase**: 13.5.6.6

## 1. Executive Summary

| Parameter | Value |
| --- | --- |
| **Production Readiness Score** | **20 / 100** |
| **Performance Health Score** | **0 / 100** |
| **Overall Scalability Rating** | **C (Congested)** |
| **Benchmark Completion Status** | **COMPLETE** |
| **Report Status** | **PASS_WITH_WARNINGS** |
| **Total Bottlenecks Detected** | 13 |
| **Critical Issues** | 6 |
| **Historical Baseline Status** | ⚠ Baseline missing |

### Executive Conclusion:
> **DEPLOYMENT BLOCKED: Performance and resource exhaustion risks exceed acceptable boundaries. Address high-priority refactoring recommendations.**

### Top Strengths:
* ✓ Comprehensive API endpoint benchmarking coverage (>15 key routes evaluated).
* ✓ Excellent isolated database query latency, averaging < 10 ms.

### Top Performance Risks:
* ⚠ 6 CRITICAL performance bottlenecks require immediate resolution before production release.
* ⚠ 6 HIGH severity bottlenecks detected (e.g. database query patterns or event loop delays).
* ⚠ Potential memory leak detected: Heap memory increased significantly during soak testing.

## 2. Benchmark Sources

| File Name / Location | Source Phase | Schema | Run ID |
| --- | --- | --- | --- |
| `server/benchmark/reports/` | Phase 13.5.6.2 | Version 1.0 | `2026-07-16T09-23-08-578Z` |
| `server/benchmark/database/query-summary.json` | Phase 13.5.6.3 | Version 1.0 | `2026-07-16T09-23-08-578Z` |
| `server/benchmark/load/summary.json` | Phase 13.5.6.4 | Version 1.0 | `2026-07-16T09-23-08-578Z` |
| `server/benchmark/analysis/summary.json` | Phase 13.5.6.5 | Version 1.0 | `2026-07-16T09-23-08-578Z` |

## 3. Environment Metadata

| Metric | Target |
| --- | --- |
| **Node.js Version** | v25.1.0 |
| **Prisma version** | 6.19.3 |
| **PostgreSQL version** | PostgreSQL 18.3 on x86_64-windows, compiled by msvc-19.44.35225, 64-bit |
| **Platform / Arch** | win32 / x64 (CPUs: 8) |

## 4. API Benchmark Summary

| API Route | RPS | Avg Latency | P95 | Success Rate |
| --- | --- | --- | --- | --- |
| **analytics-borrowing** | 59.41 RPS | 16.68 ms | 16.68 ms | 10000.00% |
| **analytics-members** | 233.51 RPS | 4.12 ms | 4.12 ms | 10000.00% |
| **analytics-ratings** | 154.57 RPS | 6.26 ms | 6.26 ms | 10000.00% |
| **analytics-timeseries** | 230.10 RPS | 4.17 ms | 4.17 ms | 10000.00% |
| **auth-login** | 12.41 RPS | 80.38 ms | 80.38 ms | 10000.00% |
| **auth-register** | 10.08 RPS | 97.35 ms | 97.35 ms | 10000.00% |
| **books-get** | 129.21 RPS | 7.38 ms | 7.38 ms | 10000.00% |
| **books-list** | 103.75 RPS | 9.28 ms | 9.28 ms | 10000.00% |
| **books-rating** | 90.05 RPS | 10.80 ms | 10.80 ms | 10000.00% |
| **books-search** | 80.16 RPS | 11.53 ms | 11.53 ms | 10000.00% |
| **dashboard-analytics** | 677.23 RPS | 1.34 ms | 1.34 ms | 0.00% |
| **dashboard-summary** | 124.57 RPS | 7.89 ms | 7.89 ms | 10000.00% |
| **loans-active** | 148.94 RPS | 6.43 ms | 6.43 ms | 10000.00% |
| **loans-borrow** | 44.59 RPS | 15.81 ms | 15.81 ms | 10000.00% |
| **loans-get-by-id** | 154.30 RPS | 6.13 ms | 6.13 ms | 10000.00% |
| **loans-history** | 121.81 RPS | 7.68 ms | 7.68 ms | 10000.00% |
| **loans-list** | 97.33 RPS | 9.65 ms | 9.65 ms | 10000.00% |
| **loans-renew** | 44.70 RPS | 15.35 ms | 15.35 ms | 10000.00% |
| **loans-return** | 54.89 RPS | 13.33 ms | 13.33 ms | 10000.00% |
| **reports-inventory** | 159.25 RPS | 6.12 ms | 6.12 ms | 10000.00% |
| **reports-member** | 88.03 RPS | 11.11 ms | 11.11 ms | 10000.00% |
| **reports-overdue** | 269.80 RPS | 3.57 ms | 3.57 ms | 10000.00% |
| **reports-search-books** | 218.75 RPS | 4.38 ms | 4.38 ms | 10000.00% |
| **reservations-cancel** | 65.85 RPS | 11.41 ms | 11.41 ms | 10000.00% |
| **reservations-create** | 40.90 RPS | 18.55 ms | 18.55 ms | 10000.00% |
| **reservations-get** | 282.46 RPS | 3.36 ms | 3.36 ms | 10000.00% |
| **reservations-list** | 143.57 RPS | 6.75 ms | 6.75 ms | 10000.00% |
| **reservations-mine** | 164.64 RPS | 5.75 ms | 5.75 ms | 10000.00% |
| **reviews-book** | 139.36 RPS | 6.89 ms | 6.89 ms | 10000.00% |
| **reviews-create** | 83.33 RPS | 8.88 ms | 8.88 ms | 10000.00% |
| **reviews-get** | 155.47 RPS | 6.17 ms | 6.17 ms | 10000.00% |
| **reviews-mine** | 121.05 RPS | 8.01 ms | 8.01 ms | 10000.00% |
| **reviews-rating** | 119.55 RPS | 8.16 ms | 8.16 ms | 10000.00% |
| **smoke** | 29815.15 RPS | 0.02 ms | 0.00 ms | 10000.00% |
| **verify-report-test** | 39698.29 RPS | 5.00 ms | 5.00 ms | 10000.00% |

## 5. Database Benchmark Summary

### Core Database Queries

| Prisma Operation | Total Queries | Avg Latency | P95 | N+1 Pattern? | Duplicate? |
| --- | --- | --- | --- | --- | --- |
| **User Lookup** | 0 | 1.00 ms | 1.64 ms | ✓ NO | ✓ NO |
| **Book Listing** | 0 | 2.05 ms | 2.70 ms | ✓ NO | ✓ NO |
| **Book Search** | 0 | 1.58 ms | 2.24 ms | ✓ NO | ✓ NO |
| **Loan Queries** | 0 | 2.45 ms | 3.64 ms | ✓ NO | ✓ NO |
| **Reservation Queries** | 0 | 1.68 ms | 2.43 ms | ✓ NO | ✓ NO |
| **Dashboard Aggregation** | 0 | 1.97 ms | 5.81 ms | ✓ NO | ✓ NO |
| **Analytics Aggregation** | 0 | 1.15 ms | 1.77 ms | ✓ NO | ✓ NO |
| **Reporting Queries** | 0 | 4.50 ms | 6.04 ms | ✓ NO | ✓ NO |

### Isolated Transactions

| Transaction | Success Rate | Avg Commit | P95 Commit |
| --- | --- | --- | --- |
| **Borrow Book** | 100.00% | 4.88 ms | 6.54 ms |
| **Return Book** | 100.00% | 4.78 ms | 6.21 ms |
| **Renew Loan** | 100.00% | 3.70 ms | 5.03 ms |
| **Reservation Creation** | 100.00% | 3.75 ms | 6.52 ms |
| **Reservation Cancellation** | 100.00% | 3.63 ms | 4.85 ms |
| **Review Creation** | 50.00% | 5.74 ms | 7.64 ms |

## 6. Load Test Summary

### Concurrency Load Scenarios

| Concurrency | Total Requests | RPS | Avg Latency | P95 | Error Rate | Timeout Rate | Peak Process CPU |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **50 Users** | 688 | 129.03 RPS | 421.11 ms | 1058.27 ms | 33.58% | 0.00% | 34.18% |
| **100 Users** | 562 | 105.07 RPS | 991.36 ms | 1730.23 ms | 35.05% | 0.00% | 34.33% |
| **250 Users** | 830 | 123.81 RPS | 1334.67 ms | 1957.27 ms | 72.77% | 45.30% | 57.58% |
| **500 Users** | 1287 | 210.58 RPS | 1717.25 ms | 2641.03 ms | 94.02% | 67.44% | 40.82% |

### Soak Test Stability Analysis

* **Duration**: `10000 ms`
* **Heap Growth**: `55.97 MB` (Start: `50.17 MB` | End: `106.14 MB`)
* **RSS Growth**: `-7.60 MB` (Start: `302.75 MB` | End: `295.16 MB`)
* **Active Event Loop Handles**: `496 -> 31` (Growth: `-465`)
* **Throughput Degradation**: `0.00%` (First Half: `241.80 RPS` | Second Half: `310.20 RPS`)
* **Latency Drift**: `-20.24 ms`

## 7. Bottleneck Analysis Summary

| ID | Component | Category | Severity | Confidence | Confidence Reason |
| --- | --- | --- | --- | --- | --- |
| `BTL-001` | **Prisma: BookCopy.findMany** | Database | `HIGH` | HIGH | Flagged by slow query anomaly detector: Potential Full Table Scan. |
| `BTL-002` | **Prisma: loan.findMany** | Database | `HIGH` | HIGH | Flagged by slow query anomaly detector: Potential Full Table Scan. |
| `BTL-003` | **Prisma: bookCopy.findMany** | Database | `HIGH` | HIGH | Flagged by slow query anomaly detector: Potential Full Table Scan. |
| `BTL-004` | **Prisma: bookCopy.findMany** | Database | `MEDIUM` | HIGH | Flagged by slow query anomaly detector: Expensive Nested Joins. |
| `BTL-005` | **Backend Concurrency: 50 Users** | Network | `CRITICAL` | HIGH | High HTTP connection failure rate observed during concurrent load tests. |
| `BTL-006` | **Backend Concurrency: 100 Users** | Network | `CRITICAL` | HIGH | High HTTP connection failure rate observed during concurrent load tests. |
| `BTL-007` | **Backend Concurrency: 250 Users** | Network | `CRITICAL` | HIGH | High HTTP connection failure rate observed during concurrent load tests. |
| `BTL-008` | **Backend Concurrency: 250 Users** | Network | `CRITICAL` | HIGH | Request timeouts exceeded limit under heavy concurrent user stress. |
| `BTL-009` | **Backend Concurrency: 500 Users** | Network | `CRITICAL` | HIGH | High HTTP connection failure rate observed during concurrent load tests. |
| `BTL-010` | **Backend Concurrency: 500 Users** | Network | `CRITICAL` | HIGH | Request timeouts exceeded limit under heavy concurrent user stress. |
| `BTL-011` | **Node Event Loop** | CPU-bound | `HIGH` | HIGH | Event loop delays indicate potential single-threaded blockages under load. |
| `BTL-012` | **Database Connection Pool** | Connection Pool | `HIGH` | HIGH | Active Postgres database connections approaching pool limit under stress. |
| `BTL-013` | **Heap Memory Allocations** | Memory-bound | `HIGH` | HIGH | Unbounded heap memory growth observed during long-running soak test. |

## 8. Comparative Analysis

_Comparative analysis with historical baseline is unavailable for this run._

## 9. Performance Health Assessment

The overall performance health of the system is scored at **0 / 100** based on the severity of active bottlenecks.

## 10. Production Readiness Assessment

Deployability readiness is calculated at **20 / 100**.
**DEPLOYMENT BLOCKED**: The backend has critical database N+1 loop structures or memory leaks.

## 11. Recommendation Matrix

| Priority Rank | Score | Recommendation | Performance Impact | Effort | Risk | relatedBottlenecks |
| --- | --- | --- | --- | --- | --- | --- |
| `CRITICAL` | `9.20` | **Optimize index configuration and query filters**<br>_Define Postgres indexes for frequently queried columns like isDeleted and barcode, and ensure all read queries utilize WHERE constraints._ | HIGH | LOW | LOW | `BTL-001`, `BTL-002`, `BTL-003`, `BTL-004` |
| `CRITICAL` | `9.20` | **Tune Prisma connection pool size**<br>_Increase connection_limit parameter in DATABASE_URL or implement database proxies like PgBouncer._ | HIGH | LOW | LOW | `BTL-012` |
| `CRITICAL` | `8.00` | **Enable horizontal scaling and resolve loop blocks**<br>_Spawn multiple Node.js workers using the Cluster module or scale container replicas in Kubernetes._ | HIGH | MEDIUM | LOW | `BTL-011` |
| `HIGH` | `6.80` | **Profile heap allocations and fix handle leaks**<br>_Analyze active handle leaks (unclosed sockets/timers) and profile heap snapshots to find memory retention paths._ | HIGH | HIGH | LOW | `BTL-013` |

## 12. Future Optimization Opportunities

1. **Dataloader Batching**: Implement Dataloader utility layers in the Node service tier to coalesce isolated child reads.
2. **Redis Distributed Caching**: Offload catalog book search queries to Redis cluster setups.
3. **PgBouncer Scaling**: Implement connection proxies to scale past connection limits under load.

## 13. Final Conclusion

Deployability readiness assessment complete. **Conclusion: DEPLOYMENT BLOCKED: Performance and resource exhaustion risks exceed acceptable boundaries. Address high-priority refactoring recommendations.**
