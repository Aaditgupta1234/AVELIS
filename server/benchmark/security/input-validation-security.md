# AVELIS Input Validation & Request Security Architecture Documentation

This document describes the request normalization pipeline, sanitization rules, and validation mechanisms implemented in Phase 13.6.4 for the AVELIS backend.

---

## 1. Request Normalization & Sanitization Pipeline

The request lifecycle is secured in a strict sequential order:
```
Express body parser
        ↓
Normalization middleware (clones and sanitizes inputs)
        ↓
Validation middleware (module schema validators)
        ↓
Authentication middleware (JWT validation)
        ↓
Authorization middleware (RBAC / Ownership)
        ↓
Controllers
        ↓
Services
        ↓
Prisma (Database access)
```

---

## 2. Sanitization Policies

All input sanitization is non-mutating and performs deep-cloning:
1. **String Normalization**:
   - Applies Unicode `String.prototype.normalize('NFC')` to string values only (never modifies binary objects, Buffers, or streams).
   - Trims leading and trailing whitespace.
   - Filters out non-printable ASCII control characters while preserving valid whitespace formatting (`\n`, `\r`, `\t`).
2. **Search Normalization**:
   - Filters control characters, trims leading/trailing spaces, and collapses consecutive spaces into a single space (e.g. `"Harry      Potter"` $\rightarrow$ `"Harry Potter"`).
3. **Circular Reference Protection**:
   - Sanitizer tracks visited objects using a `WeakSet` to avoid infinite loops or memory overflow during recursive sanitization.
4. **Prototype Pollution Protection**:
   - Recursively deletes properties named `__proto__`, `constructor`, and `prototype` on all plain objects, nested objects, and arrays of objects.

---

## 3. Shared Validation Layer

The shared validators under [request.validation.js](file:///f:/Vscode/Anveli/server/src/utils/request.validation.js) provide structural constraints:
* **Strict Integer Pagination**: page and limit queries are cast and evaluated strictly as integers. Floats, booleans, objects, arrays, `NaN`, and `Infinity` are rejected. Page size is capped at `MAX_LIMIT`.
* **Sort fields allow-list**: Unknown sort fields are immediately rejected at the validation layer to block SQL injection vectors.
* **Array validations**: Configurable options for duplicate policies (`allow`, `reject`, or `deduplicate`) and max length limits.
* **RFC4122 UUID validation**: Generic pattern check to support multiple UUID versions.

---

## 4. Configuration Matrix (validation.security.config.js)

| Parameter | Secure Fallback Constant | Overridable | Critical (Startup Abort) |
| --- | :---: | :---: | :---: |
| `DEFAULT_PAGE` | `1` | Yes | No |
| `DEFAULT_LIMIT` | `10` | Yes | No |
| `MAX_LIMIT` | `100` | Yes | No |
| `MAX_SEARCH_LENGTH` | `100` | Yes | No |
| `MAX_ARRAY_LENGTH` | `100` | Yes | No |
| `MAX_STRING_LENGTH` | `1000` | Yes | No |
| `UUID_REGEX` | RFC4122 Compliant | No | Yes (Key structures) |
