# AVELIS — Production-Grade Digital Reading Platform

AVELIS is a production-grade, full-stack Digital Reading Platform that combines an immersive cloud-based reading experience with comprehensive library operations—including borrowing, FIFO reservations, in-browser PDF reading, annotations, reading progress synchronization, and role-based administration—powered by React 19, Node.js, Express, Prisma ORM, and PostgreSQL.

> **Note**
> **Portfolio Disclaimer**: AVELIS is a portfolio project created to demonstrate production-grade software engineering practices, cloud-native architecture, scalable REST APIs, and modern digital reading workflows. While fully deployed and functional, it is intended as a technical showcase rather than a commercial product.

---

[![Version](https://img.shields.io/badge/Version-v1.0.0-gold.svg)](#-project-status)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](#-license)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat&logo=react&logoColor=black)](#-technology-stack)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933.svg?style=flat&logo=nodedotjs&logoColor=white)](#-technology-stack)
[![Express.js](https://img.shields.io/badge/Express-4.x-000000.svg?style=flat&logo=express&logoColor=white)](#-technology-stack)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B-4169E1.svg?style=flat&logo=postgresql&logoColor=white)](#-technology-stack)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748.svg?style=flat&logo=prisma&logoColor=white)](#-technology-stack)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Storage-3ECF8E.svg?style=flat&logo=supabase&logoColor=white)](#-technology-stack)
[![Frontend Deployment](https://img.shields.io/badge/Vercel-Deployed-000000.svg?style=flat&logo=vercel&logoColor=white)](https://avelis-alpha.vercel.app)
[![Backend Deployment](https://img.shields.io/badge/Render-Deployed-46E3B7.svg?style=flat&logo=render&logoColor=white)](https://avelis-api.onrender.com)

---

## 📑 Table of Contents

- [🌐 Live Demo](#-live-demo)
- [📌 Project Status](#-project-status)
- [🖼️ Screenshots](#️-screenshots)
- [📖 Project Overview](#-project-overview)
- [✨ Core Highlights](#-core-highlights)
- [🔑 Key Features](#-key-features)
- [🛠️ Technology Stack](#️-technology-stack)
- [🏗️ Architecture Overview](#️-architecture-overview)
- [📁 Folder Structure](#-folder-structure)
- [🚀 Quick Start](#-quick-start)
- [📥 Installation & Setup](#-installation--setup)
- [🔐 Environment Variables](#-environment-variables)
- [💻 Running Locally](#-running-locally)
- [☁️ Production Deployment](#️-production-deployment)
- [🔌 API Overview](#-api-overview)
- [🗄️ Database Overview](#️-database-overview)
- [🛡️ Security](#️-security)
- [⚡ Performance](#-performance)
- [📚 Documentation Directory](#-documentation-directory)
- [🔮 Potential Future Enhancements](#-potential-future-enhancements)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🙏 Acknowledgements](#-acknowledgements)
- [⚠️ Disclaimer](#️-disclaimer)
- [📬 Contact](#-contact)

---

## 🌐 Live Demo

The application is deployed across cloud infrastructure:

* **Frontend Application:** [https://avelis-alpha.vercel.app](https://avelis-alpha.vercel.app)
* **Backend API Base:** [https://avelis-api.onrender.com](https://avelis-api.onrender.com)
* **API Health Endpoint:** [https://avelis-api.onrender.com/api/v1/health](https://avelis-api.onrender.com/api/v1/health)
* **Interactive API Reference:** See [docs/API.md](docs/API.md)

---

## 📌 Project Status

| Metric / Dimension | Details |
| :--- | :--- |
| **Current Version** | `v1.0.0` |
| **Development Status** | Active Portfolio Project |
| **Frontend Hosting** | Vercel (Single Page Application) |
| **Backend Hosting** | Render (Express Web Service) |
| **Database** | PostgreSQL 16 (Hosted on Supabase) |
| **Asset Storage** | Supabase Storage (Covers & Digital PDFs) |
| **Authentication** | JWT Sessions, Email/Password, Google OAuth 2.0 |

---

## 🖼️ Screenshots

> Relative visual placeholders for core application interfaces.

| Landing & 3D Hero Showcase | Catalog & Search Interface |
| :---: | :---: |
| ![Landing Page Hero](docs/images/screenshots/landing-hero.gif) | ![Catalog Search](docs/images/screenshots/catalog-search.png) |

| In-Browser PDF Reader & Annotations | Admin Management Dashboard |
| :---: | :---: |
| ![Reader Dashboard](docs/images/screenshots/reader-dashboard.png) | ![Admin Panel](docs/images/screenshots/admin-panel.png) |

---

## 📖 Project Overview

**AVELIS** bridges modern digital reading with production-grade library operations—delivering a unified platform where readers can search the digital collection, read publications directly in the browser, manage active borrowing loans, and queue reservations when inventory is checked out.

Traditional library software often relies on monolithic codebases and basic database queries. AVELIS demonstrates a clean, decoupled architecture:
1. **Frontend**: A responsive React 19 Single Page Application built with Vite and Tailwind CSS, prioritizing dynamic layout transitions, optimistic UI synchronization, and accessible reading controls.
2. **Backend**: A production-grade REST API written in Node.js and Express, following strict Controller-Service-Repository separation with Prisma ORM transactional guarantees for inventory management.

---

## ✨ Core Highlights

* **Full-Stack Architecture**: Clean separation of concerns between client components and backend REST controllers.
* **Production Cloud Deployment**: Hosted on Vercel (Frontend SPA) and Render (Backend Express API) with Supabase Cloud DB.
* **ACID Data Integrity**: PostgreSQL transactional workflows via Prisma ORM preventing inventory overselling during concurrent checkouts.
* **Dual Authentication**: Hybrid security model supporting traditional Email/Password credentials and Google OAuth 2.0.
* **In-Browser Digital Reader**: Dedicated PDF viewer equipped with reading progress persistence, custom notes, bookmarks, and highlights.
* **Role-Based Access Control**: Tiered security rules granting standard readers access while restricting catalog and user administration to platform administrators.
* **Responsive UI Design**: Tailored aesthetics built with Tailwind CSS, custom design tokens, and smooth Framer Motion micro-interactions.

---

## 🔑 Key Features

### 🔑 Authentication & Authorization
* **Dual Authentication Modes**: Email/password registration/login along with Google OAuth 2.0 authentication.
* **JWT Access Control**: Stateful bearer token issuing with client session storage and auto-validation routines.
* **Role-Based Access Control (RBAC)**: Tiered privilege enforcement distinguishing `MEMBER` readers from `ADMIN` platform administrators.
* **Protected Client Routing**: Guarded frontend routes with session return-path preservation.

### 📚 Catalog Management & Discovery
* **Content Discovery Browser**: Browse the paginated digital collection with real-time keyword search by title, author, category, or ISBN.
* **Category Filtering**: Dynamic genre classification and structured collections (e.g., Editor's Picks, Featured Authors).
* **Book Details View**: Complete book metadata, stock status indicators, publisher details, and community ratings.
* **Continue Reading Hub**: Personalized quick-access shelf displaying active digital publications and current completion percentages.

### 📖 In-Browser Digital Reader
* **PDF Document Viewer**: Direct browser-rendered digital reading interface for digital publications.
* **Reading Progress Persistence**: Real-time page tracking saving exact reading coordinates per user.
* **Personal Notes & Bookmarks**: Create, view, and organize reading bookmarks, highlights, and journal notes.

### 🔄 Loan Management Workflow
* **One-Click Borrowing**: Allocation of physical book inventory with immediate loan creation.
* **Loan Extensions & Renewals**: Self-service borrow extensions up to allowed system limits.
* **Seamless Returns**: Instant return handling updating copy availability state back to active stock.
* **Loan Tracking Dashboard**: Centralized dashboard tab highlighting checked-out titles, due dates, and overdue status warnings.

### 🔖 Hold Queue & Reservations
* **FIFO Reservation Queue**: Automated queue management allowing members to reserve checked-out books.
* **Hold Queue Tracking**: Dedicated reservation view displaying position in queue and availability status updates.

### ⭐ Reader Reviews & Ratings
* **Community Ratings**: 5-star rating system with aggregated score calculations per title.
* **User Review Journal**: Member reviews, reader feedback, and reflection notes.

### 🛠️ Administrative Management
* **Catalog Management**: Complete CRUD interface for administrators to create, update, and manage book inventories.
* **Digital File Uploads**: Streamlined file upload handlers for book cover artwork and PDF documents stored securely in Supabase Storage.
* **User Management**: Administrator interface for managing reader permissions and account statuses.

### 🛡️ System Security & Resilience
* **HTTP Security Headers**: Express integration with Helmet security headers.
* **Rate Limiting & Throttling**: IP-based rate limiters and slow-down middleware protecting endpoints from excessive requests.
* **Request Sanitization**: Payload validation and HTML string sanitization preventing XSS and injection attempts.

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **React** | `v19.2.7` | UI component architecture and client rendering |
| **Vite** | `v8.1.0` | Modern frontend build tooling with native ESM and HMR |
| **Tailwind CSS** | `v4.3.1` | Utility-first styling framework & design system |
| **Framer Motion** | `v12.42.0` | Fluid UI layout animations and micro-interactions |
| **React Router** | `v7.18.0` | Client-side routing and layout management |
| **Axios** | `v1.18.1` | HTTP client for asynchronous REST API communication |
| **Spline / 3D** | `v4.1.0` | Interactive 3D visual canvas components |

### Backend
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | `v20.x` | Server runtime environment |
| **Express.js** | `v4.x` | RESTful API routing and web application framework |
| **Prisma ORM** | `v6.x` | Type-safe database client and migration manager |
| **PostgreSQL** | `v16+` | Relational database management system |
| **JWT (jsonwebtoken)** | `v9.x` | Secure, stateful JSON Web Token authorization |
| **Helmet & Express Rate Limit** | `v7.x` | Security header enforcement and rate limiting |

### Infrastructure & Cloud Services
| Service | Provider | Function |
| :--- | :--- | :--- |
| **Frontend Hosting** | Vercel | Global CDN deployment for static SPA assets |
| **Backend API Hosting** | Render | Managed Web Service running Node.js Express server |
| **Database Hosting** | Supabase | Managed PostgreSQL cloud database instance |
| **Object Storage** | Supabase Storage | Cloud file storage for covers and PDF media |
| **OAuth Provider** | Google Identity Services | Third-party social login integration |

---

## 🏗️ Architecture Overview

AVELIS is deployed across a cloud-native stack with strict operational boundaries between presentation components, HTTP request controllers, domain business logic services, and database persistence layers.

```mermaid
flowchart TD
    subgraph Client ["Client Layer (Vercel)"]
        UI["React 19 SPA (Vite + Tailwind)"]
        Context["Context State (Auth, Library, Loan)"]
        AxiosClient["Axios HTTP Client"]
        UI --> Context
        Context --> AxiosClient
    end

    subgraph Network ["Network API Boundary"]
        HTTPS["HTTPS / REST API"]
        AxiosClient ==>|JSON Payloads| HTTPS
    end

    subgraph Server ["Server Layer (Render)"]
        Express["Express App (app.js)"]
        Security["Middleware (Helmet, Rate-Limit, CORS, JWT Auth)"]
        Controllers["API Controllers"]
        Services["Domain Services (Business Logic)"]
        Prisma["Prisma ORM Client"]

        HTTPS ==> Express
        Express --> Security
        Security --> Controllers
        Controllers --> Services
        Services --> Prisma
    end

    subgraph Data ["Data & Storage Layer (Supabase Cloud)"]
        Postgres[(PostgreSQL Database)]
        Storage[(Supabase Object Storage)]

        Prisma ==>|Database Queries| Postgres
        Services ==>|File Uploads / Presigned URLs| Storage
    end
```

For complete technical specifications, review [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 📁 Folder Structure

```text
AVELIS Repository Root
├── .env.example                # Example environment variables for Frontend
├── index.html                  # HTML entrypoint
├── package.json                # Frontend package configuration
├── vercel.json                 # Vercel deployment SPA rewrite configuration
├── vite.config.js              # Vite build setup
│
├── docs/                       # Comprehensive Technical Documentation
│   ├── API.md                  # Complete REST API specifications
│   ├── ARCHITECTURE.md         # Deep-dive system architecture guide
│   ├── DATABASE.md             # Entity Relationship & Prisma schema specs
│   ├── DEPLOYMENT.md           # Production deployment procedures
│   ├── SECURITY.md             # Threat modeling & security policy
│   ├── PERFORMANCE.md          # Optimization & caching strategies
│   ├── TESTING.md              # Quality assurance & testing suites
│   ├── CHANGELOG.md            # Version release notes
│   ├── CONTRIBUTING.md         # Developer contribution guidelines
│   └── images/                 # Architecture & ER diagrams
│
├── server/                     # Express Backend Web Service
│   ├── package.json            # Server dependencies & scripts
│   ├── nodemon.json            # Local development hot-reload config
│   ├── prisma/
│   │   ├── schema.prisma       # Database models & relationships
│   │   └── migrations/         # SQL migration history
│   └── src/
│       ├── app.js              # Express app setup & middleware stack
│       ├── server.js           # Server listener entrypoint
│       ├── config/             # Environment, security & DB configs
│       ├── controllers/        # HTTP Request & Response handlers
│       ├── middleware/         # Auth guards, validation & security
│       ├── routes/             # REST route definitions
│       ├── services/           # Business logic service layer
│       └── utils/              # ApiError, Logger, JWT helpers
│
└── src/                        # React Frontend SPA Application
    ├── main.jsx                # React app mounting script
    ├── App.jsx                 # Main application routes & context providers
    ├── api/                    # API client singletons & endpoints
    ├── components/             # Reusable UI primitives & domain components
    │   ├── auth/               # Login & profile forms
    │   ├── dashboard/          # Admin catalog manager
    │   ├── hero/               # 3D Canvas visual scenes
    │   ├── journal/            # Reader reflection editor
    │   ├── library/            # Book grid, card & search toolbar
    │   └── reader/             # In-browser digital PDF viewer modal
    ├── context/                # Global React context state managers
    ├── hooks/                  # Custom React hooks (useAuth, useLibrary)
    ├── pages/                  # Page view components (Landing, Library, Dashboard)
    ├── routes/                 # Protected route wrappers
    └── services/               # Frontend service abstractions
```

---

## 🚀 Quick Start

Get a local copy running on your machine in under two minutes:

```bash
# 1. Clone the repository
git clone https://github.com/Aaditgupta1234/AVELIS.git
cd AVELIS

# 2. Install Frontend dependencies
npm install

# 3. Install Backend dependencies
cd server
npm install
```

> Refer to the detailed [Installation & Setup](#-installation--setup) steps below to configure environment files and database connections.

---

## 📥 Installation & Setup

### Prerequisites
* **Node.js**: `v18.x` or `v20.x` (LTS recommended)
* **npm**: `v9.x` or later
* **PostgreSQL**: `v15+` local database instance OR a free **Supabase** cloud PostgreSQL account.

---

## 🔐 Environment Variables

### Frontend Configuration (`.env`)
Create a `.env` file in the root directory by copying `.env.example`:

```env
# Application Environment
NODE_ENV=development

# Backend API Endpoint
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_API_URL=http://localhost:5000/api/v1

# Supabase Credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth Client ID
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Client URL
VITE_APP_URL=http://localhost:5173
```

### Backend Configuration (`server/.env`)
Create a `.env` file inside the `server/` directory:

```env
# Environment & Server Port
NODE_ENV=development
PORT=5000

# PostgreSQL Database Connection String (Supabase or Local)
DATABASE_URL="postgresql://postgres:yourpassword@db.your-supabase-ref.supabase.co:5432/postgres?schema=public"
DIRECT_URL="postgresql://postgres:yourpassword@db.your-supabase-ref.supabase.co:5432/postgres?schema=public"

# Security & JWT Tokens
JWT_SECRET=your_super_secret_jwt_key_min_32_characters
JWT_EXPIRES_IN=7d

# CORS Allowed Origin
CORS_ORIGIN=http://localhost:5173

# Supabase Storage Integration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

---

## 💻 Running Locally

### Step 1: Initialize Database Migrations & Seeds
Inside the `server/` directory, run the Prisma migration command to prepare your PostgreSQL database schema:

```bash
cd server

# Run database migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

### Step 2: Start the Express Backend API
In the `server/` directory, start the development server:

```bash
npm run dev
# Server will start on http://localhost:5000
```

Verify backend health by visiting: `http://localhost:5000/api/v1/health`

### Step 3: Start the React Frontend Application
Open a separate terminal window at the repository root and launch the Vite dev server:

```bash
npm run dev
# Application will launch on http://localhost:5173
```

---

## ☁️ Production Deployment

### Frontend (Vercel)
The client application is optimized for deployment on Vercel as a Single Page Application:
* **Build Command**: `npm run build`
* **Output Directory**: `dist`
* **Single Page Rewrites**: Configured via `vercel.json` to handle client-side route redirects cleanly.

### Backend API (Render)
The Express API runs as a Node.js web service on Render:
* **Root Directory**: `server`
* **Build Command**: `npm install && npx prisma generate`
* **Start Command**: `node src/server.js`

For detailed production instructions, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## 🔌 API Overview

The backend exposes a structured, versioned RESTful API under `/api/v1`:

| HTTP Method | Route Endpoint | Description | Access Scope |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register a new user account | Public |
| `POST` | `/api/v1/auth/login` | Authenticate user & issue JWT | Public |
| `GET` | `/api/v1/auth/me` | Fetch active user session profile | Authenticated |
| `GET` | `/api/v1/books` | Retrieve paginated book catalog with search/filter | Public |
| `GET` | `/api/v1/books/:id` | Fetch full metadata for a specific book | Public |
| `POST` | `/api/v1/loans` | Borrow a physical copy of a book | Authenticated (`MEMBER`) |
| `POST` | `/api/v1/loans/:id/return` | Return a checked-out book copy | Authenticated (`MEMBER`) |
| `POST` | `/api/v1/reservations` | Join FIFO reservation queue for a book | Authenticated (`MEMBER`) |
| `POST` | `/api/v1/books` | Add a new book to catalog holdings | Staff (`ADMIN`) |
| `PATCH` | `/api/v1/books/:id` | Update existing catalog book metadata | Staff (`ADMIN`) |

For the complete API contract, request payload schemas, and example JSON responses, view [docs/API.md](docs/API.md).

---

## 🗄️ Database Overview

AVELIS uses **PostgreSQL** configured with strict foreign key constraints, indexes, and cascading behavior managed via **Prisma ORM**.

```text
+-------------------+       +-------------------+       +-------------------+
|       User        |       |       Book        |       |     Category      |
+-------------------+       +-------------------+       +-------------------+
| id (PK)           |       | id (PK)           |       | id (PK)           |
| email (Unique)    |       | title             |       | name (Unique)     |
| passwordHash      |       | authorId (FK) ----+-----> | slug              |
| role (MEMBER/ADMIN|       | categoryId (FK) --+--+    +-------------------+
+---------+---------+       | totalCopies       |  |
          |                 | availableCopies   |  |
          |                 +---------+---------+  |
          |                           |            |
          v                           v            |
+-------------------+       +-------------------+  |
|       Loan        |       |    Reservation    |  |
+-------------------+       +-------------------+  |
| id (PK)           |       | id (PK)           |  |
| userId (FK)       |       | userId (FK)       |  |
| bookId (FK)       |       | bookId (FK)       |  |
| status (ACTIVE...) |       | queuePosition     |  |
+-------------------+       +-------------------+  |
                                                   |
                                                   v
                                            (Category Ref)
```

For the complete database architecture, index definitions, and ER diagrams, view [docs/DATABASE.md](docs/DATABASE.md) and see [docs/images/er-diagram.png](docs/images/er-diagram.png).

---

## 🛡️ Security

AVELIS adopts defense-in-depth security standards across every application layer:

* **Authentication Safeguards**: Passwords hashed using standard `bcryptjs` salt rounds; session tokens issued as signed JSON Web Tokens (JWT).
* **HTTP Security Headers**: Express apps configured with Helmet to enforce `Content-Security-Policy`, `X-Frame-Options`, and `Strict-Transport-Security`.
* **Rate Limiting & Slowdown**: Endpoint rate limiters protect authentication endpoints from brute-force attempts.
* **Payload Validation**: Strict validation middleware sanitizes input data before reaching service layers.

Read the security documentation at [docs/SECURITY.md](docs/SECURITY.md).

---

## ⚡ Performance

* **Optimistic UI State**: Frontend context state updates optimistically on actions (e.g. loan renewals) with automatic rollback on server error.
* **Indexed Database Queries**: Database schema includes target indexes on foreign keys, user emails, and book titles.
* **Code Splitting**: Dynamic React route splitting keeps initial JavaScript bundle sizes minimal.

Read the full performance report at [docs/PERFORMANCE.md](docs/PERFORMANCE.md).

---

## 📚 Documentation Directory

The repository includes detailed documentation files inside the `docs/` folder:

| Document | Description | Link |
| :--- | :--- | :--- |
| **API Specification** | Complete REST endpoint catalog, query params, and JSON schemas | [docs/API.md](docs/API.md) |
| **Architecture Guide** | Architectural patterns, layer separation, and flow diagrams | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| **Database Reference** | Schema definitions, relations, ER diagrams, and migrations | [docs/DATABASE.md](docs/DATABASE.md) |
| **Deployment Guide** | Detailed step-by-step instructions for Vercel, Render & Supabase | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |
| **Security Policy** | Comprehensive threat model, security controls & headers | [docs/SECURITY.md](docs/SECURITY.md) |
| **Performance Guide** | Optimization techniques, query profiling, and bundle analysis | [docs/PERFORMANCE.md](docs/PERFORMANCE.md) |
| **Testing Suite Guide** | Testing patterns, unit tests, and integration test setup | [docs/TESTING.md](docs/TESTING.md) |
| **Changelog** | Complete historical record of application release versions | [docs/CHANGELOG.md](docs/CHANGELOG.md) |
| **Contributing Guide** | Code guidelines, branch naming, and pull request workflow | [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) |

---

## 🔮 Potential Future Enhancements

* [ ] **Full-Text Catalog Search**: Integration of PostgreSQL `tsvector` full-text search indexing for advanced book queries.
* [ ] **Email Notifications**: Automated transactional email reminders for upcoming due dates and content availability using Resend or SendGrid.
* [ ] **Offline Reader Support**: Service worker integration for offline reading caching of digital PDF materials.
* [ ] **Enhanced Analytics Dashboard**: Visual charts for platform usage analytics, reader engagement metrics, and content circulation insights.

---

## 🤝 Contributing

Contributions, feedback, and issue reports are welcome. Please read [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for details on code standards, commit formatting, and submission workflows.

1. Fork the Repository
2. Create a Feature Branch (`git checkout -b feature/amazing-feature`)
3. Commit your Changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the Branch (`git checkout -b feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open-source software licensed under the [ISC License](LICENSE).

```text
ISC License

Copyright (c) 2026 Aadit Gupta

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

---

## 🙏 Acknowledgements

AVELIS was built as a technical showcase of modern full-stack engineering using React, Express, Prisma ORM, PostgreSQL, Supabase, and the open-source ecosystem that makes production-grade web development possible.

---

## ⚠️ Disclaimer

> **Note**
> AVELIS is a portfolio and educational project developed to demonstrate production-grade cloud architecture, scalable backend design, and modern digital reading workflows. Although fully functional and publicly deployed, it is intended as a technical showcase rather than a commercial software offering.

---

## 📬 Contact

* **Developer:** Aadit Gupta
* **GitHub Profile:** [@Aaditgupta1234](https://github.com/Aaditgupta1234)
* **Project Repository:** [https://github.com/Aaditgupta1234/AVELIS](https://github.com/Aaditgupta1234/AVELIS)

---

⭐ *If you found this project interesting, consider exploring the documentation or trying the live demo.*

**Thank you for taking the time to explore AVELIS.**
