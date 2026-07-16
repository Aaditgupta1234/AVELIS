# AVELIS Performance Bottleneck Analysis Report

> **Run ID**: `2026-07-16T09-23-08-578Z` | **Generated**: 2026-07-16T09:41:46.653Z
> **Schema Version**: 1.0 | **Phase**: 13.5.6.5

## 1. Executive Summary

| Parameter | Value |
| --- | --- |
| **Analysis Status** | **PASS** |
| **Overall Performance Health Score** | **100 / 100** |
| **Overall Scalability Rating** | **C (Congested)** |
| **Total Bottlenecks Detected** | 13 |
| **Critical Issues** | 6 |
| **High Priority Recommendations** | 4 |
| **Analysis Duration** | 131.60 ms |

## 2. Benchmark Sources

The following performance artifacts were parsed and analyzed during this run:

* `benchmark\reports\analytics-borrowing\summary.json`
* `benchmark\reports\analytics-members\summary.json`
* `benchmark\reports\analytics-ratings\summary.json`
* `benchmark\reports\analytics-timeseries\summary.json`
* `benchmark\reports\auth-login\summary.json`
* `benchmark\reports\auth-register\summary.json`
* `benchmark\reports\books-get\summary.json`
* `benchmark\reports\books-list\summary.json`
* `benchmark\reports\books-rating\summary.json`
* `benchmark\reports\books-search\summary.json`
* `benchmark\reports\dashboard-analytics\summary.json`
* `benchmark\reports\dashboard-summary\summary.json`
* `benchmark\reports\loans-active\summary.json`
* `benchmark\reports\loans-borrow\summary.json`
* `benchmark\reports\loans-get-by-id\summary.json`
* `benchmark\reports\loans-history\summary.json`
* `benchmark\reports\loans-list\summary.json`
* `benchmark\reports\loans-renew\summary.json`
* `benchmark\reports\loans-return\summary.json`
* `benchmark\reports\reports-inventory\summary.json`
* `benchmark\reports\reports-member\summary.json`
* `benchmark\reports\reports-overdue\summary.json`
* `benchmark\reports\reports-search-books\summary.json`
* `benchmark\reports\reservations-cancel\summary.json`
* `benchmark\reports\reservations-create\summary.json`
* `benchmark\reports\reservations-get\summary.json`
* `benchmark\reports\reservations-list\summary.json`
* `benchmark\reports\reservations-mine\summary.json`
* `benchmark\reports\reviews-book\summary.json`
* `benchmark\reports\reviews-create\summary.json`
* `benchmark\reports\reviews-get\summary.json`
* `benchmark\reports\reviews-mine\summary.json`
* `benchmark\reports\reviews-rating\summary.json`
* `benchmark\reports\smoke\summary.json`
* `benchmark\reports\verify-report-test\summary.json`
* `benchmark\database\query-summary.json`
* `benchmark\database\transactions.json`
* `benchmark\database\slow-queries.json`
* `benchmark\load\summary.json`
* `benchmark\load\stability.json`
* `benchmark\load\soak-test.json`

## 3. Environment Information

| Environment Key | Configured Target / Version |
| --- | --- |
| **Node.js version** | v25.1.0 |
| **Prisma version** | 6.19.3 |
| **PostgreSQL version** | PostgreSQL 18.3 on x86_64-windows, compiled by msvc-19.44.35225, 64-bit |
| **Platform / Arch** | win32 / x64 |

## 4. Top Bottlenecks

| ID | Component | Category | Severity | Confidence | Confidence Reason | Trace Source |
| --- | --- | --- | --- | --- | --- | --- |
| `BTL-001` | **Prisma: BookCopy.findMany** | Database | `HIGH` | HIGH | Flagged by slow query anomaly detector: Potential Full Table Scan. | Phase 13.5.6.3 (slow-queries.json: BookCopy.findMany) |
| `BTL-002` | **Prisma: loan.findMany** | Database | `HIGH` | HIGH | Flagged by slow query anomaly detector: Potential Full Table Scan. | Phase 13.5.6.3 (slow-queries.json: loan.findMany) |
| `BTL-003` | **Prisma: bookCopy.findMany** | Database | `HIGH` | HIGH | Flagged by slow query anomaly detector: Potential Full Table Scan. | Phase 13.5.6.3 (slow-queries.json: bookCopy.findMany) |
| `BTL-005` | **Backend Concurrency: 50 Users** | Network | `CRITICAL` | HIGH | High HTTP connection failure rate observed during concurrent load tests. | Phase 13.5.6.4 (summary.json: 50 users failure rate) |
| `BTL-006` | **Backend Concurrency: 100 Users** | Network | `CRITICAL` | HIGH | High HTTP connection failure rate observed during concurrent load tests. | Phase 13.5.6.4 (summary.json: 100 users failure rate) |
| `BTL-007` | **Backend Concurrency: 250 Users** | Network | `CRITICAL` | HIGH | High HTTP connection failure rate observed during concurrent load tests. | Phase 13.5.6.4 (summary.json: 250 users failure rate) |
| `BTL-008` | **Backend Concurrency: 250 Users** | Network | `CRITICAL` | HIGH | Request timeouts exceeded limit under heavy concurrent user stress. | Phase 13.5.6.4 (summary.json: 250 users timeout rate) |
| `BTL-009` | **Backend Concurrency: 500 Users** | Network | `CRITICAL` | HIGH | High HTTP connection failure rate observed during concurrent load tests. | Phase 13.5.6.4 (summary.json: 500 users failure rate) |
| `BTL-010` | **Backend Concurrency: 500 Users** | Network | `CRITICAL` | HIGH | Request timeouts exceeded limit under heavy concurrent user stress. | Phase 13.5.6.4 (summary.json: 500 users timeout rate) |
| `BTL-011` | **Node Event Loop** | CPU-bound | `HIGH` | HIGH | Event loop delays indicate potential single-threaded blockages under load. | Phase 13.5.6.4 (stability.json: eventLoopDelayMs) |
| `BTL-012` | **Database Connection Pool** | Connection Pool | `HIGH` | HIGH | Active Postgres database connections approaching pool limit under stress. | Phase 13.5.6.4 (stability.json: connectionAnalysis) |
| `BTL-013` | **Heap Memory Allocations** | Memory-bound | `HIGH` | HIGH | Unbounded heap memory growth observed during long-running soak test. | Phase 13.5.6.4 (soak-test.json: heapGrowth) |
| `BTL-004` | **Prisma: bookCopy.findMany** | Database | `MEDIUM` | HIGH | Flagged by slow query anomaly detector: Expensive Nested Joins. | Phase 13.5.6.3 (slow-queries.json: bookCopy.findMany) |

