# 2. Prisma ORM Selection

* **Status:** Approved
* **Date:** 2026-06-12

---

## Context & Problem

Writing raw SQL queries or mapping relational results manually introduces code overhead, lack of type safety, and prone-to-error migration lifecycles. We evaluated options like Sequelize, TypeORM, and Prisma ORM.

---

## Decision Criteria

1. **Type Safety:** The data access layer should integrate cleanly with Javascript/Typescript structures.
2. **Schema Declarations:** The database schema must be documented in a single, readable source of truth.
3. **Migration Management:** Schema updates must be version-controlled and repeatable.

---

## Decision

We selected **Prisma ORM** as the database mapping layer. Prisma uses a unified schema file (`schema.prisma`) to generate a type-safe client client, handles database relations, and automates schema migrations through structured SQL scripts.

---

## Consequences

* **Benefits:** Speeds up development, guarantees model structures on requests, and provides automatic generation of database clients with index mappings.
* **Trade-offs:** Adds an abstraction layer. Deep nested queries (like reviews with book details and user info) must be modeled using selective inclusion options.
