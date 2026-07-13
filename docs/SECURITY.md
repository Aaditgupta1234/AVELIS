# Security Architecture Specification

This document details the authentication models, access rules, data isolation parameters, and security hardening guidelines implemented in the AVELIS server application.

---

## Authentication & Authorization Model

AVELIS employs stateless, token-based authorization built on JSON Web Tokens (JWT) and Role-Based Access Control (RBAC):

* **Identity Verification:** Encrypted user passwords are verified using bcrypt securely without exposing plaintext credentials.
* **Token Issuer:** Authenticated sessions receive a signed JWT access token containing standard identity claims (`id`, `email`, `role`).
* **Protected Interceptors:** Token validations are handled by centralized interceptor middleware (`authMiddleware`) that decodes payloads, validates status flags, and attaches authenticated profiles to request contexts.

---

## Access Policy Matrix (RBAC)

AVELIS enforces two access roles: `MEMBER` and `ADMIN`:

| Feature Domain | Member Access | Admin Access | Authentication Type |
| :--- | :--- | :--- | :--- |
| **Catalog Browsing** | Read-Only | Read-Only | None (Public) |
| **Reviews & Ratings**| Read / Write | Moderation / Delete | JWT Authorized |
| **Lending Checkout** | Read / Write | Read / Write / Return | JWT Authorized |
| **Reservations Hold**| Read / Write | Full Manage Queue | JWT Authorized |
| **User Registries**  | Blocked | Read / Write | Admin Guarded |
| **Book Management**  | Blocked | Create / Update / Delete | Admin Guarded |

---

## Hardened Configurations

```mermaid
graph TD
    A[Hardened Security Layers] --> B[Helmet Headers]
    A --> C[CORS Policy]
    A --> D[Rate Limiting]
    A --> E[Trace Control]
    
    B --> B1[Content Security Policy]
    B --> B2[X-Frame-Options]
    
    C --> C1[Strict Origin Whitelist]
    
    D --> D1[API Limiters]
    
    E --> E1[No stack trace output for 4xx errors]
```

1. **Helmet HTTP Headers:** Integrated Helmet middleware to set security headers, mitigating Cross-Site Scripting (XSS), clickjacking, and mime-type sniffing attacks.
2. **Cross-Origin Resource Sharing (CORS):** Restricted to white-listed client origins, parsed dynamically from environment variables (`CORS_ORIGIN`).
3. **Rate Limiting:** Protects endpoints (like authentication paths) from brute-force attacks and resource exhaustion via `express-rate-limit` window rules.
4. **Conditional Trace Suppression:** Suppresses detailed error stack trace outputs in production mode for non-server client errors (errors `< 500`), avoiding stack disclosure.

---

## Vulnerability Reports

To report security vulnerabilities, please do not open public GitHub issues. Instead, contact the maintainers directly at their development email.
