# AVELIS

A premium, full-stack Library Management System with a modern, fluid user experience and a scalable, layered backend architecture.

---

[![Project Status](https://img.shields.io/badge/Status-Active_Development-orange.svg)](#)
[![React](https://img.shields.io/badge/React-19.2.7-61DAFB.svg?style=flat&logo=react&logoColor=black)](#)
[![Vite](https://img.shields.io/badge/Vite-8.1.0-646CFF.svg?style=flat&logo=vite&logoColor=white)](#)
[![Express.js](https://img.shields.io/badge/Express-4.21.0-000000.svg?style=flat&logo=express&logoColor=white)](#)
[![Prisma](https://img.shields.io/badge/Prisma-6.19.3-2D3748.svg?style=flat&logo=prisma&logoColor=white)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-4169E1.svg?style=flat&logo=postgresql&logoColor=white)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg?style=flat&logo=tailwindcss&logoColor=white)](#)

---

## Table of Contents

- [Project Overview](#project-overview)
- [Motivation / Purpose](#motivation--purpose)
- [Project Status](#project-status)
- [Latest Milestone](#latest-milestone)
- [Project Statistics](#project-statistics)
- [Implemented Features](#implemented-features)
- [Authentication Features](#authentication-features)
- [Authentication Technology Stack](#authentication-technology-stack)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Database Design](#database-design)
- [Folder Structure](#folder-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Current Development Progress](#current-development-progress)
- [Future Enhancements](#future-enhancements)
- [Roadmap](#roadmap)
- [Deployment Status](#deployment-status)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## Project Overview

AVELIS is a production-quality, premium Library Management System designed to serve as an advanced full-stack portfolio showcase. It demonstrates how a highly interactive, animation-rich frontend interface can be seamlessly integrated with an enterprise-grade backend architecture. 

The application provides readers with a modern, high-fidelity experience for browsing curated collections, cataloging their personal library, logging reading history, and analyzing stats through a polished administration dashboard.

### Project Snapshot

| Category | Status |
| :--- | :--- |
| Frontend Landing Experience | ✅ Complete |
| Backend Authentication | ✅ Complete |
| Database | ✅ Complete |
| User Management | ✅ Complete |
| Books Module | ✅ Complete |
| Deployment | ⏳ Planned |

## Motivation / Purpose

Traditional library management systems often suffer from outdated user interfaces, rigid flows, and tightly coupled monolithic backends. AVELIS was built to solve this problem by showing that utility software can feel both premium and exceptionally responsive. 

The primary goals of this project are:
- **Design Excellence**: To demonstrate fluid visual design utilizing dark-themed palettes, custom layouts, and micro-interactions.
- **Architectural Separation**: To implement clean, decoupled design patterns—separating client-side interface controllers from backend transaction management.
- **Maintainability**: To establish a solid codebase foundations using structured layered routing, validation middlewares, and clean relational schemas.

## Project Status

AVELIS is in active development. The backend authentication, user management, profiles, and administration layers are complete.

### Completed
* **Express Backend** – Layered backend architecture with routing, controllers, services, and middleware.
* **PostgreSQL Database** – Relational database configured with normalized schema, constraints, and indexes.
* **Prisma ORM** – Type-safe database access, schema management, and migration support.
* **JWT Authentication** – Secure stateless authentication using signed JWT access tokens.
* **User Registration** – Input validation, uniqueness checks, password hashing, and account creation.
* **User Login** – Credential verification and JWT token generation.
* **Protected Routes** – Authorization middleware protecting authenticated endpoints.
* **Password Hashing (bcrypt)** – Secure hashing of user passwords before persistence.
* **Authentication Middleware** – Centralized JWT verification and authenticated user attachment.
* **Current Authenticated User Endpoint (`/api/v1/auth/me`)** – Safe retrieval of the currently authenticated user's profile.
* **React frontend** – React 19 single-page application scaffolding.
* **Responsive UI** – Responsive page layouts tailored for desktop, tablet, and mobile displays.
* **Prisma migrations** – Version-controlled SQL migration scripts generated and successfully executed.
* **Prisma Studio verification** – Visual table browsing and record administration confirmed.
* **pgAdmin verification** – Direct structural check of tables, columns, constraints, and custom enum types completed.
* **User Profile & Password Actions** – Profile detail retrieval (`GET /me`), username updates (`PATCH /me`), and secure password updates with current password checks (`PATCH /me/password`).
* **Role-Based Access Control (RBAC)** – Authorization layer (`adminMiddleware`) guarding administrative actions for `ADMIN` role users.
* **Admin User & Status Management** – Administrative endpoints to retrieve paginated/filtered user lists, view user details, update user roles, and activate/deactivate user status.
* **Admin Dashboard Statistics** – Concurrent aggregate counts using Prisma client enums (`GET /admin/dashboard`).

### Current Focus
* 🚧 **Phase 10.3 – Get Reservation by ID**

---

## Latest Milestone

AVELIS has successfully completed **Phase 9.9 — Loan Module Production Refinement**, finalizing code audits, validations consolidation, and regression testing for the complete Loan Management module.

The completed milestone confirms:
* **Consolidated Parameter Validation**: Merged `returnValidator` and `loanIdParamValidator` to eliminate code duplication.
* **Separation of Controller Handlers**: Kept `returnBook` and `returnLoan` distinct to support future extensibility as they map to separate service layer entry points.
* **Comprehensive Regression Testing**: Verified all E2E integration test suites for Borrow, Return, Get, and Sync status transitions pass successfully.

> **Next Milestone:** Phase 10 — Order Invoicing & Bookstore Purchase Pipeline

## Project Statistics

| Property | Value |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Framer Motion |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL |
| **ORM** | Prisma ORM |
| **Architecture** | Layered (Controllers, Services, Models, Routes) |
| **Database Tables** | 11 Application Tables |
| **Deployment Status** | Deploys Pending API Completion |
| **License** | ISC License |

---

## Implemented Features

### Frontend (Completed)
- **Premium Landing Page**: An immersive entry page highlighting the application's vision with smooth typography.
- **Responsive Navigation**: Clean, adaptive menu layouts tailored for mobile, tablet, and desktop viewports.
- **Hero Section**: A high-impact hero header using modern design styles to introduce the platform.
- **Collections Page**: A curated, interactive layout for discovering various book lists and genres.
- **Library Page**: A dedicated personal library management screen for indexing owned literature.
- **Reading Journal Page**: A beautiful user log designed to review, rate, and record personal reading notes.
- **Dashboard UI**: A comprehensive statistic dashboard visualizing mock user activity metrics.
- **Framer Motion Integration**: Modern micro-interactions, page transitions, and elegant hover animations.
- **Reusable Component Architecture**: Highly modular, isolated React component architecture utilizing the custom AVELIS design system.

### Backend (Implemented So Far)
- **Express Backend Core**: Node.js/Express.js application initialized and integrated with compression, security configurations (Helmet), HTTP logging (Morgan), and CORS middleware.
- **Layered Software Directory**: Organized architecture dividing files into routes, controllers, services, middlewares, and models.
- **Prisma ORM Setup**: Prisma Client configured alongside active database schema declarations.
- **PostgreSQL Configuration**: Outlined datasource details ready for relational database mapping.

---

## Authentication Features

The following backend authentication features are fully implemented and integrated:
* Secure user registration
* Secure user login
* JWT-based authentication
* Protected API routes
* Authentication middleware
* Current authenticated user retrieval
* Centralized authentication error handling
* Production-ready layered backend architecture

### Security Highlights

Key security practices implemented to protect user credentials and sessions:
* **Password Hashing (bcrypt)** – User credentials are securely hashed before storage using bcrypt with a salt factor of 10.
* **JWT Authentication** – Stateless authentication using signed JWT access tokens containing only essential user information (ID, email, role).
* **Protected Route Middleware** – Restricts access to authenticated endpoints.
* **Authentication Middleware** – Centralized JWT verification and authenticated request context.
* **Secure Password Verification** – Password comparison performed using bcrypt's secure verification mechanism without exposing plaintext credentials.
* **Environment Secret Isolation** – Cryptographic secrets loaded from environment variables (`JWT_SECRET`).
* **Centralized Authentication Error Handling** – Unified handling of authentication and authorization failures.

### Authentication Technology Stack

| Layer | Technology |
| :--- | :--- |
| Runtime | Node.js |
| Backend Framework | Express.js |
| Authentication | JWT |
| Password Hashing | bcrypt |
| ORM | Prisma |
| Database | PostgreSQL |

## Tech Stack

### Frontend
- **React 19.2.7** — Declarative UI building
- **Vite 8.1.0** — Ultra-fast build tool and bundler
- **JavaScript (ESM)** — Client logic
- **Tailwind CSS v4** — Modern utility-first CSS styling
- **Framer Motion** — Liquid-smooth user interface animations
- **React Router 7.18.0** — Single Page Application routing

### Backend
- **Node.js** — JavaScript runtime environment
- **Express.js 4.21.0** — Lightweight HTTP framework
- **Prisma ORM 6.19.3** — Next-generation database ORM
- **PostgreSQL** — Relational database engine

### Development Tools
- **Git & GitHub** — Version control and hosting
- **VS Code** — Primary code editor
- **Oxlint** — Ultra-fast JavaScript and JSX code linter

---

## Project Architecture

The block diagram below demonstrates the clean flow of data through AVELIS, separating client interactions from database persistence layer:

```mermaid
graph TD
    subgraph Frontend Client
        React[React Client] --> Axios[Axios]
    end

    subgraph Express Server
        Axios -- HTTPS Requests --> Router[Express Router]
        Router --> ValMiddleware[Validation Middleware]
        ValMiddleware --> AuthMiddleware[Authentication Middleware]
        AuthMiddleware --> Controller[Controller]
        Controller --> Service[Service]
        Service --> Prisma[Prisma Client]
    end

    subgraph Database Layer
        Prisma --> PostgreSQL[PostgreSQL]
    end
```

### Authentication Sequence Diagram

The sequence diagram below illustrates the request/response lifecycle for the user login authentication flow:

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Router as Express Router (POST /api/v1/auth/login)
    participant Val as Validation Middleware
    participant Ctrl as Authentication Controller
    participant Serv as Authentication Service
    participant Prisma as Prisma Client
    participant DB as PostgreSQL

    Client->>Router: POST login request
    Router->>Val: Forward request for schema validation
    
    alt Validation failure
        Val-->>Client: 400 Bad Request
    else Validation success
        Val->>Ctrl: Forward payload to controller
        Ctrl->>Serv: Call loginUser()
        Serv->>Prisma: Request user details by email
        Prisma->>DB: Query User record
        DB-->>Prisma: User Record
        Prisma-->>Serv: User Record
        
        alt Invalid credentials or inactive account
            Serv->>Serv: bcrypt password verification (fails) / check isActive
            Serv-->>Ctrl: Throw error
            Ctrl-->>Client: 401 Unauthorized / 403 Forbidden
        else Successful authentication
            Serv->>Serv: bcrypt password verification (passes)
            Serv->>Serv: JWT generation
            Serv-->>Ctrl: Return token and sanitized user details
            Ctrl-->>Client: 200 OK with JWT access token and sanitized user info
        end
    end
```

---

## Database Design

AVELIS uses PostgreSQL as its primary relational database engine. All database access, schema definition, and table generation are managed via Prisma ORM. The database schema follows Third Normal Form (3NF) design to prevent redundancy, assure data consistency, and enforce strict referential integrity. All models utilize UUIDs as primary keys, and foreign keys enforce referential integrity across related datasets.

The Prisma schema configuration file located at `server/prisma/schema.prisma` is the single source of truth for the database schema.

### Database at a Glance

| Property | Value |
| :--- | :--- |
| **Database Engine** | PostgreSQL |
| **ORM** | Prisma ORM |
| **Normalization** | Third Normal Form (3NF) |
| **Primary Keys** | UUID (v4) |
| **Relationship Types** | One-to-One, One-to-Many, Many-to-Many |
| **Timestamp Strategy** | Automatic `createdAt` and `updatedAt` |
| **Many-to-Many Strategy** | Explicit junction tables (`BookAuthor`, `BookCategory`) |

### Entity Relationship Diagram

[![AVELIS ER Diagram](docs/images/er-diagram.png)](docs/images/er-diagram.png)

> The following Entity Relationship Diagram illustrates the complete AVELIS database architecture, including entities, relationships, constraints, cardinalities, and business rules.
>
> Click the diagram to view the full-resolution version.

### Database Overview

| Table | Purpose |
| :--- | :--- |
| **User** | Stores user credentials, profiles, contact details, account statuses, and authorization roles. |
| **Book** | Stores abstract catalog metadata for book titles, including pricing, ISBN codes, and sale/borrow settings. |
| **Author** | Stores writer details, biographical descriptions, and references to profile photos. |
| **Category** | Stores genres, classifications, and category descriptions. |
| **BookAuthor** | Explicit junction table resolving the many-to-many relationship between books and authors. |
| **BookCategory** | Explicit junction table resolving the many-to-many relationship between books and categories. |
| **BookCopy** | Stores physical inventory tracking records, barcodes, conditions, and locations for individual copies. |
| **Loan** | Tracks checkout transactions, due dates, return timestamps, and overdue fine amounts. |
| **Order** | Stores customer book purchase order headers, shipping details, and billing totals. |
| **OrderItem** | Stores line-item details of books purchased in a single purchase order. |
| **Review** | Stores customer ratings and written feedback for book catalog entries. |

### Table Dictionary

#### User

| Column | Type | Description |
| :--- | :--- | :--- |
| **id** | UUID | Unique identifier and primary key. |
| **username** | String | Unique display name used for profile access. |
| **email** | String | Unique email address used for login and notifications. |
| **passwordHash** | String | Cryptographic hash of the user password. |
| **phone** | String | Optional contact telephone number. |
| **avatar** | String | Optional URL referencing the user profile picture. |
| **role** | Enum | Authorization level (ADMIN, MEMBER). |
| **isActive** | Boolean | Flag determining if the user account is active. |
| **createdAt** | DateTime | Timestamp when the user account was registered. |
| **updatedAt** | DateTime | Timestamp when the user profile was last updated. |

#### Book

| Column | Type | Description |
| :--- | :--- | :--- |
| **id** | UUID | Unique identifier and primary key. |
| **title** | String | The official title of the cataloged book. |
| **isbn** | String | Unique International Standard Book Number. |
| **publisher** | String | Optional publishing house name. |
| **publicationYear** | Integer | Optional year the book edition was released. |
| **language** | String | Primary language of the text. |
| **description** | String | Optional synopsis or review of the book content. |
| **coverImage** | String | Optional URL referencing the cover artwork. |
| **sellingPrice** | Decimal | Retail purchase price for bookstore sales. |
| **stockQuantity** | Integer | Quantity of copies available for commercial purchase. |
| **isBorrowable** | Boolean | Flag determining if the book copies are rentable. |
| **isForSale** | Boolean | Flag determining if the book is available for purchase. |
| **createdAt** | DateTime | Timestamp when the catalog entry was created. |
| **updatedAt** | DateTime | Timestamp when the catalog entry was last updated. |

#### Author

| Column | Type | Description |
| :--- | :--- | :--- |
| **id** | UUID | Unique identifier and primary key. |
| **fullName** | String | The complete name of the writer. |
| **biography** | String | Optional summary of the author's history. |
| **photo** | String | Optional URL referencing the author's image. |
| **createdAt** | DateTime | Timestamp when the author record was created. |
| **updatedAt** | DateTime | Timestamp when the author record was last updated. |

#### Category

| Column | Type | Description |
| :--- | :--- | :--- |
| **id** | UUID | Unique identifier and primary key. |
| **name** | String | Unique name representing the category or genre. |
| **description** | String | Optional explanation of the genre parameters. |
| **createdAt** | DateTime | Timestamp when the category was created. |
| **updatedAt** | DateTime | Timestamp when the category was last updated. |

#### BookAuthor

| Column | Type | Description |
| :--- | :--- | :--- |
| **id** | UUID | Unique identifier and primary key. |
| **bookId** | UUID | Foreign key referencing the associated Book. |
| **authorId** | UUID | Foreign key referencing the associated Author. |

#### BookCategory

| Column | Type | Description |
| :--- | :--- | :--- |
| **id** | UUID | Unique identifier and primary key. |
| **bookId** | UUID | Foreign key referencing the associated Book. |
| **categoryId** | UUID | Foreign key referencing the associated Category. |

#### BookCopy

| Column | Type | Description |
| :--- | :--- | :--- |
| **id** | UUID | Unique identifier and primary key. |
| **bookId** | UUID | Foreign key referencing the parent Book catalog item. |
| **barcode** | String | Unique serial barcode sticker for scanner tracking. |
| **shelfLocation** | String | Optional warehouse or library shelf location. |
| **condition** | Enum | Quality condition of the physical copy (NEW, GOOD, FAIR, DAMAGED). |
| **status** | Enum | Availability status (AVAILABLE, BORROWED, LOST, MAINTENANCE). |
| **purchaseDate** | Date | Optional date when the physical copy was acquired. |
| **createdAt** | DateTime | Timestamp when the inventory copy was logged. |
| **updatedAt** | DateTime | Timestamp when the inventory copy was last modified. |

#### Loan

| Column | Type | Description |
| :--- | :--- | :--- |
| **id** | UUID | Unique identifier and primary key. |
| **userId** | UUID | Foreign key referencing the borrowing User. |
| **copyId** | UUID | Foreign key referencing the specific physical BookCopy. |
| **issueDate** | DateTime | Date and time when the loan was checked out. |
| **dueDate** | DateTime | Expected return deadline for the book. |
| **returnDate** | DateTime | Optional date and time when the copy was returned. |
| **fineAmount** | Decimal | Overdue penalty fees assessed on the loan transaction. |
| **status** | Enum | Lifecycle status of the loan (BORROWED, RETURNED, OVERDUE). |
| **createdAt** | DateTime | Timestamp when the loan record was initialized. |
| **updatedAt** | DateTime | Timestamp when the loan record was last modified. |

#### Order

| Column | Type | Description |
| :--- | :--- | :--- |
| **id** | UUID | Unique identifier and primary key. |
| **userId** | UUID | Foreign key referencing the customer User. |
| **orderNumber** | String | Unique purchase transaction reference number. |
| **totalAmount** | Decimal | Total financial amount invoiced for the order. |
| **paymentStatus** | Enum | Processing status of the payment (PENDING, PAID, FAILED, REFUNDED). |
| **orderStatus** | Enum | Processing status of order fulfillment (PLACED, PROCESSING, SHIPPED, DELIVERED, CANCELLED). |
| **shippingAddress** | String | Delivery location for dispatch. |
| **orderedAt** | DateTime | Date and time when the order was submitted. |
| **createdAt** | DateTime | Timestamp when the order was created. |
| **updatedAt** | DateTime | Timestamp when the order was last updated. |

#### OrderItem

| Column | Type | Description |
| :--- | :--- | :--- |
| **id** | UUID | Unique identifier and primary key. |
| **orderId** | UUID | Foreign key referencing the parent purchase Order. |
| **bookId** | UUID | Foreign key referencing the retail Book purchased. |
| **quantity** | Integer | Number of units purchased for this book entry. |
| **unitPrice** | Decimal | Price charged per unit at the time of order placement. |

#### Review

| Column | Type | Description |
| :--- | :--- | :--- |
| **id** | UUID | Unique identifier and primary key. |
| **userId** | UUID | Foreign key referencing the author User. |
| **bookId** | UUID | Foreign key referencing the evaluated Book. |
| **rating** | Integer | User rating score (integer value between 1 and 5). |
| **comment** | String | Optional written commentary detailing user feedback. |
| **createdAt** | DateTime | Timestamp when the review was written. |
| **updatedAt** | DateTime | Timestamp when the review was last modified. |

### Database Relationships

Relationships enforce cardinality and database integrity:
- **User ⇄ Loans** (One-to-Many): A user can check out multiple book copies over time.
- **User ⇄ Orders** (One-to-Many): A customer can place multiple purchase orders.
- **User ⇄ Reviews** (One-to-Many): A user can write reviews for multiple books.
- **Book ⇄ Authors** (Many-to-Many): A book can have multiple authors, and an author can write multiple books. This is explicitly resolved through the `BookAuthor` junction table.
- **Book ⇄ Categories** (Many-to-Many): A book can belong to multiple categories, and a category can contain multiple books. This is explicitly resolved through the `BookCategory` junction table.
- **Book ⇄ BookCopies** (One-to-Many): A catalog book can own multiple physical book copies.
- **Book ⇄ Reviews** (One-to-Many): A book catalog entry can have multiple reviews written by different users.
- **Book ⇄ OrderItems** (One-to-Many): A catalog book can be referenced in multiple purchase order line-items.
- **Order ⇄ OrderItems** (One-to-Many): A single order header owns multiple order line-items.
- **BookCopy ⇄ Loans** (One-to-Many): A specific physical copy can have multiple checkout transactions over its lifecycle.

### Business Rules

Database constraints and validations protect data logic:
- **Unique Identifiers**: User email addresses, usernames, ISBN numbers, order numbers, and copy barcodes must be globally unique.
- **Feedback Limitation**: A user can review a specific book only once. This is enforced by a composite unique index on (userId, bookId).
- **Consolidated Orders**: A book can appear only once in a purchase order. Multiple units of the same book are consolidated under the quantity field on the OrderItem using a composite unique index on (orderId, bookId).
- **Physical Copy Lending**: A physical copy can only be borrowed by one user in an active Loan at any given time. Copies marked `BORROWED` or `MAINTENANCE` cannot be checked out for a new loan.
- **Retail Restrictions**: Books not marked with `isForSale` cannot appear in orders.
- **Validation Boundaries**: Ratings must be integers bounded between 1 and 5. Stock quantity and order item quantity must remain non-negative.
- **Auditing Integrity**: Foreign key constraints maintain referential integrity. Custom enumerations restrict values to valid system states.

### Design Principles

The design philosophy follows enterprise relational database principles:
- **Third Normal Form (3NF)**: Normalizes tables to avoid redundant storage and update anomalies.
- **UUID Primary Keys**: Ensures global uniqueness, shields against enumeration attacks, and prepares for distributed database clustering.
- **Junction Tables**: Manages many-to-many relationships explicitly, permitting future column additions.
- **Prisma Migrations**: Tracks all schema upgrades via version-controlled SQL files.
- **Foreign Key Constraints**: Standardizes cascades (`onDelete: Cascade` for dependencies like junction tables and reviews) and restrictions (`onDelete: Restrict` for audit records like loans and orders).
- **Index Optimization**: B-tree database indexes (`@@index`) are placed on all foreign key columns to speed up query JOIN execution paths.
- **Automatic Timestamps**: Automatic track of creation (`createdAt`) and update (`updatedAt`) dates simplifies auditing.
- **Enumerations**: Constrains values to predefined, type-safe states.

### Schema Evolution

The database schema evolves through version-controlled Prisma Migrations. Developers must modify the schema file at `server/prisma/schema.prisma` before generating a new migration using `npx prisma migrate dev`. Editing PostgreSQL tables directly is discouraged except for maintenance operations.

---

## Folder Structure

```text
AVELIS/
├── public/                 # Static asset folders
├── src/                    # Frontend source root
│   ├── assets/             # Media files, global icons
│   ├── components/         # Reusable UI layout elements
│   ├── context/            # Global React states
│   ├── data/               # Static mock catalog data
│   ├── hooks/              # Custom React utility hooks
│   ├── pages/              # Application views (Landing, Dashboard, etc.)
│   ├── routes/             # Client-side router declarations
│   ├── sections/           # Modular view-specific components
│   ├── types/              # JS / Prop definitions
│   ├── utils/              # Helper utilities
│   ├── App.jsx             # Main application component
│   ├── main.jsx            # Application entry render
│   └── index.css           # Global CSS and Tailwind directives
│
├── server/                 # Backend source root
│   ├── prisma/             # Prisma schema migrations configuration
│   └── src/                # Express backend application
│       ├── config/         # System configurations
│       ├── constants/      # App-wide constants
│       ├── controllers/    # API request handlers
│       ├── docs/           # Documentation and Swagger
│       ├── errors/         # Custom class exceptions
│       ├── helpers/        # General backend helpers
│       ├── lib/            # Shared libraries (Prisma instance)
│       ├── middleware/     # Custom Express interceptors
│       ├── models/         # Database models structure
│       ├── modules/        # Modular domain-driven structures
│       ├── routes/         # API path routing mappings
│       ├── services/       # Core business logic processing
│       ├── types/          # Type declarations
│       ├── uploads/        # Static uploads folder
│       ├── utils/          # Generic system utilities
│       ├── validators/     # Request payload validation rules
│       ├── app.js          # Express app wrapper
│       └── server.js       # Express server initialization entry
│
├── package.json            # Frontend dependency and scripts configuration
└── vite.config.js          # Vite build parameters
```

---

## Getting Started

### Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher is recommended)
- **PostgreSQL** database engine

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Aaditgupta1234/AVELIS.git
   cd AVELIS
   ```

2. **Install Frontend dependencies:**
   Ensure you are in the root directory:
   ```bash
   npm install
   ```

3. **Install Backend dependencies:**
   Navigate into the `server` directory and install its components:
   ```bash
   cd server
   npm install
   ```

### Running Frontend
From the root directory, start the Vite development server:
```bash
npm run dev
```
The client application will typically launch at `http://localhost:5173`.

### Running Backend
1. Initialize your local configuration file inside the `server/` directory:
   ```bash
   cd server
   cp .env.example .env
   ```
2. Open `.env` and fill out your PostgreSQL database string.
3. Start the Express development backend using Nodemon:
   ```bash
   npm run dev
   ```
   The backend API will run on the configured port, defaulting to `http://localhost:5000/api/v1`.

---

## Environment Variables

Inside the `server/` directory, create a `.env` file based on the template below:

```ini
# Database Connection String
DATABASE_URL=

# App Server Port Configuration
PORT=

# Authentication Secrets
JWT_SECRET=
JWT_REFRESH_SECRET=
```

---

## API Overview

AVELIS exposes a JSON RESTful API. All backend endpoints are versioned under `/api/v1` to support future API evolution and maintain backward compatibility.

Below are the primary endpoints and their current status:

| Method | Endpoint | Purpose | Status |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/auth/register` | Register a new user profile. | ✅ Completed |
| **POST** | `/api/v1/auth/login` | Authenticate user credentials and return access tokens. | ✅ Completed |
| **GET** | `/api/v1/auth/me` | Fetch active profile details for the authorized session. | ✅ Completed |
| **POST** | `/api/v1/auth/logout` | Clear token credentials. | 🟡 Scaffolded (Placeholder) |
| **GET** | `/api/v1/users/me` | Retrieve active profile details for the authorized session. | ✅ Completed |
| **PATCH** | `/api/v1/users/me` | Update current user profile username. | ✅ Completed |
| **PATCH** | `/api/v1/users/me/password` | Securely update password. | ✅ Completed |
| **GET** | `/api/v1/books` | Retrieve a catalog listing of all books. | ✅ Completed |
| **GET** | `/api/v1/books/:id` | Retrieve details of a specific book. | ✅ Completed |
| **POST** | `/api/v1/books` | Create a new catalog book entry (Admin only). | ✅ Completed |
| **PATCH** | `/api/v1/books/:id` | Update metadata details of a catalog book (Admin only). | ✅ Completed |
| **DELETE** | `/api/v1/books/:id` | Soft delete a catalog book entry (Admin only). | ✅ Completed |
| **PATCH** | `/api/v1/books/:id/restore` | Restore a soft-deleted catalog book (Admin only). | ✅ Completed |
| **DELETE** | `/api/v1/books/:id/permanent` | Permanently delete a soft-deleted catalog book (Admin only). | ✅ Completed |
| **GET** | `/api/v1/loans` | Retrieve a paginated list of all loans with filtering and sorting (Admin only). | ✅ Completed |
| **POST** | `/api/v1/loans` | Create a new loan transaction for a member (performed by an administrator or through member self-checkout). | ✅ Completed |
| **POST** | `/api/v1/loans/:id/return` | Complete an active loan by returning its borrowed book copy (Admin only). | ✅ Completed |
| **PATCH** | `/api/v1/loans/:id/return` | Complete an active loan by returning its borrowed book copy (Admin only) (Phase 9.7). | ✅ Completed |
| **POST** | `/api/v1/loans/overdue/sync` | Synchronize overdue loan statuses (Admin only) (Phase 9.8). | ✅ Completed |
| **GET** | `/api/v1/loans/:id` | Retrieve details of a specific loan (Admin or Member with ownership). | ✅ Completed |
| **GET** | `/api/v1/loans/me` | Retrieve a paginated list of the current authenticated user's loans. | ✅ Completed |
| **POST** | `/api/v1/reservations` | Create a new reservation for a book copy (MEMBER/ADMIN) (Phase 10.2). | ✅ Completed |
| **GET** | `/api/v1/orders` | Fetch user purchase order invoices. | Planned |

### Administrative API Overview

The following administrative endpoints are protected by `authMiddleware` and `adminMiddleware`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/v1/admin/dashboard` | Retrieve aggregated dashboard counts. |
| **GET** | `/api/v1/admin/users` | Retrieve all users (paginated, sorted, and filtered). |
| **GET** | `/api/v1/admin/users/:id` | Retrieve details of a specific user. |
| **PATCH** | `/api/v1/admin/users/:id/role` | Update a user's role. |
| **PATCH** | `/api/v1/admin/users/:id/status` | Activate or deactivate a user (with self-deactivation protection). |

### Book Management Module Summary

The Book Management module provides a complete catalog lifecycle for the AVELIS Library Management System. It exposes **7 RESTful API endpoints** covering creation, retrieval, updating, and a full soft-delete lifecycle.

#### Core Features

| Feature | Endpoint | Method | Access |
| :--- | :--- | :--- | :--- |
| Create Book | `/api/v1/books` | POST | Admin only |
| Get All Books | `/api/v1/books` | GET | Public |
| Get Book By ID | `/api/v1/books/:id` | GET | Public |
| Update Book | `/api/v1/books/:id` | PATCH | Admin only |
| Soft Delete Book | `/api/v1/books/:id` | DELETE | Admin only |
| Restore Book | `/api/v1/books/:id/restore` | PATCH | Admin only |
| Permanent Delete Book | `/api/v1/books/:id/permanent` | DELETE | Admin only |

#### Authentication & Authorization
- **Authentication**: All write operations require a valid JWT Bearer Token in the `Authorization` header.
- **Authorization**: Write operations (create, update, soft delete, restore, permanent delete) are restricted to users with the `ADMIN` role. Read operations (list, detail) are publicly accessible.

#### Validation Strategy
- **Request body validators**: Enforce required fields, data types, and constraints for create and update operations.
- **UUID parameter validators**: Validate `req.params.id` format for all ID-based operations.
- **Query validators**: Validate pagination, sorting, filtering, and search query parameters.

#### Soft-Delete Lifecycle
Books follow a managed deletion lifecycle:

```
Active → Soft Deleted → Restored (back to Active)
                      → Permanently Deleted (physically removed)
```

- **Soft-deleted books** are excluded from public listing and detail endpoints.
- **Restoration** reintegrates the book into the public catalog.
- **Permanent deletion** requires the book to be soft-deleted first, preventing accidental irreversible data loss.

#### Testing & Production Readiness
- All 7 endpoints have been verified through comprehensive end-to-end integration testing (21 test scenarios).
- Authentication, authorization, validation, business rules, visibility integration, and database integrity have all been confirmed.
- The module is **production-ready**.

---

### Book Update API Specification

**PATCH** `/api/v1/books/:id`

#### Purpose
Update details of a catalog book entry.

#### Authentication
- Authentication required (JWT Bearer Token in `Authorization` header).
- Administrator role (`ADMIN`) required.

#### Request Parameters
- `id` (UUID, path parameter) - Unique identifier of the book.

#### Request Body
The request body is a JSON object. All fields are optional. Only the fields supplied are updated; omitted fields remain unchanged.

| Field | Type | Description |
| :--- | :--- | :--- |
| `title` | String | Title of the book (non-empty, trimmed). |
| `isbn` | String | Unique ISBN (non-empty, trimmed). |
| `publisher` | String | Publisher name (non-empty, trimmed). |
| `publicationYear` | Integer | Year of publication (optional, can be null). |
| `language` | String | Language of text (non-empty, trimmed, default: 'English'). |
| `description` | String | Synopsis or review of the book (optional, can be null). |
| `coverImage` | String | Valid URL pointing to cover image (optional, can be null). |
| `sellingPrice` | Number | Purchase price (must be >= 0). |
| `stockQuantity` | Integer | Units in stock (must be >= 0). |
| `isBorrowable` | Boolean | Whether the book is rentable. |
| `isForSale` | Boolean | Whether the book is purchasable. |
| `authorIds` | Array[UUID] | Non-empty array of valid Author UUIDs. |
| `categoryIds` | Array[UUID] | Non-empty array of valid Category UUIDs. |

#### Success Response
- **Status Code**: `200 OK`
- **Body**:
```json
{
  "success": true,
  "message": "Book updated successfully.",
  "data": {
    "id": "bdc3ffb9-e3d5-4f06-9b7e-6a0f901abeef",
    "title": "Title Updated Via Integrated Route",
    "isbn": "TEST-ROUTE-ISBN-1783321677593",
    "publisher": "Test Publisher",
    "publicationYear": 2026,
    "language": "English",
    "description": null,
    "coverImage": null,
    "sellingPrice": "19.99",
    "stockQuantity": 10,
    "isBorrowable": true,
    "isForSale": true,
    "createdAt": "2026-07-06T07:07:57.595Z",
    "updatedAt": "2026-07-06T07:07:57.618Z",
    "authors": [
      {
        "author": {
          "id": "21a0b8db-117b-494c-8f68-5ea6a406d03a",
          "fullName": "Route Test Author"
        }
      }
    ],
    "categories": [
      {
        "category": {
          "id": "669a6837-4753-48e5-b5da-179b0d288af2",
          "name": "Route Test Category 1783321677590"
        }
      }
    ]
  },
  "meta": {}
}
```

#### Error Responses
- **400 Bad Request**: Validation failed (e.g. invalid UUID path parameter, negative price/stock, invalid author/category IDs, or duplicate IDs in arrays).
  ```json
  {
    "success": false,
    "message": "Validation failed.",
    "errors": [
      { "field": "sellingPrice", "message": "Selling price must be a non-negative number." }
    ]
  }
  ```
- **401 Unauthorized**: Authentication header missing or token is invalid.
  ```json
  {
    "success": false,
    "message": "Authorization header is missing"
  }
  ```
- **403 Forbidden**: Authenticated user lacks `ADMIN` privileges.
  ```json
  {
    "success": false,
    "message": "Access denied. Administrator privileges required."
  }
  ```
- **404 Not Found**: Book record with given `id` does not exist.
  ```json
  {
    "success": false,
    "message": "Book not found."
  }
  ```
- **409 Conflict**: A different book is already registered with the new `isbn`.
  ```json
  {
    "success": false,
    "message": "ISBN already exists."
  }
  ```

### Book Soft Delete API Specification

**DELETE** `/api/v1/books/:id`

#### Purpose
Soft delete a book catalog entry. Soft-deleted books are hidden from public read queries but preserved in the database for references and statistics.

#### Authentication
- Authentication required (JWT Bearer Token in `Authorization` header).
- Administrator role (`ADMIN`) required.

#### Request Parameters
- `id` (UUID, path parameter) — Unique identifier of the book.

#### Success Response
- **Status Code**: `200 OK`
- **Body**:
```json
{
  "success": true,
  "message": "Book deleted successfully.",
  "data": {
    "id": "246ee81b-fdca-4aa2-b62d-603c4a8fedeb",
    "title": "Route SD Book Title",
    "isbn": "TEST-R-SD-ISBN-1783328839393",
    "publisher": "Test Publisher",
    "publicationYear": 2026,
    "language": "English",
    "description": null,
    "coverImage": null,
    "sellingPrice": "19.99",
    "stockQuantity": 10,
    "isBorrowable": true,
    "isForSale": true,
    "isDeleted": true,
    "deletedAt": "2026-07-06T09:07:19.444Z",
    "createdAt": "2026-07-06T09:07:19.395Z",
    "updatedAt": "2026-07-06T09:07:19.454Z",
    "authors": [
      {
        "author": {
          "id": "10dda513-51a2-4374-a961-76ff1716ce75",
          "fullName": "Route SD Author"
        }
      }
    ],
    "categories": [
      {
        "category": {
          "id": "f0c8fd88-8eb5-493b-b6c8-dbf37d45779c",
          "name": "Route SD Category 1783328839390"
        }
      }
    ]
  },
  "meta": {}
}
```

#### Error Responses
- **400 Bad Request** — Invalid UUID path parameter, or the book has already been soft deleted.
  ```json
  {
    "success": false,
    "message": "Invalid book ID."
  }
  ```
  or
  ```json
  {
    "success": false,
    "message": "Book has already been deleted."
  }
  ```
- **401 Unauthorized** — Authentication header missing or token is invalid.
  ```json
  {
    "success": false,
    "message": "Authorization header is missing"
  }
  ```
- **403 Forbidden** — Authenticated user lacks `ADMIN` privileges.
  ```json
  {
    "success": false,
    "message": "Access denied. Administrator privileges required."
  }
  ```
- **404 Not Found** — The requested book could not be found. (This is returned if the book does not exist or has already been soft deleted, keeping the existence of deleted items confidential).
  ```json
  {
    "success": false,
    "message": "Book not found."
  }
  ```

### Book Restore API Specification

**PATCH** `/api/v1/books/:id/restore`

#### Purpose
Restore a previously soft-deleted book catalog entry.

#### Authentication
- Authentication required (JWT Bearer Token in `Authorization` header).
- Administrator role (`ADMIN`) required.

#### Request Parameters
- `id` (UUID, path parameter) — Unique identifier of the book.

#### Success Response
- **Status Code**: `200 OK`
- **Body**:
```json
{
  "success": true,
  "message": "Book restored successfully.",
  "data": {
    "id": "246ee81b-fdca-4aa2-b62d-603c4a8fedeb",
    "title": "Route SD Book Title",
    "isbn": "TEST-R-SD-ISBN-1783328839393",
    "publisher": "Test Publisher",
    "publicationYear": 2026,
    "language": "English",
    "description": null,
    "coverImage": null,
    "sellingPrice": "19.99",
    "stockQuantity": 10,
    "isBorrowable": true,
    "isForSale": true,
    "isDeleted": false,
    "deletedAt": null,
    "createdAt": "2026-07-06T09:07:19.395Z",
    "updatedAt": "2026-07-06T09:07:19.454Z",
    "authors": [
      {
        "author": {
          "id": "10dda513-51a2-4374-a961-76ff1716ce75",
          "fullName": "Route SD Author"
        }
      }
    ],
    "categories": [
      {
        "category": {
          "id": "f0c8fd88-8eb5-493b-b6c8-dbf37d45779c",
          "name": "Route SD Category 1783328839390"
        }
      }
    ]
  },
  "meta": {}
}
```

#### Error Responses
- **400 Bad Request** — Invalid UUID path parameter, or the book is already active (not soft deleted).
  ```json
  {
    "success": false,
    "message": "Invalid book ID."
  }
  ```
  or
  ```json
  {
    "success": false,
    "message": "Book is not deleted."
  }
  ```
- **401 Unauthorized** — Authentication header missing or token is invalid.
  ```json
  {
    "success": false,
    "message": "Authorization header is missing"
  }
  ```
- **403 Forbidden** — Authenticated user lacks `ADMIN` privileges.
  ```json
  {
    "success": false,
    "message": "Access denied. Administrator privileges required."
  }
  ```
- **404 Not Found** — The requested book could not be found. (This is returned if the book does not exist).
  ```json
  {
    "success": false,
    "message": "Book not found."
  }
  ```

### Book Permanent Delete API Specification

**DELETE** `/api/v1/books/:id/permanent`

#### Purpose
Permanently delete a previously soft-deleted book catalog entry. This operation is irreversible and physically removes the record from the database.

#### Authentication
- Authentication required (JWT Bearer Token in `Authorization` header).
- Administrator role (`ADMIN`) required.

#### Request Parameters
- `id` (UUID, path parameter) — Unique identifier of the book.

#### Prerequisites
- The book must be soft-deleted (`isDeleted === true`) before it can be permanently deleted.
- Attempting to permanently delete an active book will return `400 Bad Request`.

#### Success Response
- **Status Code**: `200 OK`
- **Body**:
```json
{
  "success": true,
  "message": "Book permanently deleted successfully.",
  "data": {
    "id": "bdc3ffb9-e3d5-4f06-9b7e-6a0f901abeef",
    "title": "Permanently Deleted Book Title",
    "isbn": "PD-ISBN-1783328839393",
    "publisher": "Publisher Name",
    "publicationYear": 2026,
    "language": "English",
    "description": null,
    "coverImage": null,
    "sellingPrice": "19.99",
    "stockQuantity": 10,
    "isBorrowable": true,
    "isForSale": true,
    "isDeleted": true,
    "deletedAt": "2026-07-06T10:45:00.000Z",
    "createdAt": "2026-07-06T09:07:19.395Z",
    "updatedAt": "2026-07-06T10:45:00.000Z",
    "authors": [
      {
        "author": {
          "id": "10dda513-51a2-4374-a961-76ff1716ce75",
          "fullName": "Author Name"
        }
      }
    ],
    "categories": [
      {
        "category": {
          "id": "f0c8fd88-8eb5-493b-b6c8-dbf37d45779c",
          "name": "Category Name"
        }
      }
    ]
  },
  "meta": {}
}
```

#### Error Responses
- **400 Bad Request** — Invalid UUID path parameter, or the book is not soft-deleted.
  ```json
  {
    "success": false,
    "message": "Invalid book ID."
  }
  ```
  or
  ```json
  {
    "success": false,
    "message": "Book must be soft deleted before permanent deletion."
  }
  ```
- **401 Unauthorized** — Authentication header missing or token is invalid.
  ```json
  {
    "success": false,
    "message": "Authorization header is missing"
  }
  ```
- **403 Forbidden** — Authenticated user lacks `ADMIN` privileges.
  ```json
  {
    "success": false,
    "message": "Access denied. Administrator privileges required."
  }
  ```
- **404 Not Found** — The requested book could not be found.
  ```json
  {
    "success": false,
    "message": "Book not found."
  }
  ```

### Borrow Book API Specification

**POST** `/api/v1/loans`

#### Purpose
Create a new loan transaction for a member (performed by an administrator or through member self-checkout).

#### Authentication
- Authentication required (JWT Bearer Token in `Authorization` header).
- Administrator role (`ADMIN`) required.

#### Request Body
The request body is a JSON object. Both fields are required.

| Field | Type | Description |
| :--- | :--- | :--- |
| `userId` | String (UUID) | Unique identifier of the borrowing member user. |
| `copyId` | String (UUID) | Unique identifier of the specific physical book copy. |

#### Success Response
- **Status Code**: `201 Created`
- **Body**:
```json
{
  "success": true,
  "message": "Book borrowed successfully.",
  "data": {
    "id": "e4dc3a9b-c40d-45db-9c3f-801abeef7b9d",
    "userId": "d77b81ea-6619-450f-bb00-f91a92e1ee81",
    "copyId": "34c3a9bd-831d-452f-b43d-092b1ea8ef03",
    "issueDate": "2026-07-06T18:00:00.000Z",
    "dueDate": "2026-07-20T18:00:00.000Z",
    "returnDate": null,
    "fineAmount": "0",
    "status": "BORROWED",
    "createdAt": "2026-07-06T18:00:00.000Z",
    "updatedAt": "2026-07-06T18:00:00.000Z",
    "user": {
      "id": "d77b81ea-6619-450f-bb00-f91a92e1ee81",
      "username": "borrower_member",
      "email": "member@avelis.com"
    },
    "bookCopy": {
      "id": "34c3a9bd-831d-452f-b43d-092b1ea8ef03",
      "bookId": "a90f23cb-f14d-452c-bd7e-a092b1eaef01",
      "barcode": "BARCODE-1783328839393",
      "shelfLocation": "Shelf A",
      "condition": "NEW",
      "status": "BORROWED",
      "purchaseDate": null,
      "createdAt": "2026-07-06T09:00:00.000Z",
      "updatedAt": "2026-07-06T18:00:00.000Z",
      "book": {
        "id": "a90f23cb-f14d-452c-bd7e-a092b1eaef01",
        "title": "Book Title",
        "isbn": "978-3-16-148410-0"
      }
    }
  },
  "meta": {}
}
```

#### Error Responses
- **400 Bad Request** — Invalid UUID parameter check failed, or the book copy's parent book is soft-deleted, or the user is not a member.
  ```json
  {
    "success": false,
    "message": "Validation failed.",
    "errors": [
      {
        "field": "userId",
        "message": "userId is required and must be a valid UUID."
      }
    ]
  }
  ```
  or
  ```json
  {
    "success": false,
    "message": "Only members can borrow books."
  }
  ```
  or
  ```json
  {
    "success": false,
    "message": "Book is soft deleted and cannot be borrowed."
  }
  ```
- **401 Unauthorized** — Authentication header missing or token is invalid.
  ```json
  {
    "success": false,
    "message": "Authorization header is missing"
  }
  ```
- **403 Forbidden** — Authenticated user lacks `ADMIN` privileges.
  ```json
  {
    "success": false,
    "message": "Access denied. Administrator privileges required."
  }
  ```
- **404 Not Found** — The user, book copy, or book record does not exist.
  ```json
  {
    "success": false,
    "message": "Book copy not found."
  }
  ```
- **409 Conflict** — The book copy is already borrowed or is unavailable.
  ```json
  {
    "success": false,
    "message": "Book copy is unavailable."
  }
  ```

### Return Book API Specification

**POST** `/api/v1/loans/:id/return`

#### Purpose
Complete an active loan by returning its borrowed book copy.

#### Authentication
- Authentication required (JWT Bearer Token in `Authorization` header).
- Administrator role (`ADMIN`) required.

#### Request Parameters
- `id` (UUID, path parameter) — Unique identifier of the active loan.

#### Success Response
- **Status Code**: `200 OK`
- **Body**:
```json
{
  "success": true,
  "message": "Book returned successfully.",
  "data": {
    "id": "e4dc3a9b-c40d-45db-9c3f-801abeef7b9d",
    "userId": "d77b81ea-6619-450f-bb00-f91a92e1ee81",
    "copyId": "34c3a9bd-831d-452f-b43d-092b1ea8ef03",
    "issueDate": "2026-07-06T18:00:00.000Z",
    "dueDate": "2026-07-20T18:00:00.000Z",
    "returnDate": "2026-07-06T18:30:00.000Z",
    "fineAmount": "0",
    "status": "RETURNED",
    "createdAt": "2026-07-06T18:00:00.000Z",
    "updatedAt": "2026-07-06T18:30:00.000Z",
    "user": {
      "id": "d77b81ea-6619-450f-bb00-f91a92e1ee81",
      "username": "borrower_member",
      "email": "member@avelis.com"
    },
    "bookCopy": {
      "id": "34c3a9bd-831d-452f-b43d-092b1ea8ef03",
      "bookId": "a90f23cb-f14d-452c-bd7e-a092b1eaef01",
      "barcode": "BARCODE-1783328839393",
      "shelfLocation": "Shelf A",
      "condition": "NEW",
      "status": "AVAILABLE",
      "purchaseDate": null,
      "createdAt": "2026-07-06T09:00:00.000Z",
      "updatedAt": "2026-07-06T18:30:00.000Z",
      "book": {
        "id": "a90f23cb-f14d-452c-bd7e-a092b1eaef01",
        "title": "Book Title",
        "isbn": "978-3-16-148410-0"
      }
    }
  },
  "meta": {}
}
```

#### Error Responses
- **400 Bad Request** — Invalid UUID path parameter format, or the loan is already returned.
  ```json
  {
    "success": false,
    "message": "Invalid loan ID."
  }
  ```
  or
  ```json
  {
    "success": false,
    "message": "Loan already returned."
  }
  ```
- **401 Unauthorized** — Authentication header missing or token is invalid.
  ```json
  {
    "success": false,
    "message": "Authorization header is missing"
  }
  ```
- **403 Forbidden** — Authenticated user lacks `ADMIN` privileges.
  ```json
  {
    "success": false,
    "message": "Access denied. Administrator privileges required."
  }
  ```
- **404 Not Found** — The loan record or associated copy does not exist.
  ```json
  {
    "success": false,
    "message": "Loan not found."
  }
  ```

### Get Loan by ID API Specification

**GET** `/api/v1/loans/:id`

#### Purpose
Retrieve details of a specific loan by its ID.

#### Authentication
- Authentication required (JWT Bearer Token in `Authorization` header).
- Accessible by `ADMIN` users, or by the owning `MEMBER` of the loan.

#### Request Parameters
- `id` (UUID, path parameter) — Unique identifier of the loan.

#### Success Response
- **Status Code**: `200 OK`
- **Body**:
```json
{
  "success": true,
  "message": "Loan retrieved successfully.",
  "data": {
    "id": "e4dc3a9b-c40d-45db-9c3f-801abeef7b9d",
    "userId": "d77b81ea-6619-450f-bb00-f91a92e1ee81",
    "copyId": "34c3a9bd-831d-452f-b43d-092b1ea8ef03",
    "issueDate": "2026-07-06T18:00:00.000Z",
    "dueDate": "2026-07-20T18:00:00.000Z",
    "returnDate": "2026-07-06T18:30:00.000Z",
    "fineAmount": "0",
    "status": "RETURNED",
    "createdAt": "2026-07-06T18:00:00.000Z",
    "updatedAt": "2026-07-06T18:30:00.000Z",
    "user": {
      "id": "d77b81ea-6619-450f-bb00-f91a92e1ee81",
      "username": "borrower_member",
      "email": "member@avelis.com"
    },
    "bookCopy": {
      "id": "34c3a9bd-831d-452f-b43d-092b1ea8ef03",
      "bookId": "a90f23cb-f14d-452c-bd7e-a092b1eaef01",
      "barcode": "BARCODE-1783328839393",
      "shelfLocation": "Shelf A",
      "condition": "NEW",
      "status": "AVAILABLE",
      "purchaseDate": null,
      "createdAt": "2026-07-06T09:00:00.000Z",
      "updatedAt": "2026-07-06T18:30:00.000Z",
      "book": {
        "id": "a90f23cb-f14d-452c-bd7e-a092b1eaef01",
        "title": "Book Title",
        "isbn": "978-3-16-148410-0"
      }
    }
  },
  "meta": {}
}
```

#### Error Responses
- **400 Bad Request** — Invalid UUID path parameter format.
  ```json
  {
    "success": false,
    "message": "Invalid loan ID."
  }
  ```
- **401 Unauthorized** — Authentication header missing or token is invalid.
  ```json
  {
    "success": false,
    "message": "Authorization header is missing"
  }
  ```
- **403 Forbidden** — A `MEMBER` user attempts to retrieve another user's loan record.
  ```json
  {
    "success": false,
    "message": "Access denied. You can only retrieve your own loans."
  }
  ```
- **404 Not Found** — The loan record does not exist.
  ```json
  {
    "success": false,
    "message": "Loan not found."
  }
  ```

### Get All Loans API Specification

**GET** `/api/v1/loans`

#### Purpose
Retrieve a paginated, sorted, and filtered list of all loans (Admin only).

#### Authentication
- Authentication required (JWT Bearer Token in `Authorization` header).
- Administrator role (`ADMIN`) required.

#### Request Query Parameters
All query parameters are optional.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `page` | Integer | `1` | Current page number. |
| `limit` | Integer | `10` | Number of items per page (maximum `100`). |
| `sortBy` | String | `createdAt` | Field to sort by. Allowed: `issueDate`, `dueDate`, `returnDate`, `createdAt`. |
| `sortOrder` | String | `desc` | Sorting direction. Allowed: `asc`, `desc`. |
| `status` | String | None | Filter by loan status. Allowed: `BORROWED`, `RETURNED`. |
| `userId` | String (UUID) | None | Filter by borrower user ID. |
| `copyId` | String (UUID) | None | Filter by physical book copy ID. |

#### Success Response
- **Status Code**: `200 OK`
- **Body**:
```json
{
  "success": true,
  "message": "Loans retrieved successfully.",
  "data": [
    {
      "id": "e4dc3a9b-c40d-45db-9c3f-801abeef7b9d",
      "userId": "d77b81ea-6619-450f-bb00-f91a92e1ee81",
      "copyId": "34c3a9bd-831d-452f-b43d-092b1ea8ef03",
      "issueDate": "2026-07-06T18:00:00.000Z",
      "dueDate": "2026-07-20T18:00:00.000Z",
      "returnDate": "2026-07-06T18:30:00.000Z",
      "fineAmount": "0",
      "status": "RETURNED",
      "createdAt": "2026-07-06T18:00:00.000Z",
      "updatedAt": "2026-07-06T18:30:00.000Z",
      "user": {
        "id": "d77b81ea-6619-450f-bb00-f91a92e1ee81",
        "username": "borrower_member",
        "email": "member@avelis.com"
      },
      "bookCopy": {
        "id": "34c3a9bd-831d-452f-b43d-092b1ea8ef03",
        "bookId": "a90f23cb-f14d-452c-bd7e-a092b1eaef01",
        "barcode": "BARCODE-1783328839393",
        "shelfLocation": "Shelf A",
        "condition": "NEW",
        "status": "AVAILABLE",
        "purchaseDate": null,
        "createdAt": "2026-07-06T09:00:00.000Z",
        "updatedAt": "2026-07-06T18:30:00.000Z",
        "book": {
          "id": "a90f23cb-f14d-452c-bd7e-a092b1eaef01",
          "title": "Book Title",
          "isbn": "978-3-16-148410-0"
        }
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalResults": 1,
    "totalPages": 1
  }
}
```

#### Error Responses
- **400 Bad Request** — Invalid query parameter types, negative integer values, invalid UUID filters, invalid sort fields, or invalid statuses.
  ```json
  {
    "success": false,
    "message": "Validation failed.",
    "errors": [
      {
        "field": "page",
        "message": "Page must be a positive integer."
      }
    ]
  }
  ```
- **401 Unauthorized** — Authentication header missing or token is invalid.
  ```json
  {
    "success": false,
    "message": "Authorization header is missing"
  }
  ```
- **403 Forbidden** — Authenticated user lacks `ADMIN` privileges.
  ```json
  {
    "success": false,
    "message": "Access denied. Administrator privileges required."
  }
  ```

### Get Current User Loans API Specification

**GET** `/api/v1/loans/me`

#### Purpose
Retrieve a paginated, sorted, and filtered list of the current authenticated user's loans.

#### Authentication
- Authentication required (JWT Bearer Token in `Authorization` header).
- Accessible by all authenticated users (members get their own records, admin get their own records).

#### Request Query Parameters
All query parameters are optional.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `page` | Integer | `1` | Current page number. |
| `limit` | Integer | `10` | Number of items per page (maximum `100`). |
| `sortBy` | String | `createdAt` | Field to sort by. Allowed: `issueDate`, `dueDate`, `returnDate`, `createdAt`. |
| `sortOrder` | String | `desc` | Sorting direction. Allowed: `asc`, `desc`. |
| `status` | String | None | Filter by loan status. Allowed: `BORROWED`, `RETURNED`. |
| `copyId` | String (UUID) | None | Filter by physical book copy ID. |

*(Note: Supplying a `userId` in the query string is ignored; it is always overwritten by the authenticated user's ID on the server.)*

#### Success Response
- **Status Code**: `200 OK`
- **Body**:
```json
{
  "success": true,
  "message": "Loans retrieved successfully.",
  "data": [
    {
      "id": "e4dc3a9b-c40d-45db-9c3f-801abeef7b9d",
      "userId": "d77b81ea-6619-450f-bb00-f91a92e1ee81",
      "copyId": "34c3a9bd-831d-452f-b43d-092b1ea8ef03",
      "issueDate": "2026-07-06T18:00:00.000Z",
      "dueDate": "2026-07-20T18:00:00.000Z",
      "returnDate": "2026-07-06T18:30:00.000Z",
      "fineAmount": "0",
      "status": "RETURNED",
      "createdAt": "2026-07-06T18:00:00.000Z",
      "updatedAt": "2026-07-06T18:30:00.000Z",
      "user": {
        "id": "d77b81ea-6619-450f-bb00-f91a92e1ee81",
        "username": "borrower_member",
        "email": "member@avelis.com"
      },
      "bookCopy": {
        "id": "34c3a9bd-831d-452f-b43d-092b1ea8ef03",
        "bookId": "a90f23cb-f14d-452c-bd7e-a092b1eaef01",
        "barcode": "BARCODE-1783328839393",
        "shelfLocation": "Shelf A",
        "condition": "NEW",
        "status": "AVAILABLE",
        "purchaseDate": null,
        "createdAt": "2026-07-06T09:00:00.000Z",
        "updatedAt": "2026-07-06T18:30:00.000Z",
        "book": {
          "id": "a90f23cb-f14d-452c-bd7e-a092b1eaef01",
          "title": "Book Title",
          "isbn": "978-3-16-148410-0"
        }
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalResults": 1,
    "totalPages": 1
  }
}
```

#### Error Responses
- **400 Bad Request** — Invalid query parameter types, negative integer values, invalid UUID filters, invalid sort fields, or invalid statuses.
  ```json
  {
    "success": false,
    "message": "Validation failed.",
    "errors": [
      {
        "field": "page",
        "message": "Page must be a positive integer."
      }
    ]
  }
  ```
- **401 Unauthorized** — Authentication header missing or token is invalid.
  ```json
  {
    "success": false,
    "message": "Authorization header is missing"
  }
  ```

### Return Book / Complete Loan API Specification (Phase 9.7)

**PATCH** `/api/v1/loans/:id/return`

#### Purpose
Complete an active loan by returning its borrowed book copy (Admin only).

#### Authentication
- Authentication required (JWT Bearer Token in `Authorization` header).
- Administrator role (`ADMIN`) required.

#### Request Parameters
- `id` (Path parameter, String/UUID) — The unique ID of the loan record to return.

#### Success Response
- **Status Code**: `200 OK`
- **Body**:
```json
{
  "success": true,
  "message": "Book returned successfully.",
  "data": {
    "id": "e4dc3a9b-c40d-45db-9c3f-801abeef7b9d",
    "userId": "d77b81ea-6619-450f-bb00-f91a92e1ee81",
    "copyId": "34c3a9bd-831d-452f-b43d-092b1ea8ef03",
    "issueDate": "2026-07-06T18:00:00.000Z",
    "dueDate": "2026-07-20T18:00:00.000Z",
    "returnDate": "2026-07-06T18:30:00.000Z",
    "fineAmount": "0",
    "status": "RETURNED",
    "createdAt": "2026-07-06T18:00:00.000Z",
    "updatedAt": "2026-07-06T18:30:00.000Z",
    "user": {
      "id": "d77b81ea-6619-450f-bb00-f91a92e1ee81",
      "username": "borrower_member",
      "email": "member@avelis.com"
    },
    "bookCopy": {
      "id": "34c3a9bd-831d-452f-b43d-092b1ea8ef03",
      "bookId": "a90f23cb-f14d-452c-bd7e-a092b1eaef01",
      "barcode": "BARCODE-1783328839393",
      "shelfLocation": "Shelf A",
      "condition": "NEW",
      "status": "AVAILABLE",
      "purchaseDate": null,
      "createdAt": "2026-07-06T09:00:00.000Z",
      "updatedAt": "2026-07-06T18:30:00.000Z",
      "book": {
        "id": "a90f23cb-f14d-452c-bd7e-a092b1eaef01",
        "title": "Book Title",
        "isbn": "978-3-16-148410-0"
      }
    }
  }
}
```

#### Error Responses
- **400 Bad Request** — Invalid loan ID (non-UUID format), or the loan is already returned.
  ```json
  {
    "success": false,
    "message": "Loan already returned."
  }
  ```
- **401 Unauthorized** — Authentication header missing or token is invalid.
  ```json
  {
    "success": false,
    "message": "Authorization header is missing"
  }
  ```
- **403 Forbidden** — Authenticated user lacks `ADMIN` privileges.
  ```json
  {
    "success": false,
    "message": "Access denied. Administrator privileges required."
  }
  ```
- **404 Not Found** — The loan record or the associated book copy does not exist.
  ```json
  {
    "success": false,
    "message": "Loan not found."
  }
  ```

### Overdue Loan Detection & Status Management API Specification (Phase 9.8)

**POST** `/api/v1/loans/overdue/sync`

#### Purpose
Detect active loans whose due date has passed and transition them from `BORROWED` to `OVERDUE` in bulk (Admin only).

#### Authentication
- Authentication required (JWT Bearer Token in `Authorization` header).
- Administrator role (`ADMIN`) required.

#### Request Body
- None required.

#### Success Response
- **Status Code**: `200 OK`
- **Body**:
```json
{
  "success": true,
  "message": "Overdue loans synchronized successfully.",
  "data": {
    "updatedCount": 2,
    "checkedAt": "2026-07-06T13:50:30.123Z"
  },
  "meta": {}
}
```

#### Error Responses
- **401 Unauthorized** — Authentication header missing or token is invalid.
  ```json
  {
    "success": false,
    "message": "Authorization header is missing"
  }
  ```
- **403 Forbidden** — Authenticated user lacks `ADMIN` privileges.
  ```json
  {
    "success": false,
    "message": "Access denied. Administrator privileges required."
  }
  ```

---

### Create Reservation API Specification (Phase 10.2)

**POST** `/api/v1/reservations`

#### Purpose
Create a book reservation for a member. If a physical copy of the book is `AVAILABLE`, it will be immediately allocated and reserved for pickup. Otherwise, it will enter the `PENDING` queue.

#### Authentication
- Authentication required (JWT Bearer Token in `Authorization` header).
- Members (`MEMBER` role) may reserve books for themselves only.
- Administrators (`ADMIN` role) may reserve books for any member.

#### Request Body
```json
{
  "bookId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "userId": "f8e7d6c5-b4a3-2f1e-0d9c-8b7a6f5e4d3c"
}
```
*Note: `userId` is optional for Administrators and ignored for Members (who are only allowed to reserve for themselves).*

#### Success Response (READY_FOR_PICKUP)
- **Status Code**: `201 Created`
- **Body**:
```json
{
  "success": true,
  "message": "Reservation created successfully.",
  "data": {
    "id": "e4d3c2b1-a0f9-8e7d-6c5b-4a3f2e1d0c9b",
    "userId": "f8e7d6c5-b4a3-2f1e-0d9c-8b7a6f5e4d3c",
    "bookId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "copyId": "c5b4a3f2-e1d0-9c8b-7a6f-5e4d3c2b1a0f",
    "status": "READY_FOR_PICKUP",
    "createdAt": "2026-07-07T10:45:00.000Z",
    "updatedAt": "2026-07-07T10:45:00.000Z",
    "fulfilledAt": "2026-07-07T10:45:00.000Z",
    "cancelledAt": null,
    "expiresAt": "2026-07-09T10:45:00.000Z",
    "user": {
      "id": "f8e7d6c5-b4a3-2f1e-0d9c-8b7a6f5e4d3c",
      "username": "res_member",
      "email": "res_member@avelis.com"
    },
    "book": {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "title": "Clean Code",
      "isbn": "9780132350884"
    },
    "bookCopy": {
      "id": "c5b4a3f2-e1d0-9c8b-7a6f-5e4d3c2b1a0f",
      "barcode": "BC-12345",
      "shelfLocation": "Aisle 3",
      "condition": "NEW",
      "status": "RESERVED"
    }
  },
  "meta": {}
}
```

#### Success Response (PENDING)
- **Status Code**: `201 Created`
- **Body**:
```json
{
  "success": true,
  "message": "Reservation created successfully.",
  "data": {
    "id": "e4d3c2b1-a0f9-8e7d-6c5b-4a3f2e1d0c9b",
    "userId": "f8e7d6c5-b4a3-2f1e-0d9c-8b7a6f5e4d3c",
    "bookId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    "copyId": null,
    "status": "PENDING",
    "createdAt": "2026-07-07T10:45:00.000Z",
    "updatedAt": "2026-07-07T10:45:00.000Z",
    "fulfilledAt": null,
    "cancelledAt": null,
    "expiresAt": null,
    "user": {
      "id": "f8e7d6c5-b4a3-2f1e-0d9c-8b7a6f5e4d3c",
      "username": "res_member",
      "email": "res_member@avelis.com"
    },
    "book": {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "title": "Clean Code",
      "isbn": "9780132350884"
    },
    "bookCopy": null
  },
  "meta": {}
}
```

#### Error Responses
- **400 Bad Request** — Validation failed, active limit reached, active overdue loans present, duplicate active reservation, or no physical copies exist.
  ```json
  {
    "success": false,
    "message": "Cannot create reservation. User has active overdue loans.",
    "errors": []
  }
  ```
- **401 Unauthorized** — Authentication header is missing or token is invalid.
- **403 Forbidden** — Member attempts to create a reservation for another user.
- **404 Not Found** — Book or targeted user not found.

---

## Current Development Progress

### Completed
- Premium layout landing page
- Responsive user navigation headers
- Visual assets hero panel
- Library item browse collection view
- Reading Journal log templates
- Interactive Dashboard metrics UI
- Framer Motion micro-interactions
- Reusable modular components structure
- Express API server initialization
- Prisma configuration and schema mapping
- Relational schema initial migration and client generation
- Secure JWT-based backend authentication system (Phase 6)
- Password hashing using bcrypt and custom request payload validation
- Request interception middleware and current authenticated user retrieval endpoint
- User Profile & Password Actions (Profile retrieval, username updates, and password updates) (Phase 7)
- Admin User & Status Management (Retrieve users list, view user details, update user roles, and activate/deactivate status) (Phase 7)
- Book Management APIs (Create Book, Get All Books, Get Book by ID, and Update Book APIs) (Phase 8)
- Soft Delete Book API (validation, service, controller, route, and public read integrations) (Phase 8.5)
- Restore Book API (validation, service, controller, route, and visibility integrations) (Phase 8.6)
- Permanent Delete Book API (service, controller, route, and E2E testing) (Phase 8.7)
- Book Management Testing & Documentation (comprehensive E2E verification and module documentation) (Phase 8.8)
- Book Module Production Refinement (Phase 8.9)
- Loan Management Module (CRUD, checkout/checkin, ownership isolation, and overdue sync operations) (Phase 9)

### In Progress
- Order invoicing and bookstore purchase pipeline (Phase 10)

### Planned
- Production build configurations and server deployment

---

## Future Enhancements

The following features are planned for future releases to expand the capabilities of AVELIS:
- **QR Code Book Checkout**: Generate unique QR codes for physical book copies to allow mobile checking out.
- **Barcode Scanner Integration**: Integrate camera scanning modules to look up book catalog items automatically via barcodes.
- **Email Notifications**: Automate dispatch of borrow summaries, return deadlines, and overdue fines reminders.
- **Wishlist**: Allow users to bookmark books for future loans or purchases.
- **Personalized Book Recommendations**: Build a genre recommendation engine matching books to user reading history.
- **Reading Analytics Dashboard**: Display reading history statistics, pages read counts, and loan statistics visually.
- **Docker Support**: Containerize application environments to simplify deployments.
- **CI/CD Pipeline (GitHub Actions)**: Automate linting, schema validation, and builds through GitHub Actions.
- **Progressive Web App (PWA)**: Add manifest and service workers for offline accessibility.
- **Dark / Light Theme**: Standardize visual configurations to allow system theme preferences.
- **Multi-language Support**: Support localized translations for English, Spanish, and other languages.

### Upcoming Administrative Enhancements
- **Admin Safety Guard**: Prevent deactivation of the last active administrator account to avoid system lockout.
- **Administrative Audit Logging**: Track all administrative actions, details, and timestamps.
- **Role Change History**: Maintain a ledger of user role transitions and the admin who authorized them.
- **Administrative Activity Logs**: Provide visual log explorer interfaces for administrators to trace system edits.
- **Configurable User Sorting and Filtering**: Allow sorting list results by multiple database fields.
- **Pagination for Large User Datasets**: Further scaling of large user datasets with cursor-based pagination.

---

## Roadmap

### Project Phases

#### Completed
* ✅ Backend Authentication Setup
* ✅ User Registration
* ✅ User Login
* ✅ Protected Routes
* ✅ Phase 7 – User Management & Profiles
* ✅ Phase 8.4 – Book Update API
* ✅ Phase 8.5 – Soft Delete Book API
* ✅ Phase 8.6 – Restore Book API
* ✅ Phase 8.7 – Permanent Delete Book API
* ✅ Phase 8.9 – Book Module Production Refinement
* ✅ Phase 9.1 – Loan Database Review & Business Rules
* ✅ Phase 9.2 – Borrow Book Service
* ✅ Phase 9.3 – Return Book Service
* ✅ Phase 9.4 – Get Loan by ID
* ✅ Phase 9.5 – Get All Loans
* ✅ Phase 9.6 – Get Current User Loans
* ✅ Phase 9.7 – Return Book / Complete Loan
* ✅ Phase 9.8 – Overdue Loan Detection & Status Management
* ✅ Phase 9.9 – Loan History Consistency & Production Refinement
* ✅ Phase 10.2 – Create Reservation API

#### Current Focus
* 🚧 Phase 10.3 – Get Reservation by ID

#### Planned
* Loan Management
* Orders
* Reviews
* Production Security
* Testing
* Deployment

### Component Roadmap

| Module | Completed Features | In Progress Features | Planned Features |
| :--- | :--- | :--- | :--- |
| **Frontend** | Landing Page, Navigation, Hero Panel, Collections, Library page, Reading Journal logs, Dashboard UI | Connecting Login View inputs to authentication APIs | User profile edit dialogs, interactive catalog searches, custom themes |
| **Backend** | Server structure, Express framework configuration, Prisma configuration, JWT Authentication, Registration & Login APIs, Protected Routes, User Management & Profile APIs, Book Management APIs (Create, Get All, Get by ID, Update, Soft Delete, Restore, Permanent Delete), Borrow Book Service, Return Book Service, Get Loan by ID Service, Get All Loans Service, Get Current User Loans Service, Return Book / Complete Loan Service, Overdue Loan Detection & Status Sync Service, Production Audited Code | ✅ Complete & Production-Ready | Inventory management, Checkout/checkin transactions, Loan Management |
| **DevOps** | Project scaffolding, Oxlint linter integration, workspace dependencies | Setup environment template | API deployment pipelines, production server environment setups |

---

## Deployment Status

| Component | Status |
| :--- | :--- |
| **Frontend** | Planned |
| **Backend** | Planned |
| **Database** | Planned |
| **Production** | Planned |

---

## Screenshots

<!-- Replace with actual Home Page screenshot -->
### Home Page
![Home Page Placeholder](docs/images/screenshots/home.png)
*Figure 1: High-fidelity landing page featuring modern typography and navigation.*

<!-- Replace with actual Collections screenshot -->
### Collections
![Collections Placeholder](docs/images/screenshots/collections.png)
*Figure 2: Curated catalog collections interface allowing users to explore library lists.*

<!-- Replace with actual Library Shelf screenshot -->
### Library Shelf
![Library Shelf Placeholder](docs/images/screenshots/library.png)
*Figure 3: Personal index where users can manage their private bookshelves.*

<!-- Replace with actual User Dashboard screenshot -->
### User Dashboard
![Dashboard Placeholder](docs/images/screenshots/dashboard.png)
*Figure 4: Dynamic statistics visualizing user activity metrics.*

<!-- Replace with actual Reading Journal screenshot -->
### Reading Journal
![Reading Journal Placeholder](docs/images/screenshots/journal.png)
*Figure 5: Personal journal for documenting thoughts, page completions, and reviews.*

---

## Contributing

This application is primarily a personal portfolio project. Suggestions, feedback, and issue reporting are highly welcomed. 

If you would like to contribute:
1. Fork the project repository.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your modifications (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request for review.

---

## License

This project is licensed under the **ISC License** — see the `server/package.json` file details.

---

## Author

**Aadit Gupta**
- GitHub: [@Aaditgupta1234](https://github.com/Aaditgupta1234)
