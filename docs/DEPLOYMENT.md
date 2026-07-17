# Deployment & Configuration Guide

This guide details configuration variables, dependency requirements, build steps, and startup procedures for deploying AVELIS to staging or production environments.

---

## Deployment Status

The application is fully validated and ready for production staging:

| Component | Status | Target |
| :--- | :--- | :--- |
| **Backend API Engine** | **Ready** | VPS / Cloud Container (e.g. AWS, Render, Heroku) |
| **PostgreSQL Database**| **Ready** | Managed Cloud Database (e.g. RDS, Neon) |
| **Frontend SPA Client**| **Ready** | CDN Hosting (Vercel/Netlify) |
| **Production Build**  | **Ready** | Containerized Docker Deployments |

---

## Environment Variables

Configure application settings by copying `server/.env.example` to `server/.env` and populating:

| Variable | Required | Default | Purpose |
| :--- | :--- | :--- | :--- |
| **`NODE_ENV`** | Yes | `development` | Set to `production` to activate optimizations and security behaviors. |
| **`PORT`** | No | `5000` | The local port the Express server listens to. |
| **`CORS_ORIGIN`** | Yes | `http://localhost:5173` | Allowed CORS request origin URL. |
| **`CORS_MAX_AGE`** | No | `86400` | Preflight OPTIONS request browser caching time (seconds). |
| **`CLIENT_URL`** | Yes | `http://localhost:5173` | Redirect target URL for client operations. |
| **`DATABASE_URL`** | Yes | None | PostgreSQL database connection URI string. |
| **`JWT_SECRET`** | Yes | None | Secret key used to sign session access tokens (min 32 chars). |
| **`JWT_EXPIRES_IN`**| No | `7d` | Token validity duration. |
| **`TRUST_PROXY`** | No | `false` | Express trust proxy hop count or subnet definitions. |
| **`MAX_JSON_SIZE`** | No | `1mb` | Maximum permitted size for incoming JSON request bodies. |
| **`MAX_URLENCODED_SIZE`**| No | `1mb` | Maximum permitted size for incoming URL-encoded bodies. |
| **`GLOBAL_RATE_LIMIT`**| No | `100` | Request threshold for the global rate limiter. |
| **`AUTH_RATE_LIMIT`**| No | `6` | Request threshold for authentication endpoints. |

---

## Production Startup

### 1. Build and Run Frontend SPA
Compile frontend assets into optimized static packages:

```bash
# From root directory
npm install
npm run build
```
Static assets will build to `/dist/` ready for web server routing or CDN uploading.

### 2. Configure and Run Backend Engine
To migrate the database and start the production API server:

```bash
# Navigate to backend directory
cd server
npm install

# Apply database schema changes (Production Migration)
npx prisma migrate deploy

# Start the server in production mode
npm start
```
The backend API server runs on the configured port, defaulting to `http://localhost:5000/api/v1`.
