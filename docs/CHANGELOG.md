# Changelog

All notable changes to the AVELIS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v0.9.5-backend] - 2026-07-13

Documentation overhaul and request pipeline/middleware optimizations.

### Optimized
* **Centralized Validators:** Created pure `validation.helper.js` validating UUIDs/emails without inline regex overhead.
* **Token Extraction:** Replaced `split(' ')` with `slice(7)` for Bearer JWT strings to avoid array allocations.
* **Error Trace Suppression:** Configured `ApiError` to only capture stack traces in development or for server-side error statuses (>= 500).
* **Constant Hoisting:** Hoisted role validations and email checking arrays to module-level scopes, avoiding garbage collection overhead.
* **Database Lifecycles:** Established a singleton connection lifecycle instance for Prisma Client and defined transaction timeouts.
* **Structured Logger:** Integrated a custom structured logger with lazy Winston formatters.

---

## [v0.9.0-backend] - 2026-07-11

Feature-complete library management system backend.

### Added
* **Review Ratings Aggregation:** Calculated average ratings and categorization distribution arrays for book entries.
* **Reviews and Commenting:** Endpoints allowing members to review borrow histories and admins to moderate reviews.
* **Reservations Management:** Hold placement queues, FIFO copy allocation helpers, and automatic reservation expiration cleanup hooks.
* **Lending Checkout System:** Checked out and checked in book copies, tracked overdue loans, and integrated overdue fine sync operations.
* **Book Management:** Implemented soft-delete, restore, and permanent deletion pipelines for catalog books.
* **User Profiles:** Secure profile fetching, password modifications, and admin user registry lists.
* **Token Authentication:** Secure registration and token-based JWT authentication utilizing bcrypt password hashes.
* **Layered Express Structure:** Layered folder architecture (Routes → Validators → Middleware → Controllers → Services → ORM).
* **Prisma Schema:** Configured normalized database tables and version-controlled SQL migrations using Prisma ORM.

---

## [v0.1.0-frontend] - 2026-06-15

Initial high-fidelity landing page and scaffolding.

### Added
* **Landing Interface:** Immersive UI page featuring dark themes and responsive layouts.
* **Scaffolding:** Scaffolded React 19 single-page application using Vite and Tailwind CSS.
* **Component System:** Created modular layout components, adaptive navigations, and Framer Motion micro-interactions.
* **Journal Interfaces:** Scaffolded dashboard layouts, reading journal logging logs, and book catalog collections.
