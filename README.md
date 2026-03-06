# Auto Social AI

> AI-powered social media automation platform — generate content, schedule posts, manage accounts, and track analytics across multiple platforms.

## Architecture

```
auto-social-ai/
├── client/        → Vite + React + Tailwind + shadcn/ui
├── server/        → Fastify + Prisma + PostgreSQL + BullMQ
├── shared/        → Shared TypeScript types (API contracts)
├── docker-compose.yml   → PostgreSQL + Redis
└── .env.example         → Environment template
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Fastify 5, TypeScript |
| Database | PostgreSQL 16 (via Prisma ORM) |
| Queue | BullMQ + Redis 7 |
| Auth | JWT + bcrypt |
| Validation | Zod |
| Logging | Pino |

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm 10+

### 1. Clone & Install

```bash
git clone <repo-url>
cd auto-social-ai
npm install
```

### 2. Start Infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL (port 5432) and Redis (port 6379).

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values (JWT secrets, etc.)
```

### 4. Setup Database

```bash
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
```

### 5. Run Development Servers

```bash
# Terminal 1 — Backend
npm run dev:server

# Terminal 2 — Frontend
npm run dev:client
```

- **API**: http://localhost:3001
- **Client**: http://localhost:5173

## API Endpoints

### Auth (Public)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh tokens |

### Content (Protected)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/content/generate` | AI-generate content |
| GET | `/api/content` | List content |
| GET | `/api/content/:id` | Get content |
| PUT | `/api/content/:id` | Edit content |

### Scheduler (Protected)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/scheduler/create` | Schedule a post |
| GET | `/api/scheduler` | List scheduled posts |
| PUT | `/api/scheduler/:id` | Update schedule |

### Accounts (Protected)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/accounts/connect` | Connect account |
| GET | `/api/accounts/list` | List accounts |
| DELETE | `/api/accounts/:id` | Disconnect account |

### Analytics (Protected)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/analytics/overview` | Analytics dashboard |

### Media (Protected)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/media/upload` | Upload media |
| GET | `/api/media` | List media |
| DELETE | `/api/media/:id` | Delete media |

### Automation (Protected)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/automation/create` | Create pipeline |
| GET | `/api/automation` | List pipelines |
| GET | `/api/automation/:id` | Get pipeline |
| PUT | `/api/automation/:id` | Update pipeline |

### System
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/health` | Health check |

## API Response Format

All responses follow a consistent envelope:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "email": ["Invalid email address"]
    }
  }
}
```

## Project Structure (Server)

```
server/src/
├── config/          → Environment validation (Zod)
├── database/        → Prisma client singleton
├── middleware/       → Auth guard, error handler
├── modules/
│   ├── auth/        → Register, login, refresh
│   ├── content/     → AI content generation + CRUD
│   ├── scheduler/   → Post scheduling + BullMQ
│   ├── accounts/    → Social account management
│   ├── analytics/   → Metrics aggregation
│   ├── media/       → File upload + management
│   └── automation/  → Pipeline management
├── queues/          → BullMQ queue definitions
├── services/        → Redis connection, shared services
├── workers/         → Background job processors
├── utils/           → Logger, error classes, response helpers
└── index.ts         → Server bootstrap
```

## Database

Prisma schema at `server/prisma/schema.prisma` with models:

- **User** — authentication, profile
- **Workspace** — multi-tenant isolation
- **WorkspaceMember** — user ↔ workspace junction
- **SocialAccount** — connected platform accounts
- **Content** — generated/drafted posts
- **ScheduledPost** — publication queue
- **AutomationPipeline** — workflow definitions
- **MediaAsset** — uploaded files
- **AnalyticsEvent** — engagement tracking

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:client` | Start frontend dev server |
| `npm run dev:server` | Start backend dev server |
| `npm run build:client` | Build frontend |
| `npm run build:server` | Compile backend TypeScript |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to PostgreSQL |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio |

## License

Private — All rights reserved.
