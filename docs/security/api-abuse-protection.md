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
| `ENABLE_SLOWDOWN`  | Enable request delay throttling | `true` | Boolean (`true`/`false`) |
| `TRUST_PROXY`      | Express proxy trust setting | `false` | Boolean, Int, or reserved keyword |

### Payload Size Limits

| Environment Override | Purpose | Secure Default | Acceptable Format Pattern |
| --- | --- | --- | --- |
| `MAX_JSON_SIZE` | Max JSON request size limit | `1mb` | `/^[1-9]\d*(?:\s*(?:b\|kb\|mb\|gb\|tb))?$/i` |
| `MAX_URLENCODED_SIZE`| Max URL encoded request limit | `1mb` | `/^[1-9]\d*(?:\s*(?:b\|kb\|mb\|gb\|tb))?$/i` |
| `MAX_TEXT_SIZE` | Max plain text request limit | `100kb` | `/^[1-9]\d*(?:\s*(?:b\|kb\|mb\|gb\|tb))?$/i` |
| `MAX_RAW_SIZE` | Max raw binary request limit | `100kb` | `/^[1-9]\d*(?:\s*(?:b\|kb\|mb\|gb\|tb))?$/i` |

---

## 3. Startup Validation and Fallback Strategy

To guarantee server uptime, all configuration parameters undergo validation during app startup:
1. **Trimming & Cleaning**: String boundaries are trimmed of whitespaces.
2. **Rate Limit Bounds check**:
   - Time windows and request limits are parsed to numbers.
   - If any value is non-integer, negative, zero (`0`), `NaN`, `Infinity`, or an empty string, the configuration triggers a warning message and falls back to the secure defaults listed above.
3. **Payload Size string checks**:
   - Verified using the Express body-parser size pattern.
   - Malformed, zero, negative, or invalid formats default back to secure production constants.
4. **Proxy Trust check**:
   - Accepts boolean forms, integer hop counts, Express reserved terms (`'loopback'`, `'linklocal'`, `'uniquelocal'`), or comma-separated lists of subnets. Non-compliant overrides drop back to `false`.
5. **Deep-Freeze Immutability**:
   - Objects are recursively deep-frozen before exporting to prevent runtime mutation by other application dependencies.
