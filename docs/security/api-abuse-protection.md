# AVELIS API Abuse Protection Configuration

This document specifies the rate limiting, request size limits, startup validations, and environment variable configuration structure implemented for the AVELIS backend.

---

## 1. Centralized Configuration Files

* **Rate Limiting**: Configured under [rate-limit.config.js](file:///f:/Vscode/Anveli/server/src/config/rate-limit.config.js) and exported as `rateLimitConfig`.
* **Payload size limits**: Configured under [request-limit.config.js](file:///f:/Vscode/Anveli/server/src/config/request-limit.config.js) and exported as `requestLimitConfig`.
* Config settings are barrel-exported from [index.js](file:///f:/Vscode/Anveli/server/src/config/index.js).

---

## 2. Environment Variables Overrides Reference

### Rate Limiting Variables

| Environment Override | Purpose | Secure Default | Acceptable Bounds |
| --- | --- | --- | --- |
| `GLOBAL_WINDOW_MS` | Global API time window (ms) | `900000` (15m) | $\ge 1$ |
| `GLOBAL_RATE_LIMIT` | Global API limit | `100` | $\ge 1$ |
| `AUTH_WINDOW_MS` | Auth endpoint time window (ms) | `900000` (15m) | $\ge 1$ |
| `AUTH_RATE_LIMIT` | Auth endpoint limit | `10` | $\ge 1$ |
| `SEARCH_WINDOW_MS` | Search endpoint time window (ms) | `60000` (1m) | $\ge 1$ |
| `SEARCH_RATE_LIMIT`| Search endpoint limit | `30` | $\ge 1$ |
| `REPORT_WINDOW_MS` | Report endpoint time window (ms) | `900000` (15m) | $\ge 1$ |
| `REPORT_RATE_LIMIT`| Report endpoint limit | `20` | $\ge 1$ |
| `EXPORT_WINDOW_MS` | Export endpoint time window (ms) | `3600000` (1h) | $\ge 1$ |
| `EXPORT_RATE_LIMIT`| Export endpoint limit | `5` | $\ge 1$ |
| `TRUST_PROXY`      | Express proxy trust setting | `false` | Boolean, Int, or reserved keyword |

### Request Slowdown Variables

| Environment Override | Purpose | Secure Default | Acceptable Bounds |
| --- | --- | --- | --- |
| `ENABLE_SLOWDOWN` | Enable request delay throttling | `true` | Boolean (`true`/`false`) |
| `GLOBAL_DELAY_AFTER` | Global API slowdown request threshold | `50` | $\ge 1$ |
| `GLOBAL_DELAY_MS` | Global API delay added per request (ms) | `500` | $\ge 1$ |
| `GLOBAL_MAX_DELAY_MS` | Global API maximum delay ceiling (ms) | `2000` | $\ge 1$ |
| `AUTH_DELAY_AFTER` | Auth endpoint slowdown request threshold | `5` | $\ge 1$ |
| `AUTH_DELAY_MS` | Auth endpoint delay added per request (ms) | `1000` | $\ge 1$ |
| `AUTH_MAX_DELAY_MS` | Auth endpoint maximum delay ceiling (ms) | `5000` | $\ge 1$ |
| `SEARCH_DELAY_AFTER` | Search endpoint slowdown request threshold | `15` | $\ge 1$ |
| `SEARCH_DELAY_MS` | Search endpoint delay added per request (ms) | `200` | $\ge 1$ |
| `SEARCH_MAX_DELAY_MS`| Search endpoint maximum delay ceiling (ms) | `2000` | $\ge 1$ |
| `REPORT_DELAY_AFTER` | Report endpoint slowdown request threshold | `10` | $\ge 1$ |
| `REPORT_DELAY_MS` | Report endpoint delay added per request (ms) | `500` | $\ge 1$ |
| `REPORT_MAX_DELAY_MS`| Report endpoint maximum delay ceiling (ms) | `3000` | $\ge 1$ |
| `EXPORT_DELAY_AFTER` | Export endpoint slowdown request threshold | `2` | $\ge 1$ |
| `EXPORT_DELAY_MS` | Export endpoint delay added per request (ms) | `2000` | $\ge 1$ |
| `EXPORT_MAX_DELAY_MS`| Export endpoint maximum delay ceiling (ms) | `10000` | $\ge 1$ |

### Payload Size Limits

| Environment Override | Purpose | Secure Default | Acceptable Format Pattern |
| --- | --- | --- | --- |
| `MAX_JSON_SIZE` | Max JSON request size limit | `1mb` | `/^[1-9]\d*(?:\s*(?:b\|kb\|mb\|gb\|tb))?$/i` |
| `MAX_URLENCODED_SIZE`| Max URL encoded request limit | `1mb` | `/^[1-9]\d*(?:\s*(?:b\|kb\|mb\|gb\|tb))?$/i` |
| `MAX_TEXT_SIZE` | Max plain text request limit | `100kb` | `/^[1-9]\d*(?:\s*(?:b\|kb\|mb\|gb\|tb))?$/i` |
| `MAX_RAW_SIZE` | Max raw binary request limit | `100kb` | `/^[1-9]\d*(?:\s*(?:b\|kb\|mb\|gb\|tb))?$/i` |

### CORS Configuration

| Environment Override | Purpose | Secure Default | Acceptable Format Pattern |
| --- | --- | --- | --- |
| `CORS_MAX_AGE` | CORS preflight preflight caching duration (seconds) | `86400` (24h) | Positive integer $\ge 1$ |

---

## 3. Startup Validation and Fallback Strategy

To guarantee server uptime, all configuration parameters undergo validation during app startup:
1. **Trimming & Cleaning**: String boundaries are trimmed of whitespaces.
2. **Rate Limit & Slowdown Bounds check**:
   - Time windows, request limits, delay thresholds, and delay increments are parsed to numbers.
   - If any value is non-integer, negative, zero (`0`), `NaN`, `Infinity`, or an empty string, the configuration triggers a warning message and falls back to the secure defaults listed above.
3. **Payload Size string checks**:
   - Verified using the Express body-parser size pattern.
   - Malformed, zero, negative, or invalid formats default back to secure production constants.
4. **CORS preflight cache check**:
   - `CORS_MAX_AGE` is parsed as an integer. Invalid, non-integer, zero, negative, `NaN`, `Infinity` or empty values fall back to `86400`.
5. **Proxy Trust check**:
   - Accepts boolean forms, integer hop counts, Express reserved terms (`'loopback'`, `'linklocal'`, `'uniquelocal'`), or comma-separated lists of subnets. Non-compliant overrides drop back to `false`.
6. **Deep-Freeze Immutability**:
   - Objects are recursively deep-frozen before exporting to prevent runtime mutation by other application dependencies.
