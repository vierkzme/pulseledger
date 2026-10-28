# PulseLedger

PulseLedger is an industrial API uptime and latency surveillance ledger engineered for backend systems, infrastructure reliability engineers, and DevOps teams. It monitors HTTP and HTTPS endpoints with high-resolution timers, charts response latency distributions, and dispatches rich incident alerts to Discord channels upon confirmed failures.

## System Architecture

PulseLedger is organized as a decoupled monorepo composed of an Express backend telemetry worker daemon and a React operational dashboard:

```
pulseledger/
├── server/                 # Node.js + Express API & Worker Engine
│   ├── prisma/             # Schema definitions, migrations, and seed scripts
│   ├── src/
│   │   ├── controllers/    # Route handlers for auth, monitors, and channels
│   │   ├── services/       # Domain business logic and database queries
│   │   ├── worker/         # Concurrency-limited background probe scheduler
│   │   ├── utils/          # SSRF URL protection and Discord embed builders
│   │   └── validators/     # Zod request validation schemas
│   └── test/               # Vitest integration and service test suites
├── client/                 # React 18 + Vite Frontend Dashboard
│   ├── src/
│   │   ├── components/     # Telemetry strips, modals, charts, and tables
│   │   ├── pages/          # Dashboard, Monitor Detail, Webhooks, and Auth
│   │   ├── context/        # Authentication and Dark/Light Theme providers
│   │   └── api/            # Axios HTTP client with JWT interceptor
│   └── nginx.conf          # Reverse proxy and SPA routing config
└── docker-compose.yml      # Full stack container orchestration
```

## Key Capabilities

- **High-Precision Timing**: Latency measured via `process.hrtime.bigint()` for sub-millisecond precision.
- **Anti-Flapping Retry Confirmation**: Requires consecutive failed checks before declaring an endpoint down, preventing false alarms from momentary network blips.
- **SSRF Defense Engine**: DNS resolution filter blocking requests to private IPs (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local IPs, AWS instance metadata (`169.254.169.254`), and loopback addresses.
- **25-Tick Recent Telemetry Strip**: A visual micro-heartbeat bar on every monitor row communicating status and latency profile at a glance.
- **Interactive Latency Area Charts**: Visualizes round-trip network response times across 1-hour, 24-hour, 7-day, and 30-day time horizons with Recharts.
- **Incident and Probe Ledger**: Complete audit log of ongoing and resolved outages with calculated durations, alongside paginated raw HTTP probe logs.
- **Discord Alert Webhooks**: Dispatches embedded alert cards with color-coded severity states, target URLs, HTTP response codes, and resolution durations.
- **Dual Console Themes**: Carbon Console (Dark) and Paper Ledger (Light) themes engineered to exceed WCAG AA contrast ratios (all normal text pairings exceed 4.5:1).

## Tech Stack

- **Backend**: Node.js 20, Express, PostgreSQL 16, Prisma ORM, Zod, Axios, JWT, bcryptjs
- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, React Router 6
- **Deployment**: Docker, Docker Compose, Nginx

## Getting Started

### Prerequisites

- Node.js 20 or higher
- PostgreSQL 15+ (local, Docker, or WSL2)
- npm 9+

### 1. Environment Configuration

Copy the example environment file and configure database credentials:

```bash
cp .env.example .env
```

Key environment variables:

| Variable | Description | Default |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://uptime_user:uptime_secret@localhost:5432/uptime_monitor?schema=public` |
| `JWT_SECRET` | HMAC secret for session tokens | `super_secret_jwt_pulseledger_production_key_change_me` |
| `PORT` | API server port | `5000` |
| `WORKER_TICK_INTERVAL_MS` | Telemetry probe scheduler tick rate | `5000` |
| `WORKER_CONCURRENCY` | Maximum concurrent HTTP probes | `10` |
| `ENABLE_WORKER` | Toggle background probe execution | `true` |

### 2. Database Setup

Install server dependencies, apply database migrations, and seed initial demo targets:

```bash
cd server
npm install
npx prisma migrate dev
npm run db:seed
```

The database seed provisions a demo operator account:
- **Email**: `ardy@example.com`
- **Password**: `PasswordKuat123!`

### 3. Running Locally

Run the backend API and worker in terminal 1:

```bash
cd server
npm run dev
```

Run the frontend client in terminal 2:

```bash
cd client
npm install
npm run dev
```

Open your browser at `http://localhost:5173`.

### 4. Running Backend Unit Tests

Execute the automated test suite in `server/`:

```bash
cd server
npm test
```

## Docker Deployment

To launch the full production stack (PostgreSQL, Express API & Worker, and Nginx-backed React Client) in isolated containers:

```bash
docker compose up -d --build
```

Access points:
- **Web Console**: `http://localhost:80`
- **Backend API**: `http://localhost:5000`
- **PostgreSQL**: `localhost:5432`

To shut down services:

```bash
docker compose down
```

## API Specification Overview

All monitor and channel routes require an `Authorization: Bearer <token>` header.

### Authentication
- `POST /api/auth/register`: Register new operator
- `POST /api/auth/login`: Authenticate and receive JWT
- `GET /api/auth/me`: Retrieve current operator profile

### Surveillance Targets
- `GET /api/monitors`: List all monitors with 24h metrics and recent 25 heartbeats
- `GET /api/monitors/summary`: Global system uptime and status breakdown
- `POST /api/monitors`: Create a surveillance target with custom interval and headers
- `GET /api/monitors/:id`: Get target configuration
- `PATCH /api/monitors/:id`: Update target configuration
- `PATCH /api/monitors/:id/toggle`: Pause or resume background surveillance
- `DELETE /api/monitors/:id`: Permanently delete a target
- `GET /api/monitors/:id/metrics`: Get time-series response latency (range: 1h, 24h, 7d, 30d)
- `GET /api/monitors/:id/logs`: Get paginated raw probe audit logs
- `GET /api/monitors/:id/incidents`: Get downtime incident ledger

### Discord Notifications
- `GET /api/channels`: List configured webhook channels
- `POST /api/channels`: Register a Discord webhook URL
- `PUT /api/channels/:id`: Update channel label or webhook target
- `DELETE /api/channels/:id`: Remove webhook channel
- `POST /api/channels/:id/test`: Dispatch a test notification card to Discord

## License

MIT
