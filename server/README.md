# AVELIS Server

> Production-grade backend for the AVELIS Library Management System.

## Technology Stack

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express.js | HTTP framework |
| MongoDB | Database |
| Mongoose | ODM |
| dotenv | Environment configuration |
| cors | Cross-origin resource sharing |
| helmet | Security headers |
| compression | Response compression |
| morgan | HTTP request logging |
| express-rate-limit | Rate limiting |
| multer | File uploads |

## Folder Structure

```text
server/
│
├── src/
│   ├── config/            # App configuration (DB, env, logger)
│   ├── controllers/       # Route handlers (feature-organized)
│   │   ├── auth/
│   │   ├── books/
│   │   └── users/
│   ├── services/          # Business logic layer
│   │   ├── auth/
│   │   ├── books/
│   │   └── users/
│   ├── routes/            # API route definitions
│   ├── validators/        # Request validation schemas
│   │   ├── auth/
│   │   ├── books/
│   │   └── users/
│   ├── models/            # Mongoose models
│   ├── middleware/         # Express middleware
│   │   ├── security/      # Auth, authorization, rate limiting
│   │   ├── validation/    # Request validation
│   │   ├── error/         # Error & 404 handling
│   │   └── upload/        # File upload config
│   ├── utils/             # Shared utilities
│   ├── constants/         # Application constants
│   ├── helpers/           # Helper functions
│   ├── errors/            # Custom error classes
│   ├── modules/           # Self-contained feature modules
│   ├── types/             # JSDoc type definitions
│   ├── uploads/           # File upload directory
│   ├── docs/              # API documentation
│   ├── app.js             # Express app configuration
│   └── server.js          # Server entry point
│
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB (local or Atlas)

### Installation

```bash
# Navigate to the server directory
cd server

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
```

### Running the Server

```bash
# Development (with hot-reload)
npm run dev

# Production
npm start
```

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `nodemon src/server.js` | Start with hot-reload |
| `start` | `node src/server.js` | Start in production mode |
| `lint` | — | Linter (not yet configured) |

## API Base URL

```
http://localhost:5000/api/v1
```

## License

ISC
