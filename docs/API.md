# API Reference Specification

This document provides a concise overview of all RESTful API endpoints available in the AVELIS library system. 

---

## Global API Schema

* **Base URL:** `/api/v1`
* **Response Envelope Format:**
  * **Success:** `{ "success": true, "message": "...", "data": { ... } }`
  * **Failure:** `{ "success": false, "message": "...", "errors": [ { "field": "...", "message": "..." } ] }`
* **Authentication Scheme:** JSON Web Tokens (JWT) passed via the `Authorization` header as a Bearer token: `Authorization: Bearer <token>`.

---

## Endpoint Registry

### 🔐 Authentication Module

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| **POST** | `/auth/register` | Register a new member or administrator account. | Public |
| **POST** | `/auth/login` | Authenticate credentials and return JWT access token. | Public |
| **GET** | `/auth/me` | Fetch active user profile from auth token. | Authenticated |
| **POST** | `/auth/logout` | Revoke/clear active session token. *(Scaffolded)* | Authenticated |

### 👤 User Module

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| **GET** | `/users/me` | Retrieve profile metadata of the logged-in user. | Authenticated |
| **PATCH** | `/users/me` | Update current user profile username. | Authenticated |
| **PATCH** | `/users/me/password` | Securely change current user's password. | Authenticated |

### 📚 Book Catalog Module

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| **GET** | `/books` | Retrieve paginated catalog listing with search/sort. | Public |
| **GET** | `/books/:id` | Retrieve metadata details of a specific book. | Public |
| **POST** | `/books` | Create a new catalog book entry. | Admin Only |
| **PATCH** | `/books/:id` | Update metadata fields for an existing book. | Admin Only |
| **DELETE** | `/books/:id` | Soft delete a book (hides from public catalog). | Admin Only |
| **PATCH** | `/books/:id/restore` | Reintegrate a soft-deleted book. | Admin Only |
| **DELETE** | `/books/:id/permanent` | Physically remove a soft-deleted book. | Admin Only |

> [!NOTE]
> **Soft-Delete Lifecycle:** Books follow a managed deletion lifecycle (`Active ⇄ Soft Deleted → Permanently Deleted`). A book must be soft-deleted before permanent deletion is permitted, protecting historical references like loans.

### 📋 Loans Module

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| **GET** | `/loans` | Retrieve paginated, sorted, and filtered loans list. | Admin Only |
| **POST** | `/loans` | Checkout a book copy (creates a loan). | Authenticated |
| **POST** | `/loans/:id/return` | Process return of a book copy. | Admin Only |
| **PATCH** | `/loans/:id/return` | Process return of a book copy. (Alternate Route) | Admin Only |
| **GET** | `/loans/:id` | Retrieve detailed transaction records. | Owner / Admin |
| **GET** | `/loans/me` | Retrieve paginated list of logged-in user's loans. | Authenticated |
| **POST** | `/loans/overdue/sync` | Sync overdue status and calculate fine records. | Admin Only |

### ⏳ Reservations Module

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| **POST** | `/reservations` | Place a reservation hold on a book. | Authenticated |
| **GET** | `/reservations/:id` | Retrieve reservation transaction details. | Owner / Admin |
| **GET** | `/reservations/me` | List active holds for the logged-in member. | Authenticated |
| **PATCH** | `/reservations/:id/cancel` | Cancel an active hold reservation. | Owner / Admin |
| **GET** | `/reservations` | Retrieve all reservation queues. | Admin Only |

### ✍️ Reviews Module

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| **POST** | `/reviews` | Submit rating & comments for a book copy. | Member Only |
| **GET** | `/reviews/:reviewId` | Retrieve detailed feedback metrics. | Member Only |
| **GET** | `/reviews/book/:bookId` | Retrieve catalog reviews for a book. | Member Only |
| **GET** | `/reviews/me` | Retrieve all reviews submitted by logged-in user. | Member Only |
| **PATCH** | `/reviews/:reviewId` | Modify rating or description in a review. | Member Only |
| **DELETE** | `/reviews/:reviewId` | Delete a review. | Member Only |
| **GET** | `/books/:bookId/rating` | Retrieve aggregated rating stats for a book. | Public |

### 📊 Administration & Metrics

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| **GET** | `/admin/dashboard` | Retrieve aggregated dashboard widget metrics. | Admin Only |
| **GET** | `/admin/dashboard/summary` | Fetch dashboard widgets data summary. | Admin Only |
| **GET** | `/admin/dashboard/analytics/borrowing`| Retrieve borrowing analytics trends. | Admin Only |
| **GET** | `/admin/users` | Retrieve paginated user registry. | Admin Only |
| **GET** | `/admin/users/:id` | Retrieve user details with borrow history. | Admin Only |
| **PATCH** | `/admin/users/:id/role` | Transition user role (MEMBER ⇄ ADMIN). | Admin Only |
| **PATCH** | `/admin/users/:id/status`| Deactivate/activate user login status. | Admin Only |
| **DELETE** | `/admin/reviews/:reviewId` | Administrative deletion/moderation of a review. | Admin Only |

---

## HTTP Status Codes

The API returns standard HTTP response codes:

| Code | Label | Cause |
| :--- | :--- | :--- |
| **200** | OK | Request completed successfully. |
| **201** | Created | Resource successfully created (registration, book creation). |
| **400** | Bad Request | Input validation error, malformed UUIDs, or invalid body payload. |
| **401** | Unauthorized | Bearer token is missing, malformed, or has expired. |
| **403** | Forbidden | Insufficient permissions (e.g. Member attempting to call Admin route). |
| **404** | Not Found | Requested entity (book, user, loan) does not exist. |
| **409** | Conflict | Unique constraint violation (duplicate ISBN, email, duplicate review). |
| **500** | Internal Error | Unhandled server error. Complete trace logged. |
