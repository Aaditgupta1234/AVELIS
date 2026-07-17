# Software Architecture Guide

AVELIS is engineered with an enterprise-grade, layered software architecture that separates user interaction layers from core business transactions and data persistence.

---

## Architectural Principles

1. **Separation of Concerns:** Each layer handles a singular responsibility (routing, payload validation, authorization, business rules, or persistence).
2. **Thin Controllers:** Controllers only parsing HTTP requests, extract parameters, trigger service operations, and compile HTTP response envelopes. They contain no database or validation logic.
3. **Service-Driven Business Logic:** Services are the single source of truth for business rules, executing transactions, managing queues, and interacting with the ORM.
4. **Data Access Isolation:** Direct access to PostgreSQL tables is barred. The Prisma Client acts as the absolute interface layer.
5. **Stateless Sessions:** User sessions are fully stateless. Auth details are encoded inside signed JWT tokens parsed by middleware.
6. **Robust Error Propagation:** Exceptions are routed up to a centralized error interceptor that converts operational errors into clean API error payloads.

---

## System Flow & Middleware Pipeline

The system segregates frontend React assets from the Express API engine, communicating over secure HTTPS requests. Every incoming request traverses a strict, ordered pipeline of security, sanitization, and throttling controls:

```mermaid
flowchart TD
    Client[React Client SPA] --> Body[Body Parsers: JSON/URL limits]
    Body --> Logger[morgan logging]
    Logger --> Headers[Helmet & Permissions Policy]
    Headers --> CORS[CORS policy configuration]
    CORS --> Sanitizer[Request Normalization & Sanitization]
    Sanitizer --> RateLimit[Rate Limiter & Slowdown Throttling]
    RateLimit --> Cache[noCache Middleware selective]
    Cache --> Router[Express Route Dispatcher]
    Router --> Validator[Payload Schema Validators]
    Validator --> Auth[JWT authMiddleware]
    Auth --> RBAC[requireRole guards]
    RBAC --> Controller[HTTP Controller Layer]
    Controller --> Service[Domain Transaction Services]
    Service --> Prisma[Prisma Database Client]
    Prisma --> DB[(PostgreSQL Database)]
    
    %% Error flow
    Controller -.-> Err[Global Error Handler / 404 handler]
    Service -.-> Err
    Auth -.-> Err
    RBAC -.-> Err
    Err --> Client
```

### Pipeline Details:
1. **Body Parsing**: Enforces `MAX_JSON_SIZE` limits to prevent memory bloat/denial of service.
2. **Hardened Headers**: Helmet configures CSP, HSTS, frameguard, Referrer, and permitted-cross-domain rules. Disables `X-Powered-By`.
3. **CORS Options**: Configured from `CORS_ORIGIN` with cache optimization (`CORS_MAX_AGE`).
4. **Request Normalization**: Sanitizes input strings and normalizes keys recursively.
5. **Abuse Protection**: Throttles bursts via `express-slow-down` and blocks abuse via `express-rate-limit`.
6. **Selective Caching**: Applies cache-busting headers on sensitive/personal endpoints (`/auth`, `/users`, `/admin`, `/loans`, `/reservations`).
7. **Error Interception**: Centralized error mapping prints structured JSON `ApiError` responses and logs security warnings.

---

## Authentication Lifecycle Sequence

The request-response lifecycle for authenticated login verification:

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Router as Express Router (POST /api/v1/auth/login)
    participant Val as Validation Middleware
    participant Ctrl as Auth Controller
    participant Serv as Auth Service
    participant Prisma as Prisma Client
    participant DB as PostgreSQL

    Client->>Router: POST /auth/login payload
    Router->>Val: Forward request for validation
    
    alt Validation failure
        Val-->>Client: 400 Bad Request (Errors array)
    else Validation success
        Val->>Ctrl: Forward payload to controller
        Ctrl->>Serv: Call loginUser()
        Serv->>Prisma: Fetch user by email
        Prisma->>DB: Query User record
        DB-->>Prisma: User Record
        Prisma-->>Serv: User Record
        
        alt Invalid credentials or deactivated account
            Serv->>Serv: bcrypt password verification (fails)
            Serv-->>Ctrl: Throw ApiError(401)
            Ctrl-->>Client: 401 Unauthorized Response
        else Successful authentication
            Serv->>Serv: bcrypt password verification (passes)
            Serv->>Serv: Sign JWT Token
            Serv-->>Ctrl: Return Token & Sanitized User Details
            Ctrl-->>Client: 200 OK (JWT Access Token)
        end
    end
```

---

## Layered Directory Layout

Backend logic is organized into distinct logical layers under `server/src/`:

| Layer | Directory | Responsibility |
| :--- | :--- | :--- |
| **Routes** | `src/routes/` & `src/modules/` | Maps URLs to specific controller entry points. |
| **Validators** | `src/validators/` & `src/validations/` | Sanitizes payload shapes before controllers execute. |
| **Middleware** | `src/middleware/` | Handles JWT validation, RBAC guards, and global errors. |
| **Controllers** | `src/controllers/` | Extracts HTTP inputs and maps responses. |
| **Services** | `src/services/` | Contains core transactional domain logic. |
| **Library Clients** | `src/lib/` | Instantiates shared singletons (e.g. Prisma instance). |
| **Utilities** | `src/utils/` & `src/helpers/` | Exposes pure validation helpers and shared class exceptions. |
