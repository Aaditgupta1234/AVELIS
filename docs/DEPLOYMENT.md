# Deployment & Configuration Guide

This guide details configuration variables, dependency requirements, build steps, and startup procedures for deploying AVELIS to staging or production environments.

---

## Deployment Status

The application is in active staging/production planning:

| Component | Status | Target |
| :--- | :--- | :--- |
| **Backend API Engine** | ⏳ Planned | VPS / Cloud Container |
| **PostgreSQL Database**| ⏳ Planned | Managed Cloud Database |
| **Frontend SPA Client**| ⏳ Planned | CDN Hosting (Vercel/Netlify) |
| **Production Build**  | ⏳ Planned | Containerized Docker Deployments |

---

## Environment Variables

Configure application settings by copying `server/.env.example` to `server/.env` and populating:

| Variable | Required | Default | Purpose |
| :--- | :--- | :--- | :--- |
| **`NODE_ENV`** | Yes | `development` | Set to `production` to activate optimizations and security behaviors. |
| **`PORT`** | No | `5000` | The local port the Express server listens to. |
| **`CORS_ORIGIN`** | Yes | `http://localhost:5173` | Allowed CORS request origin URL. |
| **`CLIENT_URL`** | Yes | `http://localhost:5173` | Redirect target URL for client operations. |
| **`DATABASE_URL`** | Yes | None | PostgreSQL database connection URI string. |
| **`JWT_SECRET`** | Yes | None | Secret key used to sign session access tokens. |
| **`JWT_EXPIRES_IN`**| No | `7d` | Token validity duration. |

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
