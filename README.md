# PulseLedger

An industrial network telemetry ledger and endpoint uptime monitor built for backend engineers and DevOps teams.

PulseLedger monitors HTTP and HTTPS endpoints, records response times with high-precision nanosecond resolution timers, visualizes uptime and response latency distributions, and sends instant rich embed alerts to Discord channels on confirmed status changes.

## Features

- High precision HTTP/HTTPS latency measurement via `process.hrtime.bigint()`
- Multi-user authentication with isolated tenant data
- Anti-flapping confirmation retry logic to eliminate false-positive alerts
- Server-Side Request Forgery (SSRF) guard with private and loopback address blocking
- Industrial Network Ledger UI with 25-tick telemetry strip motif
- Dual theme support (Carbon Console Dark and Paper Ledger Light) meeting WCAG AA contrast standards
- Discord Webhook integration with Rich Embed formatting for incidents and recoveries
- Time-series aggregation for 1H, 24H, 7D, and 30D response latency charts
- Production container orchestration with Docker Compose

## Quick Start

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd "API Uptime"
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Start services via Docker Compose:
   ```bash
   docker compose up -d --build
   ```

4. Open the console at `http://localhost:3000` (or `http://localhost:4000` for backend API).
