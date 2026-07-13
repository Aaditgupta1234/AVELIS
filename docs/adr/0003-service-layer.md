# 3. Layered Service Pattern Selection

* **Status:** Approved
* **Date:** 2026-06-15

---

## Context & Problem

In standard Node.js API structures, developers often put business rules directly inside routes or controllers, making the codebase difficult to test, maintain, or adapt to alternate entry points (like CLI scripts or cron queues).

---

## Decision Criteria

1. **Testability:** Business rules must be testable in isolation from HTTP requests, headers, and responses.
2. **Separation of Concerns:** Controllers should remain thin, mapping request validation and JSON responses only.
3. **Reusability:** Common operations (like loan returns or hold expirations) should be accessible from multiple controllers or cron schedulers.

---

## Decision

We chose to implement the **Layered Service Pattern**. All core business decisions, calculations, queue allocations, and database queries are encapsulated inside dedicated service modules (e.g. `loan.service.js`). HTTP Controllers import and call these service layers.

---

## Consequences

* **Benefits:** Extreme code isolation. Makes testing easy (services are called directly with Javascript parameters). Thin controllers are simple to debug.
* **Trade-offs:** Increases the number of source files and function forwards. Requires strict adherence to patterns (controllers must never invoke Prisma client directly).
