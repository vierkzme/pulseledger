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
│   │   ├── services/       # Domain logic, metrics, and Discord embed builders
│   │   ├── worker/         # Concurrency-limited background probe scheduler
│   │   ├── utils/          # SSRF URL protection, JWT, and password hashing
│   │   └── validators/     # Zod request validation schemas
│   └── test/               # Vitest integration and service test suites
├── client/                 # React 18 + Vite Frontend Dashboard
│   ├── src/
│   │   ├── components/     # Telemetry strips, modals, charts, and tables
│   │   ├── pages/          # Dashboard, Monitor Detail, Webhooks, Settings, and Auth
│   │   ├── context/        # Authentication and Dark/Light Theme providers
│   │   └── api/            # Axios HTTP client with JWT interceptor
│   └── nginx.conf          # Reverse proxy and SPA routing config
└── docker-compose.yml      # Full stack container orchestration
```

## Key Capabilities

- **High-Precision Timing**: Latency measured via `process.hrtime.bigint()` for sub-millisecond precision.
- **Anti-Flapping Retry Confirmation**: Requires consecutive failed checks before declaring an endpoint down, preventing false alarms from momentary network blips.
- **SSRF Defense Engine**: DNS resolution filter blocking requests to private IPs (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local IPs, AWS instance metadata (`169.254.169.254`), and loopback addresses.
- **25-Tick Recent Telemetry Strip**: A visual micro-heartbeat bar on every monitor communicating status and latency profile at a glance.
- **Interactive Latency Area Charts**: Visualizes round-trip network response times across 1-hour, 24-hour, 7-day, and 30-day time horizons with Recharts.
- **Incident and Probe Ledger**: Complete audit log of ongoing and resolved outages with calculated durations, alongside paginated raw HTTP probe logs.
- **Discord Alert Webhooks**: Dispatches embedded alert cards with color-coded severity states, target URLs, HTTP response codes, and resolution durations.
- **Dual Studio Themes**: Soft Studio (Light default) and Midnight Studio (Dark toggle) themes engineered for high legibility and WCAG AA contrast.

## Tech Stack

- **Backend**: Node.js 20, Express, PostgreSQL 16, Prisma ORM, Zod, JWT, bcryptjs
- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, React Router 6, Axios
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
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://uptime_user:uptime_secret@127.0.0.1:5432/uptime_monitor?schema=public&sslmode=disable` |
| `JWT_SECRET` | HMAC secret for session tokens | `pulseledger_jwt_secret_dev_key` (override in `.env` / production) |
| `PORT` | API server port | `4000` (local) / `5000` (Docker) |
| `WORKER_TICK_MS` | Telemetry probe scheduler tick rate (ms) | `10000` |
| `WORKER_CONCURRENCY` | Maximum concurrent HTTP probes | `20` (local) / `10` (Docker) |

### 2. Database Setup

Install server dependencies, apply database migrations, and seed initial demo targets:

```bash
cd server
npm install
npx prisma migrate dev
npm run prisma:seed
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

Open your browser at `http://localhost:3000`.

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
- **PostgreSQL**: internal Docker network service `postgres:5432` (use `docker-compose.dev.yml` to expose `localhost:5432` locally)

To shut down services:

```bash
docker compose down
```

## API Specification Overview

All monitor and channel routes require an `Authorization: Bearer <token>` header.

### Health & Authentication
- `GET /api/health`: Service uptime and health check
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
Routes are available under `/api/channels` (aliased to `/api/notifications`):
- `GET /api/channels`: List configured webhook channels
- `POST /api/channels`: Register a Discord webhook URL
- `PUT /api/channels/:id`: Update channel label, webhook URL, or enabled state
- `DELETE /api/channels/:id`: Remove webhook channel
- `POST /api/channels/:id/test`: Dispatch a test notification card to Discord

## License

MIT