### Read Bottlenecks
_No read latency bottlenecks detected._

### Write Bottlenecks
_No write latency bottlenecks detected._

### Database Bottlenecks
* **Prisma: BookCopy.findMany** (Severity: `HIGH`): Anomaly Type: `Potential Full Table Scan`.
* **Prisma: loan.findMany** (Severity: `HIGH`): Anomaly Type: `Potential Full Table Scan`.
* **Prisma: bookCopy.findMany** (Severity: `HIGH`): Anomaly Type: `Potential Full Table Scan`.
* **Prisma: bookCopy.findMany** (Severity: `MEDIUM`): Anomaly Type: `Expensive Nested Joins`.

### Transaction Bottlenecks
_No transaction bottlenecks detected._

## 5. System Resources Analysis

### CPU Analysis
* ⚠ **Node Event Loop**: Exceeded target limit. Peak CPU Fraction: `undefined%`.

### Memory Analysis
* ⚠ **Heap Memory Allocations**: Heap growth recorded: `55.97 MB`.

### Connection Pool Analysis
* ⚠ **Database Connection Pool**: Saturation warning. Active database connections count: `9`.

### Event Loop Analysis
* ⚠ **Node Event Loop Delay**: Event loop delay spikes recorded up to `25.30 ms`, suggesting single-threaded blockages.

## 6. Recommendation Matrix

| Recommendation | Expected Benefit | Effort | Impact | Risk | Related Bottlenecks |
| --- | --- | --- | --- | --- | --- |
| **Optimize index configuration and query filters**<br>_Define Postgres indexes for frequently queried columns like isDeleted and barcode, and ensure all read queries utilize WHERE constraints._ | Avoids expensive full table scans, lowering CPU consumption and read latencies under load. | LOW | HIGH | LOW | `BTL-001`, `BTL-002`, `BTL-003`, `BTL-004` |
| **Tune Prisma connection pool size**<br>_Increase connection_limit parameter in DATABASE_URL or implement database proxies like PgBouncer._ | Prevents connection saturation and handshake delays under concurrent load. | LOW | HIGH | LOW | `BTL-012` |
| **Enable horizontal scaling and resolve loop blocks**<br>_Spawn multiple Node.js workers using the Cluster module or scale container replicas in Kubernetes._ | Spreads heavy computational loads across multiple CPU cores, lowering latency drift. | MEDIUM | HIGH | LOW | `BTL-011` |
| **Profile heap allocations and fix handle leaks**<br>_Analyze active handle leaks (unclosed sockets/timers) and profile heap snapshots to find memory retention paths._ | Stabilizes memory usage during long running processes, preventing out-of-memory crashes. | HIGH | HIGH | LOW | `BTL-013` |

## 7. Priority Matrix

| Rank | Score | Recommendation | Expected Benefit | Risk |
| --- | --- | --- | --- | --- |
| `CRITICAL` | `9.20` | **Optimize index configuration and query filters** | Avoids expensive full table scans, lowering CPU consumption and read latencies under load. | LOW |
| `CRITICAL` | `9.20` | **Tune Prisma connection pool size** | Prevents connection saturation and handshake delays under concurrent load. | LOW |
| `CRITICAL` | `8.00` | **Enable horizontal scaling and resolve loop blocks** | Spreads heavy computational loads across multiple CPU cores, lowering latency drift. | LOW |
| `HIGH` | `6.80` | **Profile heap allocations and fix handle leaks** | Stabilizes memory usage during long running processes, preventing out-of-memory crashes. | LOW |

## 8. Risk Assessment

Analyzing optimization safety and refactoring risks:

_All suggested recommendations are Low Risk and safe to configure._

## 9. Future Optimization Opportunities

1. **Connection Pooling Proxy**: Set up PgBouncer to manage high PostgreSQL client connections efficiently.
2. **GraphQL or Restructured Schemas**: Reduce join overhead by restructuring large relation lists.
3. **Query Batching Utilities**: Integrate dataloader patterns in GraphQL/Prisma middleware to completely isolate N+1 lookups.
