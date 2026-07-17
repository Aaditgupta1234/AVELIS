# AVELIS Rate Limiting Architecture

This document describes the rate-limiting architecture, bucket configurations, error response formats, and proxy settings implemented in Phase 13.6.5.2 for the AVELIS backend.

---

## 1. Rate Limiting Categories & Configuration Hierarchy

Rate limits are configured under [rate-limit.config.js](file:///f:/Vscode/Anveli/server/src/config/rate-limit.config.js) and executed as Express middleware:

1. **Global API Rate Limiter (`globalRateLimiter`)**:
   - Time window: `15 minutes`
   - Maximum requests: `100`
   - Bypasses requests destined for Auth endpoints (`/api/v1/auth`), Search queries (`GET /api/v1/books` or `GET /api/v1/books/search`), and Reports/Exports (`/api/v1/admin/dashboard/reports`) to maintain independent request buckets.
2. **Authentication Rate Limiter (`authRateLimiter`)**:
   - Time window: `15 minutes`
   - Maximum requests: `10`
   - Applied to registration and login routes.
3. **Search Rate Limiter (`searchRateLimiter`)**:
   - Time window: `1 minute`
   - Maximum requests: `30`
   - Applied to book search/catalog endpoints.
4. **Reports Rate Limiter (`reportRateLimiter`)**:
   - Time window: `15 minutes`
   - Maximum requests: `20`
   - Applied to administrative reports endpoints.
5. **Export Rate Limiter (`exportRateLimiter`)**:
   - Time window: `1 hour`
   - Maximum requests: `5`
   - Applied to reports exports endpoints.

---

## 2. Standardized Rate Limit Response

All limiters return a standardized `HTTP 429 Too Many Requests` JSON response:
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```
No configuration settings, retry estimations, or internal bucket metadata are exposed in the JSON body.

---

## 3. Standards-Compliant Headers

Standard `RateLimit-*` headers are enabled to inform client integrations of current usage limits:
- `RateLimit-Limit`: Maximum requests permitted per window.
- `RateLimit-Remaining`: Remaining request quota.
- `RateLimit-Reset`: Time left in seconds before the window resets.

Deprecated legacy `X-RateLimit-*` headers are disabled (`legacyHeaders: false`) to minimize overhead.

---

## 4. Trust Proxy & Reverse Proxies Deployment

Client IP address determination is routed directly through Express's native `trust proxy` setting:
```javascript
app.set('trust proxy', rateLimitConfig.TRUST_PROXY);
```
This is configured during server startup. Depending on deployment environments:
- **Direct**: Set `TRUST_PROXY=false`.
- **Behind a load balancer (e.g. AWS ALB)**: Set `TRUST_PROXY=1` (or hop count).
- **Local reverse proxies**: Set `TRUST_PROXY=loopback`.
- **Custom networks**: Set `TRUST_PROXY="10.0.0.0/8, 192.168.0.0/16"`.
This guarantees client IP integrity and prevents IP spoofing vectors.
