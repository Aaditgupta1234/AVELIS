# AVELIS

AVELIS is a production-quality, premium Library Management System designed to combine a fluid, animation-rich frontend experience with an enterprise-grade backend architecture.

---

[![Project Status](https://img.shields.io/badge/Status-Active_Development-orange.svg)](#)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat&logo=react&logoColor=black)](#)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg?style=flat&logo=vite&logoColor=white)](#)
[![Express.js](https://img.shields.io/badge/Express-4.x-000000.svg?style=flat&logo=express&logoColor=white)](#)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748.svg?style=flat&logo=prisma&logoColor=white)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B-4169E1.svg?style=flat&logo=postgresql&logoColor=white)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg?style=flat&logo=tailwindcss&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](#)

---

## Table of Contents

* [Project Overview](#project-overview)
* [Known Limitations](#known-limitations)
* [Key Features](#key-features)
* [Tech Stack](#tech-stack)
* [Architecture Overview](#architecture-overview)
* [Database Schema](#database-schema)
* [Installation & Startup](#installation--startup)
* [API Directory](#api-directory)
* [Project Statistics](#project-statistics)
* [Testing & Optimization](#testing--optimization)
* [Documentation Directory](#documentation-directory)
* [Roadmap](#roadmap)
* [Screenshots](#screenshots)
* [Contributing & License](#contributing--license)

---

## Project Overview

AVELIS is designed as an advanced showcase demonstrating how a highly interactive React client can communicate with a highly optimized, layered Node.js Express API. The platform provides a modern experience for discovering book lists, checking out physical library copies, queuing hold reservations, submitting reviews, and auditing library analytics via a dashboard.

### Version Compatibility & Status

| Category | Reference |
| :--- | :--- |
| **Node.js Environment** | Tested with v22.x |
| **Project Dependencies** | Refer directly to [package.json](package.json) & [server/package.json](server/package.json) |
| **Documentation Version** | Updated through Phase 13.5.4 (Backend) |

> [!NOTE]
> **Project Status:** The Express backend is fully complete and audited through Phase 13.5.4. The React landing page is complete; integration connecting the React app's login/dashboard views to the backend API is currently in progress.

---

## Known Limitations

* **Frontend Integration:** Main frontend views (search catalog, profiles, dashboards) currently run on mock data. Direct integration with the Express REST API is pending.
* **WebSocket Feeds:** Real-time push notifications are planned but not yet implemented.
* **Security Hardening (Phase 13.6):** Additional network security features are pending.
* **Production Deployment:** Deployment scripts and production configuration are planned.

---

## Key Features

### 💻 Frontend Client
* **Responsive Layouts:** Custom viewports for mobile, tablet, and desktop.
* **Collections Explorer:** Browse catalog selections and genres.
* **Reading Journal:** Personal reading diary tracking thoughts and pages read.
* **Liquid Animations:** Micro-interactions and transition animations using Framer Motion.

### ⚙️ Backend API
* **Bearer Authorization:** JWT session verification with request context bindings.
* **Inventory Control:** Copy tracking, barcodes, conditions, and shelf locations.
* **FIFO Hold Queues:** Holds database and FIFO queue resolution on releases.
* **Expiration Engine:** Automatic cleanup of expired holds and copy reassignment.
* **Moderated Reviews:** Composite-key review limits and admin deletion.

---

## Tech Stack

### Client SPA
* **React 19** & **Vite 8**
* **Tailwind CSS v4**
* **Framer Motion** & **React Router 7**

### Server API
* **Node.js** & **Express 4.21**
* **Prisma ORM 6.19** & **PostgreSQL**
* **Winston** (Structured Logger) & **Oxlint** (Linting)

---

## Architecture Overview

AVELIS separates core logic into distinct layers, isolating API routing from data access:

```mermaid
graph TD
    Client[React Client SPA] --> Router[Express Router]
    Router --> Middleware[Auth & Validation Middleware]
    Middleware --> Controller[Express Controller]
    Controller --> Service[Domain Service Layer]
    Service --> Prisma[Prisma ORM Client]
    Prisma --> DB[(PostgreSQL Database)]
```
*For detailed interaction sequences and module scopes, see **[Architecture Guide](docs/ARCHITECTURE.md)**.*

---

## Database Schema

The PostgreSQL schema is in Third Normal Form (3NF) to guarantee transactional integrity:

| Table | Focus | Table | Focus |
| :--- | :--- | :--- | :--- |
| **User** | Member and admin profiles. | **BookCopy** | Serialized physical copy instances. |
| **Book** | Abstract catalog metadata. | **Loan** | Checkout history and overdue details. |
| **Author** | Author details registry. | **Reservation**| FIFO booking hold queues. |
| **Category** | Classification genres. | **Review** | Book rating and comments. |
| **BookAuthor** | Junction: Books ⇄ Authors. | **Order** | Direct purchase headers. |
| **BookCategory**| Junction: Books ⇄ Categories. | **OrderItem** | Purchase line items. |

*For relationship mappings and ERDs, see **[Database Design Specification](docs/DATABASE.md)**.*

---

## Installation & Startup

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/Aaditgupta1234/AVELIS.git
cd AVELIS

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### 2. Configuration
Copy `server/.env.example` to `server/.env` and update the values:
```ini
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://user:pass@localhost:5432/avelis_db?schema=public"
JWT_SECRET="your-crypto-secret-key"
```

### 3. Execution
```bash
# Start backend API (from server/ folder)
npm run dev

# Start frontend Client (from root folder)
npm run dev
```

---

## API Directory

Base API path: `/api/v1`. Authentication requires `Authorization: Bearer <JWT_TOKEN>`.

| Module | Endpoints | Access |
| :--- | :--- | :--- |
| **Auth** | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | Public / Authenticated |
| **Users** | `GET /users/me`, `PATCH /users/me`, `PATCH /users/me/password` | Authenticated |
| **Books** | `GET /books`, `GET /books/:id`, `POST /books`, `PATCH /books/:id`, `DELETE /books/:id` | Public / Admin Guarded |
| **Loans** | `GET /loans`, `POST /loans`, `POST /loans/:id/return`, `GET /loans/me` | Authenticated / Admin |
| **Holds** | `POST /reservations`, `GET /reservations/:id`, `PATCH /reservations/:id/cancel` | Authenticated / Admin |
| **Reviews**| `POST /reviews`, `GET /reviews/book/:bookId`, `DELETE /reviews/:reviewId` | Members / Admin |

*For complete parameters, paths, and response envelopes, see **[API Reference](docs/API.md)**.*

---

## Project Statistics

| Category | Status |
| :--- | :--- |
| **Completed Modules** | Auth, Users, Books, Loans, Reservations, Reviews, Dashboard, Analytics, Reporting |
| **Optimization Progress** | Audited & optimized through Phase 13.5.4 |
| **Current Backend Progress** | ~95% Complete |
| **Overall Full-Stack Progress**| ~65% Complete (Frontend integration pending) |

---

## Testing & Optimization

### Automated Test Runs
All milestones include dedicated testing scripts. To run the verification suite:
```bash
cd server
node scratch/verify_phase_13.5.4.js
```
*For test setups and phase checklists, see **[Testing & Verification Guide](docs/TESTING.md)**.*

### Telemetry Benchmarks
Phase 13.5 optimizations (hoisted constants, conditional Morgan, connection singletons, and stack trace suppression) achieved:
* **Average Latency:** **-17.9%** (369.2 ms under 100 concurrent requests).
* **Throughput:** **+22.0%** (271 req/sec).
* **Memory Footprint:** **-43.9%** (down to 61.7 MB).
* *For complete metrics, see **[Performance & Optimization Report](docs/PERFORMANCE.md)**.*

---

## Documentation Directory

Refer to the documents under **[docs/](docs/)** for deep architectural specifications:

* **[Documentation Index](docs/README.md)** — Guide to files and reading sequences.
* **[Architecture Guide](docs/ARCHITECTURE.md)** — Core design principles and data flows.
* **[Database Design](docs/DATABASE.md)** — Schema dictionaries, ERD, and business constraints.
* **[API Reference](docs/API.md)** — Complete REST endpoint details.
* **[Performance Report](docs/PERFORMANCE.md)** — Optimization reports and load benchmarks.
* **[Testing Guide](docs/TESTING.md)** — Verification scripts and validation matrices.
* **[Security Architecture](docs/SECURITY.md)** — RBAC models, access keys, and secure configuration.
* **[Deployment Guide](docs/DEPLOYMENT.md)** — Configurations and startup scripts.
* **[Contributing Guidelines](docs/CONTRIBUTING.md)** — Branch structures and PR workflows.
* **[Changelog](docs/CHANGELOG.md)** — Version histories.
* **[ADRs](docs/adr/)** — Architecture Decision Records detailing design decisions.

---

## Roadmap

* [x] **v0.9.0-backend** — Feature-complete Library Management System Backend.
* [x] **v0.9.5-backend** — Phase 13.5 Database & Express Pipeline Optimizations.
* [ ] **v1.0.0-backend** — Security Hardening, Testing coverage, and Production-ready build scripts.
* [ ] **v1.0.0** — Frontend API integration, PWA, and final deployment.

---

## Screenshots

### Core Portal Landing Page
![Landing Page Screenshot](docs/images/screenshots/home.png)
*Figure 1: High-fidelity dark-themed landing view.*

### Personal Bookshelf & Reading Log
![Reading Journal Screenshot](docs/images/screenshots/journal.png)
*Figure 2: Reading journal tracking pages read and feedback.*

*For additional views (Collections, Dashboard, Shelves), see **[Asset Registry Guide](docs/images/README.md)**.*

---

## Contributing & License

For contributor instructions, branching rules, and PR flows, see **[Contributing Guidelines](docs/CONTRIBUTING.md)**.

Distributed under the **ISC License**. Created by **Aadit Gupta** — GitHub: [@Aaditgupta1234](https://github.com/Aaditgupta1234).
