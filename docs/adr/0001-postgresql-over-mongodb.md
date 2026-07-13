# 1. PostgreSQL Relational System Selection

* **Status:** Approved
* **Date:** 2026-06-10

---

## Context & Problem

A Library Management System requires strict consistency, transaction boundaries, and complex relational mappings. We evaluated whether to use a Document Store (like MongoDB) or a Relational Database Management System (RDBMS) like PostgreSQL.

---

## Decision Criteria

1. **Transactional Integrity:** Checkouts, returns, and queue reservations must occur within ACID transactions to avoid double-borrowing or queue race conditions.
2. **Relational Consistency:** Strong foreign key constraints are needed to link users, copies, books, loans, and reviews.
3. **Normalization:** The database structure should follow Third Normal Form (3NF) to eliminate data redundancy.

---

## Decision

We chose **PostgreSQL** as the primary database engine. PostgreSQL provides robust transactional control (ACID compliance), advanced constraint checks, index capabilities, and rich relational mechanics that are native to library modeling.

---

## Consequences

* **Benefits:** Guaranteed consistency across loan checkouts, return completions, and reservation queue actions. Prevents anomalies (like a checked-out copy appearing as available).
* **Trade-offs:** Requires structured migrations for any schema changes. Requires explicit relational modeling and joining.
