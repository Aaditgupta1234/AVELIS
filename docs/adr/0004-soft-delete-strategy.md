# 4. Soft Delete Strategy for Books

* **Status:** Approved
* **Date:** 2026-07-06

---

## Context & Problem

Deleting a book from the catalog that has active borrows, past loans, or current reservation holds would result in database integrity errors (violating foreign key constraints) or data loss of historical records.

---

## Decision Criteria

1. **Relational Integrity:** Maintain historical loan audits and order details.
2. **Catalog Cleanliness:** Provide a mechanism to hide discontinued books from searches.
3. **Safety Guards:** Prevent accidental, irreversible loss of library metadata.

---

## Decision

We implemented a **Soft Delete Strategy** for the `Book` resource. The `Book` model contains an `isDeleted` boolean and a `deletedAt` timestamp. 
* Public lists and detail queries filter out soft-deleted items.
* Hard deletion is blocked unless the book has been first soft-deleted, serving as a two-step confirmation step.

---

## Consequences

* **Benefits:** Historical loan audits, payments, and order summaries remain fully integrated and referentially correct. Accidental clicks do not result in database data loss.
* **Trade-offs:** Requires checking the `isDeleted: false` condition on all public list queries.
