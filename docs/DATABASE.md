# Database Design Specification

AVELIS utilizes PostgreSQL as its primary relational engine, with database structure, relations, and migrations fully managed by Prisma ORM. 

---

## Architectural Principles

1. **Third Normal Form (3NF):** Data redundancy is minimized to guarantee updates, deletions, and additions are performed anomaly-free.
2. **UUID Primary Keys:** All tables utilize globally unique identifiers (UUID v4) for primary keys. This prevents ID enumeration attacks and ensures scalability.
3. **Explicit Junction Tables:** Many-to-many relationships (e.g. books and authors) are modeled using explicit junction entities to permit metadata extension.
4. **Referential Integrity:** Enforced at the database engine level via strict foreign keys.
5. **Index Strategy:** All foreign keys and frequently queried fields are indexed (using B-tree indexes) to optimize JOIN performance.

---

## Entity Relationship Diagram

![AVELIS ER Diagram](images/er-diagram.png)

*Figure 1: Full-resolution Database Schema (refer to docs/images/er-diagram.png for local image).*

---

## Database Tables

The database consists of **11 primary tables**:

| Table | Purpose |
| :--- | :--- |
| **User** | System accounts storing login credentials, status flags, and roles. |
| **Book** | Core metadata entries representing unique literature titles. |
| **Author** | Author details linked to books. |
| **Category** | Classification genres linked to books. |
| **BookAuthor** | Junction table modeling the Many-to-Many association of books to authors. |
| **BookCategory** | Junction table modeling the Many-to-Many association of books to categories. |
| **BookCopy** | Physical inventory tracking representing individual borrowable items. |
| **Loan** | Checkout transactions mapping a user to a specific copy of a book. |
| **Reservation** | Hold request queues for book copy allocations. |
| **Order** | Invoice header tracking direct book purchases. |
| **OrderItem** | Line-item details representing direct book purchase lines. |
| **Review** | User feedback rating and comments for books. |

---

## Business & Relational Integrity Rules

### 👥 User Rules
* **Uniqueness:** Username and email fields are constrained with global unique constraints.
* **Role Safety:** Self-deactivation or role demotion of the last remaining Admin account is blocked at the application level to prevent locking.

### 📚 Inventory & Lending Rules
* **Status Enforcement:** Individual physical copies of a book (`BookCopy`) track condition (NEW, GOOD, FAIR, DAMAGED) and availability (AVAILABLE, BORROWED, LOST, MAINTENANCE).
* **Checkout Limit:** A `BookCopy` can only be lent out if its status is `AVAILABLE`. Upon lending, its status shifts to `BORROWED`.
* **Soft Delete:** A `Book` cannot be permanently removed if active references (loans or orders) depend on it. Instead, a soft-delete field (`isDeleted`) hides the book from catalog searches.

### ⏳ Hold Queue Rules
* **Single Active Reservation:** A user can only place one active reservation hold per book. Enforced via composite unique key `(userId, bookId)` on active statuses.
* **Expiration Engine:** Active hold reservations expire after a pickup window has elapsed. The expiration engine automatically transitions expired records and reallocates the physical copy to the next pending user in the FIFO queue.

### ✍️ Review Limits
* **One Review per User:** A user can only review a book once. Relational integrity is enforced by a unique composite index `(userId, bookId)` on the `Review` table.
* **Rating Constraints:** Ratings must be integers between 1 and 5. Enforced via application validators and database validation rules.

---

## Schema Migrations

The database structure is maintained as code in the Prisma schema file:
* **Location:** `server/prisma/schema.prisma`
* **Workflow:** Schema updates must be executed using `npx prisma migrate dev`, producing incremental, version-controlled SQL files under `server/prisma/migrations/`.
