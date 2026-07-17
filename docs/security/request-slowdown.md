# AVELIS Request Slowdown & Abuse Mitigation

This document describes the request slowdown architecture, progressive delay algorithms, execution ordering, and configuration parameters implemented in Phase 13.6.5.3 for the AVELIS backend.

---

## 1. Request Slowdown Architecture

Request slowdown is powered by `express-slow-down`. It complements rate limiting by imposing progressive response delays (latencies) on clients making rapid consecutive requests, rather than blocking them entirely.

### Delay Ordering (Limiter before Slowdown)
To prevent server-side resource exhaustion, rate limiters run **before** slowdown middleware:
```
Request Normalization Middleware
        ↓
Global Rate Limiter (Immediate 429 block if threshold exceeded)
        ↓
Global Request Slowdown (Adds progressive latency delay if slowdown threshold exceeded)
        ↓
Authentication & Authorization Middleware
        ↓
Validators & Controllers
```
By placing the rate limiter first, requests exceeding hard boundaries are rejected immediately without paying any slowdown delay costs (no thread/event-loop timer allocation).

---

## 2. Slowdown Categories & Defaults

Slowdown limits are isolated in separate, non-interfering buckets:

1. **Global API (`globalSlowdown`)**:
   - `delayAfter`: `50` requests.
   - `delayMs`: `500` ms added per request above threshold.
   - `maxDelayMs`: `2000` ms ceiling.
   - Bypasses auth endpoints (`/api/v1/auth`), search queries (`GET /api/v1/books` or `GET /api/v1/books/search`), and reports/exports (`/api/v1/admin/dashboard/reports`) to maintain independent request buckets.
2. **Authentication (`authSlowdown`)**:
   - `delayAfter`: `5` requests.
   - `delayMs`: `1000` ms.
   - `maxDelayMs`: `5000` ms.
3. **Search (`searchSlowdown`)**:
   - `delayAfter`: `15` requests.
   - `delayMs`: `200` ms.
   - `maxDelayMs`: `2000` ms.
4. **Reports (`reportSlowdown`)**:
   - `delayAfter`: `10` requests.
   - `delayMs`: `500` ms.
   - `maxDelayMs`: `3000` ms.
5. **Exports (`exportSlowdown`)**:
   - `delayAfter`: `2` requests.
   - `delayMs`: `2000` ms.
   - `maxDelayMs`: `10000` ms.

---

## 3. Environment Overrides

Slowdown parameters can be customized via environment overrides:
- `GLOBAL_DELAY_AFTER`, `GLOBAL_DELAY_MS`, `GLOBAL_MAX_DELAY_MS`
- `AUTH_DELAY_AFTER`, `AUTH_DELAY_MS`, `AUTH_MAX_DELAY_MS`
- `SEARCH_DELAY_AFTER`, `SEARCH_DELAY_MS`, `SEARCH_MAX_DELAY_MS`
- `REPORT_DELAY_AFTER`, `REPORT_DELAY_MS`, `REPORT_MAX_DELAY_MS`
- `EXPORT_DELAY_AFTER`, `EXPORT_DELAY_MS`, `EXPORT_MAX_DELAY_MS`

> [!IMPORTANT]
> Zero values (`0`) are treated as invalid and fall back to safe default settings to prevent locking or bypassing progressive delays.
