# AVELIS Benchmark Index Report

> Generated: 2026-07-16T08:52:11.179Z

## Environment

| Field | Value |
| --- | --- |
| Benchmark Version | 1.0.0 |
| Node.js | v25.1.0 |
| Platform / Arch | win32 / x64 |
| Read Iterations | 1 |
| Write Iterations | 1 |

## Auth

| Endpoint | Tags | Avg | P95 | P99 | RPS | Success% | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| auth-register | write, public, database | 97.35 ms | 97.35 ms | 97.35 ms | 10.1 req/s | 100.00% | ✓ PASS |
| auth-login | read, public, database | 80.38 ms | 80.38 ms | 80.38 ms | 12.4 req/s | 100.00% | ✓ PASS |

## Books

| Endpoint | Tags | Avg | P95 | P99 | RPS | Success% | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| books-list | read, public, database | 9.28 ms | 9.28 ms | 9.28 ms | 103.8 req/s | 100.00% | ✓ PASS |
| books-get | read, public, database | 7.38 ms | 7.38 ms | 7.38 ms | 129.2 req/s | 100.00% | ✓ PASS |
| books-search | read, public, database | 11.53 ms | 11.53 ms | 11.53 ms | 80.2 req/s | 100.00% | ✓ PASS |
| books-rating | read, public, database | 10.80 ms | 10.80 ms | 10.80 ms | 90.0 req/s | 100.00% | ✓ PASS |

## Loans

| Endpoint | Tags | Avg | P95 | P99 | RPS | Success% | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| loans-list | read, authenticated, admin, database | 9.65 ms | 9.65 ms | 9.65 ms | 97.3 req/s | 100.00% | ✓ PASS |
| loans-active | read, authenticated, member, database | 6.43 ms | 6.43 ms | 6.43 ms | 148.9 req/s | 100.00% | ✓ PASS |
| loans-history | read, authenticated, member, database | 7.68 ms | 7.68 ms | 7.68 ms | 121.8 req/s | 100.00% | ✓ PASS |
| loans-get-by-id | read, authenticated, admin, database | 6.13 ms | 6.13 ms | 6.13 ms | 154.3 req/s | 100.00% | ✓ PASS |
| loans-borrow | write, authenticated, member, database, transaction | 15.81 ms | 15.81 ms | 15.81 ms | 44.6 req/s | 100.00% | ✓ PASS |
| loans-return | write, authenticated, member, database, transaction | 13.33 ms | 13.33 ms | 13.33 ms | 54.9 req/s | 100.00% | ✓ PASS |
| loans-renew | write, authenticated, member, database | 15.35 ms | 15.35 ms | 15.35 ms | 44.7 req/s | 100.00% | ✓ PASS |

## Reservations

| Endpoint | Tags | Avg | P95 | P99 | RPS | Success% | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| reservations-list | read, authenticated, admin, database | 6.75 ms | 6.75 ms | 6.75 ms | 143.6 req/s | 100.00% | ✓ PASS |
| reservations-mine | read, authenticated, member, database | 5.75 ms | 5.75 ms | 5.75 ms | 164.6 req/s | 100.00% | ✓ PASS |
| reservations-get | read, authenticated, member, database | 3.36 ms | 3.36 ms | 3.36 ms | 282.5 req/s | 100.00% | ✓ PASS |
| reservations-create | write, authenticated, member, database | 18.55 ms | 18.55 ms | 18.55 ms | 40.9 req/s | 100.00% | ✓ PASS |
| reservations-cancel | write, authenticated, member, database | 11.41 ms | 11.41 ms | 11.41 ms | 65.8 req/s | 100.00% | ✓ PASS |

## Reviews

| Endpoint | Tags | Avg | P95 | P99 | RPS | Success% | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| reviews-book | read, authenticated, member, database | 6.89 ms | 6.89 ms | 6.89 ms | 139.4 req/s | 100.00% | ✓ PASS |
| reviews-mine | read, authenticated, member, database | 8.01 ms | 8.01 ms | 8.01 ms | 121.0 req/s | 100.00% | ✓ PASS |
| reviews-get | read, authenticated, member, database | 6.17 ms | 6.17 ms | 6.17 ms | 155.5 req/s | 100.00% | ✓ PASS |
| reviews-create | write, authenticated, member, database | 8.88 ms | 8.88 ms | 8.88 ms | 83.3 req/s | 100.00% | ✓ PASS |
| reviews-rating | read, public, database | 8.16 ms | 8.16 ms | 8.16 ms | 119.6 req/s | 100.00% | ✓ PASS |

## Dashboard

| Endpoint | Tags | Avg | P95 | P99 | RPS | Success% | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| dashboard-summary | read, authenticated, admin, analytics, database | 7.89 ms | 7.89 ms | 7.89 ms | 124.6 req/s | 100.00% | ✓ PASS |
| dashboard-analytics | read, authenticated, admin, analytics, database | 1.34 ms | 1.34 ms | 1.34 ms | 677.2 req/s | 0.00% | ✗ FAIL |

## Analytics

| Endpoint | Tags | Avg | P95 | P99 | RPS | Success% | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| analytics-borrowing | read, authenticated, admin, analytics, database | 16.68 ms | 16.68 ms | 16.68 ms | 59.4 req/s | 100.00% | ✓ PASS |
| analytics-members | read, authenticated, admin, analytics, database | 4.12 ms | 4.12 ms | 4.12 ms | 233.5 req/s | 100.00% | ✓ PASS |
| analytics-ratings | read, authenticated, admin, analytics, database | 6.26 ms | 6.26 ms | 6.26 ms | 154.6 req/s | 100.00% | ✓ PASS |
| analytics-timeseries | read, authenticated, admin, analytics, database | 4.17 ms | 4.17 ms | 4.17 ms | 230.1 req/s | 100.00% | ✓ PASS |

## Reports

| Endpoint | Tags | Avg | P95 | P99 | RPS | Success% | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| reports-overdue | read, authenticated, admin, database | 3.57 ms | 3.57 ms | 3.57 ms | 269.8 req/s | 100.00% | ✓ PASS |
| reports-inventory | read, authenticated, admin, database | 6.12 ms | 6.12 ms | 6.12 ms | 159.3 req/s | 100.00% | ✓ PASS |
| reports-member | read, authenticated, admin, database | 11.11 ms | 11.11 ms | 11.11 ms | 88.0 req/s | 100.00% | ✓ PASS |
| reports-search-books | read, authenticated, admin, database | 4.38 ms | 4.38 ms | 4.38 ms | 218.7 req/s | 100.00% | ✓ PASS |

---

## Summary

| Metric | Value |
| --- | --- |
| Total Endpoints | 33 |
| Passed | 32 |
| Failed | 1 |
