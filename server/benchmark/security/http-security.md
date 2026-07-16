# AVELIS HTTP Security Audit and Hardening Documentation

This document summarizes the HTTP-layer security architecture, security headers, and Express middleware configurations implemented in Phase 13.6.1 for the AVELIS backend.

---

## 1. Environment Differences Matrix

The security policies are environment-aware, enforcing strict policies in production while keeping local development flexible.

| HTTP Security Protection | Development Mode | Production Mode |
| --- | :---: | :---: |
| **Content Security Policy (CSP)** | ✓ Enabled (Defaults) | ✓ Enabled (With `upgrade-insecure-requests`) |
| **HTTP Strict Transport Security (HSTS)** | ✗ Disabled (Prevents routing issues) | ✓ Enabled (`max-age: 31536000`, Subdomains, Preload) |
| **X-Frame-Options (Clickjacking)** | ✓ Enabled (`DENY`) | ✓ Enabled (`DENY`) |
| **X-Content-Type-Options (MIME Sniffing)** | ✓ Enabled (`nosniff`) | ✓ Enabled (`nosniff`) |
| **Referrer-Policy** | ✓ Enabled (`strict-origin-when-cross-origin`) | ✓ Enabled (`strict-origin-when-cross-origin`) |
| **Permissions-Policy** | ✓ Enabled (Disables unused features) | ✓ Enabled (Disables unused features) |
| **Cross-Origin Policies (COOP/COEP/CORP)** | ✓ Enabled (Flexible) | ✓ Enabled (Strict `same-origin`) |
| **X-Powered-By Header (Fingerprinting)** | ✓ Removed (Hidden) | ✓ Removed (Hidden) |

---

## 2. Configured HTTP Security Headers

### Content Security Policy (CSP)
* **Header**: `Content-Security-Policy`
* **Purpose**: Prevents Cross-Site Scripting (XSS), data injection, and clickjacking attacks by dictating which dynamic resources are allowed to load.
* **Configured Directives**:
  * `default-src`: `["'self'"]`
  * `script-src`: `["'self'"]` (Supports environment override `CSP_SCRIPT_SRC`)
  * `style-src`: `["'self'", "'unsafe-inline'"]` (Supports environment override `CSP_STYLE_SRC`)
  * `connect-src`: `["'self'"]` (Supports environment override `CSP_CONNECT_SRC`)
  * `img-src`: `["'self'", "data:"]` (Supports environment override `CSP_IMG_SRC`)
  * `font-src`: `["'self'"]` (Supports environment override `CSP_FONT_SRC`)
  * `object-src`: `["'none'"]`
  * `frame-ancestors`: `["'none'"]` (Supports environment override `CSP_FRAME_ANCESTORS`)
  * `base-uri`: `["'self'"]`
  * `form-action`: `["'self'"]`
  * `upgrade-insecure-requests`: Emitted only in production to upgrade HTTP requests to HTTPS.
* **Override Validation & Default Fallbacks**:
  If a CSP override environment variable (e.g. `CSP_SCRIPT_SRC`) is provided, it is parsed by splitting on commas, trimming tokens, and filtering out empty or whitespace-only elements.
  If the parsed override is absent, evaluates to empty, or does not result in a non-empty array of strings, the system defensively falls back to secure default configurations.

### HTTP Strict Transport Security (HSTS)
* **Header**: `Strict-Transport-Security`
* **Purpose**: Instructs browsers to interact with the server using HTTPS exclusively.
* **Configuration**: `max-age=31536000; includeSubDomains; preload`
* **HSTS Environment-Awareness**: HSTS is enabled only in production (`NODE_ENV === 'production'`) or when overridden (`ENABLE_HSTS === 'true'`). It is disabled in development to prevent localhost routing lockouts.

### Referrer Policy
* **Header**: `Referrer-Policy`
* **Purpose**: Regulates what referrer information is sent along with requests.
* **Configuration**: `strict-origin-when-cross-origin` (sends full URL when performing same-origin requests, but only the domain origin under cross-origin HTTPS requests).

### Permissions Policy
* **Header**: `Permissions-Policy`
* **Purpose**: Restricts browser access to physical device sensors, cameras, and payment APIs.
* **Configuration**: `camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=()` (all are fully disabled).

### X-Frame Protection
* **Header**: `X-Frame-Options`
* **Purpose**: Prevents clickjacking by blocking browsers from embedding the site in frames.
* **Configuration**: `DENY` (supported by `frame-ancestors: 'none'` in CSP).

### MIME Sniffing Protection
* **Header**: `X-Content-Type-Options`
* **Purpose**: Prevents browsers from guessing/sniffing content types away from the declared Content-Type header.
* **Configuration**: `nosniff`

### Express Fingerprinting Removal
* **Header**: `X-Powered-By`
* **Purpose**: Avoids exposing technology stack details to automated scanners.
* **Configuration**: Header is completely removed.

---

## 3. Deployment and Infrastructure Recommendations

1. **SSL/TLS Termination**: Security headers are set by the Node application layer, but it is highly recommended to enforce TLS termination at the load-balancer or Nginx proxy level (e.g., configuring HTTP/2, disabling TLS v1.0/v1.1, and using modern cipher suites).
2. **Reverse Proxy Sync**: Ensure upstream proxies (like Cloudflare, AWS ALB, Nginx) do not strip security headers set by the backend server.
3. **CSP Review Cadence**: Periodically audit CSP directives when introducing new third-party integrations (CDNs, analytics, or external font/image resources).
