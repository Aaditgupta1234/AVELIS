# AVELIS — Enterprise Digital Library Management System

AVELIS is a production-ready, full-stack digital library management system built with React 19, Node.js, Express, Prisma ORM, and PostgreSQL. It combines a fluid, responsive client interface with an enterprise-grade backend architecture.

---

[![Version](https://img.shields.io/badge/Version-v1.0.0-gold.svg)](#)
[![Build](https://img.shields.io/badge/Build-Passing-emerald.svg)](#)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](#)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat&logo=react&logoColor=black)](#)
[![Express.js](https://img.shields.io/badge/Express-4.x-000000.svg?style=flat&logo=express&logoColor=white)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B-4169E1.svg?style=flat&logo=postgresql&logoColor=white)](#)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748.svg?style=flat&logo=prisma&logoColor=white)](#)

---

## Live Demo

* **Frontend Application:** `<DEPLOYMENT_URL>` *(e.g. https://avelis-library.vercel.app)*
* **Backend API Health Check:** `<API_HEALTH_URL>` *(e.g. https://api.avelis-library.com/api/v1)*
* **Interactive API Reference:** See [docs/API.md](docs/API.md)

---

> [!IMPORTANT]
> **Production Highlights**
> * **Secure Authentication:** JWT-based sessions with password hashing and Role-Based Access Control (RBAC).
> * **Layered Architecture:** Strict isolation between HTTP controllers, domain service logic, and database access.
> * **Transactional Integrity:** ACID-compliant operations via Prisma ORM & PostgreSQL.
> * **Optimistic UI Sync:** Instant client feedback with state rollbacks on API failures.
> * **Hardened Security:** Integrated Helmet headers, IP rate limiting, request slowdown throttling, and PII-redacted structured logging.

---

## Table of Contents

* [Project Overview](#project-overview)
* [Why AVELIS?](#why-avelis)
* [Key Features](#key-features)
* [Technology Stack](#technology-stack)
* [Architecture Overview](#architecture-overview)
* [Project Structure](#project-structure)
* [Installation & Setup](#installation--setup)
* [Environment Variables](#environment-variables)
* [Execution Commands](#execution-commands)
* [API Directory](#api-directory)
* [Screenshots](#screenshots)
* [Production Capabilities](#production-capabilities)
* [Project Status](#project-status)
* [Current Limitations](#current-limitations)
* [Future Roadmap](#future-roadmap)
* [Documentation Directory](#documentation-directory)
* [Contributing & License](#contributing--license)

---

## Project Overview

AVELIS is a production-ready full-stack Library Management System designed to deliver a modern digital library experience. The application seamlessly handles user authentication, library catalog search, physical book checkout management, FIFO hold queue reservations, reader reviews, and administrative catalog controls.

Built with a decoupled architecture, AVELIS pairs a dynamic React single-page application with a high-performance Express REST API. The system enforces strict access policies for standard library members versus administrative staff while maintaining optimistic client state synchronization.

---

## Why AVELIS?

AVELIS was built as a production-quality portfolio project to demonstrate modern full-stack software engineering practices. Rather than focusing solely on basic CRUD operations, it emphasizes:

* **Separation of Concerns:** Clear boundaries between presentation components, state providers, service mappers, API controllers, and ORM abstractions.
* **Resilient Data Processing:** Transactional safeguards to prevent inventory overselling and concurrent hold allocation race conditions.
* **User-Centric Experience:** Optimistic UI state updates, clear feedback toasts, archive-themed loading skeletons, and responsive layouts.
* **Production Security:** Multi-layered defense including security headers, request sanitization, CORS policy enforcement, rate limiting, and encrypted token sessions.

---

## Key Features

### 🔑 Authentication & Authorization
* **JWT Authentication:** Stateful token issuing with secure client storage and auto-renewal checks (`GET /users/me`).
* **Session Persistence:** Persistent user sessions across page refreshes with automatic session restoration.
* **Role-Based Access Control (RBAC):** Tiered privilege scopes distinguishing `MEMBER` users from `ADMIN` staff.
* **Protected Routes:** Route guards redirecting unauthorized users with return-path state.

### 📚 Books & Catalog
* **Catalog Explorer:** Paginated catalog browsing with cover preview and inventory status.
* **Real-time Search:** Instant keyword filtering by book title, author, category, or ISBN.
* **Category Filtering:** Dynamic genre classification filters.
* **Book Details:** Comprehensive metadata view including publication year, publisher, ISBN, stock status, and community ratings.
* **Admin Book Management:** Full CRUD matrix allowing administrators to add, update, soft-delete, or restore catalog books.

### 📖 Loan Management
* **Borrow Books:** One-click book allocation for available physical copies.
* **Loan Renewals:** Extension of borrow periods with enforceable renewal limits (up to 3x).
* **Return Processing:** Seamless return workflow updating copy status back to `AVAILABLE`.
* **Active Loans:** Real-time tracking of checked-out books, due dates, and overdue status indicators.
* **Borrow History:** Historical archive logging past borrowing transactions.

### 🔖 Hold Queue & Reservations
* **Place Hold:** FIFO queue hold creation for borrowable books (`POST /reservations`).
* **Active Holds Tracking:** Dedicated dashboard tab displaying pending queue positions and ready-for-pickup notifications.
* **Pickup Expiration Window:** Automatic hold expiration tracking for fulfilled book holds.
* **Cancel Hold:** Instant cancellation of active hold requests.

### ⭐ Reviews & Ratings
* **Reader Reviews:** Member review submission with custom star ratings (1–5) and commentary.
* **Rating Statistics:** Aggregated book statistics including average rating and distribution breakdown.
* **Single Review Constraint:** Enforces one review per user per book with update/delete capabilities.
* **Null-Rating Handling:** Standardized `—` indicator for unreviewed books across catalog and detail views.

### 📊 Dashboard & User Workspace
* **Member Dashboard:** Personalized dashboard featuring user greeting, account role, and active session badges.
* **Continue Reading Panel:** Highlighted active checkout card showing progress percentage and days remaining.
* **Live Statistics:** Real-time count tiles for Active Checkouts, Active Holds, Borrow History, and Overdue items.
* **Tabbed Bento Workspace:** Integrated views for Active Checkouts, Borrow History, and Active Holds.
* **Dynamic Recommendations:** Curated book suggestions pulled from live catalog inventory.
* **Recently Visited:** Quick access list derived from user reading history and review activity.
* **Profile Management:** Custom display name, biography updates, avatar management, and security password changes.

---

## Technology Stack

| Category | Technology | Usage |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19** & **Vite 8** | Single Page Application framework & build tool |
| **Styling & UI** | **Tailwind CSS v4** | Vanilla utility-first styling with modern design tokens |
| **Animations & Icons** | **Framer Motion** & **Lucide React** | Micro-interactions, transitions, and icons |
| **HTTP Client** | **Axios** | API request handler with standard interceptors |
| **Backend Runtime** | **Node.js 22** & **Express 4.x** | REST API engine and middleware pipeline |
| **Database & ORM** | **PostgreSQL 16+** & **Prisma ORM 6.x** | Relational database & type-safe data access |
| **Security & Auth** | **JWT**, **bcryptjs**, **Helmet** | Authentication, password hashing, and HTTP hardening |
| **Protection & Logging** | **express-rate-limit**, **Winston** | Rate limiting, request slowdown, and structured logging |

---

## Architecture Overview

AVELIS enforces a 9-layer decoupled request-flow architecture:

```mermaid
graph TD
    UI[React 19 SPA] --> Context[Context API State Providers]
    Context --> HTTP[Axios HTTP Service Client]
    HTTP --> Express[Express REST API]
    Express --> Middleware[Auth & Validation Middleware]
    Middleware --> Controller[Controller Layer]
    Controller --> Service[Domain Service Layer]
    Service --> Prisma[Prisma ORM Client]
    Prisma --> DB[(PostgreSQL Database)]
```

### Layer Responsibilities
1. **React SPA:** Render presentation components, handle layout state, and capture user actions.
2. **Context API:** Manage domain state (`Auth`, `Books`, `Loans`, `Reservations`, `Reviews`) with optimistic updates.
3. **Axios Client:** Execute API requests using centralized configuration and error normalization.
4. **Express REST API:** Mount base routes under `/api/v1` and handle HTTP request lifecycle.
5. **Middleware Layer:** Execute CORS policy checks, rate limiting, Helmet headers, JWT authentication, and Zod validation.
6. **Controller Layer:** Extract request parameters, invoke service logic, and format HTTP JSON responses.
7. **Service Layer:** Implement domain business rules, authorization checks, and transaction boundaries.
8. **Prisma ORM:** Abstract type-safe database queries and migrations.
9. **PostgreSQL:** Primary relational store enforcing foreign key constraints and ACID guarantees.

---

## Project Structure

```
AVELIS/
├── docs/                 # Architectural specifications, database schema, & API reference
├── server/               # Node.js & Express REST API
│   ├── prisma/           # Database schema definition, migrations, & seeders
│   └── src/              # Backend source code (controllers, services, routes, middleware)
└── src/                  # React 19 Frontend Client SPA
    ├── components/       # UI components (auth, dashboard, library, layout, common)
    ├── context/          # Context API providers (Auth, Books, Loan, Reservation, Review)
    ├── mappers/          # DTO normalization utilities
    ├── pages/            # Page-level routes (Landing, Library, BookDetails, Dashboard)
    └── services/         # API HTTP service modules
```

---

## Installation & Setup

### 1. Prerequisites
* **Node.js:** v18.x or higher (v22.x recommended)
* **PostgreSQL:** v14.x or higher
* **npm:** v9.x or higher

### 2. Clone Repository
```bash
git clone https://github.com/Aaditgupta1234/AVELIS.git
cd AVELIS
```

### 3. Install Dependencies
```bash
# Install frontend client dependencies
npm install

# Install backend server dependencies
cd server
npm install
```

### 4. Database Setup & Environment Configuration
Create a `.env` file in the `server/` directory:
```ini
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/avelis_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
CLIENT_URL="http://localhost:5173"
```

Initialize the database schema and seed data (from `server/` directory):
```bash
# Push Prisma schema to PostgreSQL database
npx prisma db push

# Seed initial categories, authors, and books
npx prisma db seed
```

---

## Environment Variables

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Application execution environment (`development`, `production`) | `development` |
| `PORT` | Backend server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/avelis_db` |
| `JWT_SECRET` | Secret key for signing and verifying JSON Web Tokens | `your-secret-key` |
| `CLIENT_URL` | Trusted origin URL for CORS validation | `http://localhost:5173` |

---

## Execution Commands

### Development
```bash
# Start backend server (from server/ folder)
npm run dev

# Start frontend client (from root folder)
npm run dev
```

### Production Build & Linting
```bash
# Run code quality linter (from root folder)
npm run lint

# Build frontend production bundle (from root folder)
npm run build

# Start production backend server (from server/ folder)
npm start
```

---

## API Directory

All backend endpoints are mounted under base path `/api/v1`. Authentication requires header `Authorization: Bearer <JWT_TOKEN>`.

| Module | Base Path | Key Operations | Access Level |
| :--- | :--- | :--- | :--- |
| **Auth** | `/api/v1/auth` | `POST /register`, `POST /login`, `GET /me` | Public / Member |
| **Users** | `/api/v1/users` | `GET /me`, `PATCH /me`, `PATCH /me/password` | Authenticated Member |
| **Books** | `/api/v1/books` | `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id` | Public / Admin Guarded |
| **Loans** | `/api/v1/loans` | `GET /active`, `GET /history`, `POST /`, `POST /:id/return`, `POST /:id/renew` | Authenticated Member |
| **Reservations** | `/api/v1/reservations` | `GET /me`, `POST /`, `PATCH /:id/cancel` | Authenticated Member |
| **Reviews** | `/api/v1/reviews` | `GET /book/:bookId`, `POST /`, `DELETE /:id`, `GET /me` | Public / Member |

*For complete endpoint request parameters, schema definitions, and response envelopes, refer to **[docs/API.md](docs/API.md)**.*

---

## Screenshots

### Landing Page
![Landing Page](docs/images/landing-page.png)
*Landing page header and hero presentation.*

### Library Catalog
![Library Catalog](docs/images/library-catalog.png)
*Paginated book repository with title/author search and category filters.*

### Book Details
![Book Details](docs/images/book-details.png)
*Book details view with stock availability, hold queue triggers, and reader reviews.*

### Member Dashboard
![Member Dashboard](docs/images/member-dashboard.png)
*User dashboard showing active checkouts, hold queues, borrowing history, and reading progress.*

### Admin Catalog Manager
![Admin Catalog Manager](docs/images/admin-catalog.png)
*Admin catalog interface allowing library staff to create, edit, and manage books.*

### Profile Management
![Profile Management](docs/images/profile-management.png)
*Profile view for avatar customization, biography updates, and account security.*

---

## Production Capabilities

* **Security Hardening:** Express security pipeline configured with Helmet, strict CORS origin controls, custom cache prevention headers, and JSON body sanitization.
* **Abuse Throttling:** Multi-stage IP rate limiting and progressive request slowdown throttling on sensitive endpoints.
* **PII Data Redaction:** Winston structured logging engine with automatic parameter redaction for sensitive fields (passwords, tokens).
* **Optimistic UI Engine:** React Context API providers perform optimistic state mutations to guarantee instant visual response, reverting gracefully upon API error responses.
* **Error Normalization:** Standardized client error handler converting backend response errors into human-readable toast notifications and field messages.

---

## Project Status

| Component | Status | Verification |
| :--- | :--- | :--- |
| **Backend API** | ✅ Complete | Fully audited with structured services & controllers |
| **Frontend SPA** | ✅ Complete | Complete user workflow views & design system |
| **Integration** | ✅ Complete | Full REST API context binding across all modules |
| **Deployment** | ✅ Complete | Production build scripts & environment configurations |
| **Production Verification** | ✅ Complete | Passing lint (`oxlint`) and production build checks |

---

## Current Limitations

The following features are **intentionally deferred** for a future release:

* **Admin Analytics API (`/admin/dashboard/analytics`)**: Backend router returns `501 Not Implemented`. Detailed system analytics charts will be implemented in a future update.
* **Admin Reports API (`/admin/dashboard/reports`)**: Backend router returns `501 Not Implemented`. Data export features are planned for a future update.
* **Orders Module**: Purchase and rental payment workflows are intentionally deferred as no backend order routes are mounted.

---

## Future Roadmap

* 🛒 **Orders & Checkout Engine:** Integration of digital book purchasing and rental payment processing.
* 📈 **Admin Analytics Dashboard:** Time-series charts and detailed inventory performance analytics.
* 🔔 **Real-time Notifications:** WebSockets integration for instantaneous hold availability notifications.
* 📱 **PWA Support:** Progressive Web Application offline caching for reading journals and downloaded books.
* ✉️ **Email Notification System:** Transactional email alerts for overdue loans and hold pickup expiration warnings.

---

## Documentation Directory

Refer to the documentation suite in **[docs/](docs/)** for technical specifications:

* **[Documentation Index](docs/README.md)** — Overview of all technical specifications.
* **[Architecture Guide](docs/ARCHITECTURE.md)** — Architectural principles, layered patterns, and component responsibilities.
* **[Database Specification](docs/DATABASE.md)** — Schema dictionaries, 3NF layout, and entity relationships.
* **[API Reference](docs/API.md)** — Endpoint definitions, request bodies, and response envelopes.
* **[Security Architecture](docs/SECURITY.md)** — RBAC roles, security headers, rate limiting, and session security.
* **[Deployment Guide](docs/DEPLOYMENT.md)** — Environment setup, build processes, and startup configuration.
* **[Testing & Verification](docs/TESTING.md)** — Testing strategies, linting setup, and verification routines.
* **[Performance & Optimization](docs/PERFORMANCE.md)** — Benchmarks, latency metrics, and query optimizations.
* **[Contributing Guidelines](docs/CONTRIBUTING.md)** — Development guidelines, Git branching, and PR workflows.

---

## Contributing & License

For development guidelines and pull request workflows, please review **[docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)**.

Distributed under the **ISC License**.

Created by **Aadit Gupta** — GitHub: [@Aaditgupta1234](https://github.com/Aaditgupta1234).
