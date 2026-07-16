# AVELIS Authentication Security Architecture Documentation

This document describes the authentication security configurations, JWT validations, middleware protections, and startup requirements implemented in Phase 13.6.2 for the AVELIS backend.

---

## 1. Environment differences Matrix

| Security Control | Development Mode | Production Mode |
| --- | :---: | :---: |
| **JWT Signature Validation** | ✓ Enforced | ✓ Enforced |
| **Algorithm Allow-list** | ✓ Enforced (`HS256`) | ✓ Enforced (`HS256` or custom) |
| **HSTS Integration** | ✗ Disabled | ✓ Enforced |
| **Issuer Validation** | Optional (If configured) | Optional (Recommended) |
| **Audience Validation** | Optional (If configured) | Optional (Recommended) |
| **Clock skew tolerance** | ✓ Supported (Default `0`) | ✓ Supported (Max 300s recommended) |
| **Advisory skews warnings** | ✓ Enabled ($>300\text{ s}$ warning) | ✓ Enabled ($>300\text{ s}$ warning) |
| **Startup validations** | ✓ Enforced (length/format/whitespace checks) | ✓ Enforced (length/format/whitespace checks) |

---

## 2. JWT Verification and Cryptographic Policy

1. **Algorithm Allow-list**: `jwt.verify()` is invoked with an explicit algorithms allow-list (`HS256`, `HS384`, `HS512`, `RS256`, `RS384`, `RS512`, `ES256`, `ES384`, `ES512`). Any token signed with `none` or an algorithm outside the configured list is rejected immediately.
2. **JWT Header Handling**: Header parsing relies on cryptographically secure verification. The `typ` header is treated as informational and is not required for successful verification to support interoperability with modern client libraries.
3. **Issuer and Audience Validation**: Environment validation of optional variables (`JWT_ISSUER` and `JWT_AUDIENCE`) prevents misconfiguration. They are sanitized and passed to `jwt.verify()` only when explicitly defined (avoiding `undefined` / `null` object properties).
4. **Sanitized Authentication Errors**: To prevent timing attacks and implementation leakages, all authentication errors in the middleware are caught and mapped to a single unified client-facing message: `"Invalid or expired authentication token"`.

---

## 3. Environment Variable Startup Validations

On application launch, the `validateEnv()` function immediately checks the environment variables:
* **`JWT_SECRET`**:
  * Must be present.
  * Must be at least 32 characters long.
  * Must not consist solely of whitespace characters (e.g. `"                                "` is blocked).
* **`JWT_EXPIRES_IN`**:
  * Must match the expected format regex: `/^(\d+)(ms|s|m|h|d|w|y)?$/i`.
* **`JWT_CLOCK_TOLERANCE`**:
  * Must be a non-negative integer.
  * If configured $> 300$ seconds, prints a startup warning recommending a lower value, but does not block launch.

---

## 4. Key Rotation and Extensibility

* **JWT Key Rotation Compatibility**: While key rotation is not active in this phase, the centralized `authSecurityConfig` is designed to support key identifiers (`kid`) or multiple keys dynamically. The verifier configuration can load keys based on header values without changing routing logic or middleware code.

---

## 5. Deployment and Secret Rotation Recommendations

1. **Secret Rotation Schedule**: Rotate the `JWT_SECRET` every 90 days.
2. **Entropy**: Always use cryptographically secure random values (e.g., `openssl rand -hex 32`) to generate secrets.
3. **Asymmetric Signatures**: If migrating to asymmetric validation (`RS256`, `ES256`), configure private/public keys, supply the public key to `JWT_SECRET`, and append `RS256`/`ES256` to `JWT_ALGORITHMS`.
