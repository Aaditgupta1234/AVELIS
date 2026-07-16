# AVELIS Database Benchmark Report

> Generated: 2026-07-16T09:09:02.035Z
> Schema Version: 1.0 | Phase: 13.5.6.3

## 1. Executive Summary

| Metric | Value |
| --- | --- |
| **Start Time** | 2026-07-16T09:08:59.790Z |
| **Finish Time** | 2026-07-16T09:09:08.104Z |
| **Overall Suite Duration** | 8311.131 ms |
| **Node.js Version** | v25.1.0 |
| **Prisma version** | 6.19.3 |
| **PostgreSQL version** | PostgreSQL 18.3 on x86_64-windows, compiled by msvc-19.44.35225, 64-bit |
| **Platform / Arch** | win32 / x64 |
| **Warmup Iterations** | 5 |
| **Measurement Iterations** | 100 |

## 2. Query Benchmarks

| Query | Benchmark Status | Performance Status | Iterations | Avg Latency | P95 | P99 | Std Dev | Total Time | Query Count |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **User Lookup** | PASS | ✓ Within recommendation | 100 | 0.999 ms | 1.641 ms | 1.808 ms | 0.285 ms | 99.852 ms | 1 |
| **Book Listing** | PASS | ✓ Within recommendation | 100 | 2.054 ms | 2.697 ms | 3.005 ms | 0.415 ms | 205.413 ms | 1 |
| **Book Search** | PASS | ✓ Within recommendation | 100 | 1.577 ms | 2.242 ms | 2.593 ms | 0.404 ms | 157.747 ms | 1 |
| **Loan Queries** | PASS | ✓ Within recommendation | 100 | 2.447 ms | 3.636 ms | 4.396 ms | 0.734 ms | 244.666 ms | 1 |
| **Reservation Queries** | PASS | ✓ Within recommendation | 100 | 1.679 ms | 2.426 ms | 2.788 ms | 0.429 ms | 167.867 ms | 1 |
| **Dashboard Aggregation** | PASS | ✓ Within recommendation | 100 | 1.973 ms | 5.806 ms | 7.644 ms | 1.395 ms | 197.287 ms | 6 |
| **Analytics Aggregation** | PASS | ✓ Within recommendation | 100 | 1.148 ms | 1.771 ms | 4.601 ms | 0.565 ms | 114.811 ms | 4 |
| **Reporting Queries** | PASS | ✓ Within recommendation | 100 | 4.498 ms | 6.035 ms | 8.755 ms | 3.167 ms | 449.772 ms | 4 |

## 3. Transaction Benchmarks

| Transaction | Benchmark Status | Performance Status | Commits (Success) | Rollbacks (Failures) | Retries | Success Rate | Commit Avg | Rollback Avg |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Borrow Book** | PASS | ✓ Within recommendation | 200 | 0 | 0 | 100.00% | 4.880 ms | 1.599 ms |
| **Return Book** | PASS | ✓ Within recommendation | 200 | 0 | 0 | 100.00% | 4.775 ms | 1.919 ms |
| **Renew Loan** | PASS | ✓ Within recommendation | 200 | 0 | 0 | 100.00% | 3.702 ms | 1.854 ms |
| **Reservation Creation** | PASS | ✓ Within recommendation | 200 | 0 | 0 | 100.00% | 3.750 ms | 1.811 ms |
| **Reservation Cancellation** | PASS | ✓ Within recommendation | 200 | 0 | 0 | 100.00% | 3.628 ms | 1.937 ms |
| **Review Creation** | PASS | ✓ Within recommendation | 100 | 100 | 0 | 50.00% | 5.740 ms | 0.000 ms |

## 4. Query Count & N+1 Analysis

| Benchmark | Total Queries | Duplicate Queries | Redundant Lookups | N+1 Risk | Excessive Round Trips |
| --- | --- | --- | --- | --- | --- |
| User Lookup | 1 | 0 | 0 | Low | No |
| Book Listing | 1 | 0 | 0 | Low | No |
| Book Search | 1 | 0 | 0 | Low | No |
| Loan Queries | 1 | 0 | 0 | Low | No |
| Reservation Queries | 1 | 0 | 0 | Low | No |
| Dashboard Aggregation | 6 | 0 | 0 | Low | ⚠ YES |
| Analytics Aggregation | 4 | 0 | 0 | Low | No |
| Reporting Queries | 4 | 0 | 0 | Low | No |

## 5. Slow Query Findings

| Query / Operation | Type | Severity | Metric / Value | Recommendation |
| --- | --- | --- | --- | --- |
| **BookCopy.findMany** | Potential Full Table Scan | **HIGH** | N/A | Avoid full table scans by adding a WHERE clause filtering on indexed columns. |
| **mock_book.findMany** | Slow Query | **MEDIUM** | Latency: 150.000 ms | Optimize database indexes, analyze query execution plan, or cache the result. |
| **mock_book.findMany** | Large Result Set | **MEDIUM** | Result Rows: 120 | Implement pagination (use skip and take) or select only necessary fields. |
| **loan.findMany** | Potential Full Table Scan | **HIGH** | N/A | Avoid full table scans by adding a WHERE clause filtering on indexed columns. |
| **bookCopy.findMany** | Potential Full Table Scan | **HIGH** | N/A | Avoid full table scans by adding a WHERE clause filtering on indexed columns. |
| **bookCopy.findMany** | Expensive Nested Joins | **MEDIUM** | Nested Depth: 3 | Flatten nested inclusions or execute split queries instead of loading multiple deep relations concurrently. |

## 6. Memory Analysis

| Benchmark Category | Heap Used Before | Heap Used After | Memory Growth |
| --- | --- | --- | --- |
| Query Benchmarks | 8.14 MB | 10.60 MB | 2.47 MB |
| Transaction Benchmarks | 10.62 MB | 33.08 MB | 22.46 MB |

## 7. Recommendations & Health Summary

### Overall Health Rating:
**NEEDS ATTENTION (B)** — Several operations contain potential full table scans or duplicate lookups that could degrade performance under high concurrency.

### Strategic Recommendations:
1. **Enforce Pagination**: Ensure all list lookups use bounded pagination arguments (`skip`, `take`) to prevent loading large tables into memory.
2. **Index Columns**: Add database indexes for query search columns (`isDeleted`, `title`, etc.) to resolve potential full table scans.
3. **Flatten Relations**: Where expensive nested joins are flagged, optimize select clauses or execute separate primary key fetches instead of deep includes.
