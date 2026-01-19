# React Visual Feedback - Deployment Guide

**Version**: 1.0.0  
**Last Updated**: 2025-01-XX

This guide covers deploying the complete React Visual Feedback stack using Docker Compose.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Production Deployment](#production-deployment)
- [Security](#security)
- [Operations](#operations)
- [Monitoring](#monitoring)
- [Upgrading](#upgrading)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Docker | 24.0+ | 25.0+ |
| Docker Compose | 2.20+ | 2.24+ |
| RAM | 2GB | 4GB |
| Disk Space | 10GB | 50GB |
| CPU | 2 cores | 4 cores |

### Required Tools

```bash
# Check Docker version
docker --version
# Docker version 25.0.3, build 4debf41

# Check Docker Compose version
docker compose version
# Docker Compose version v2.24.5

# Check Taskfile (optional, for task automation)
task --version
# Task version: 3.35.1
```

### Install Taskfile (Optional)

```bash
# macOS
brew install go-task

# Linux
sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin

# Windows (via Scoop)
scoop install task
```

---

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/Murali1889/react-feedback-widget.git
cd react-feedback-widget
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your settings
nano .env
```

**Minimum required settings:**

```env
# PostgreSQL (REQUIRED for production)
POSTGRES_USER=feedback
POSTGRES_PASSWORD=your-secure-password-here
POSTGRES_DB=feedback

# Server
FEEDBACK_SERVER_PORT=3001
```

### 3. Start Services

**Using Taskfile (recommended):**

```bash
task up
```

**Using Docker Compose directly:**

```bash
docker compose up -d
```

### 4. Verify Deployment

```bash
# Check service status
task status
# or
docker compose ps

# Check health
task health
# or
curl http://localhost:3001/api/v1/health
```

### 5. Access Services

| Service | URL | Description |
|---------|-----|-------------|
| Feedback Server API | http://localhost:3001 | REST API |
| Feedback WebUI | http://localhost:5173 | Admin Dashboard |
| Feedback Example | http://localhost:3002 | Demo Application |
| PostgreSQL | localhost:5432 | Database (internal) |

---

## Configuration

### Environment Variables

All configuration is done via environment variables. Copy `.env.example` to `.env` and customize:

#### PostgreSQL

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `feedback` | Database username |
| `POSTGRES_PASSWORD` | `change-me-in-production` | Database password |
| `POSTGRES_DB` | `feedback` | Database name |
| `POSTGRES_PORT` | `5432` | External port (dev only) |

#### Feedback Server

| Variable | Default | Description |
|----------|---------|-------------|
| `FEEDBACK_SERVER_PORT` | `3001` | API server port |
| `DATABASE_URL` | (auto) | PostgreSQL connection string |
| `LOG_LEVEL` | `info` | Logging level: debug, info, warn, error |
| `RUN_MIGRATIONS` | `true` | Auto-run migrations on startup |
| `CORS_ORIGINS` | `*` | Allowed CORS origins |

#### WebUI

| Variable | Default | Description |
|----------|---------|-------------|
| `WEBUI_PORT` | `5173` | WebUI server port |
| `VITE_API_URL` | (auto) | Feedback Server URL |

#### Example App

| Variable | Default | Description |
|----------|---------|-------------|
| `EXAMPLE_PORT` | `3002` | Example app port |
| `NEXT_PUBLIC_FEEDBACK_API_URL` | (auto) | Public API URL |

#### Health Checks

| Variable | Default | Description |
|----------|---------|-------------|
| `HEALTHCHECK_INTERVAL` | `30` | Seconds between health checks |
| `HEALTHCHECK_TIMEOUT` | `10` | Seconds to wait for response |
| `HEALTHCHECK_RETRIES` | `3` | Retries before marking unhealthy |

---

## Production Deployment

### 1. Use Production Compose File

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 2. Required Production Settings

Create `.env.production`:

```env
# REQUIRED: Strong passwords
POSTGRES_PASSWORD=your-very-secure-password-with-32+chars

# REQUIRED: Production settings
NODE_ENV=production
LOG_LEVEL=warn

# REQUIRED: Disable migrations in production
RUN_MIGRATIONS=false

# REQUIRED: Restrict CORS
CORS_ORIGINS=https://your-domain.com

# REQUIRED: Volume paths
POSTGRES_DATA_PATH=/var/lib/feedback/postgres
FEEDBACK_DATA_PATH=/var/lib/feedback/data
FEEDBACK_UPLOADS_PATH=/var/lib/feedback/uploads
```

### 3. Create Data Directories

```bash
sudo mkdir -p /var/lib/feedback/{postgres,data,uploads}
sudo chown -R 1001:1001 /var/lib/feedback
```

### 4. Run Migrations Separately

```bash
# Run migrations before starting services
docker compose run --rm feedback-server bun run db:migrate
```

### 5. Deploy

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 6. Verify Deployment

```bash
# Check all services are healthy
docker compose ps

# View logs
docker compose logs -f

# Test API
curl -sf https://your-domain.com/api/v1/health
```

---

## Security

### Network Security

#### Production Network Configuration

```yaml
# In your nginx/reverse proxy configuration:
# - Only expose ports 80/443 externally
# - All internal services communicate via Docker network
# - PostgreSQL port should NOT be exposed externally
```

#### Firewall Rules

```bash
# Allow only HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Block direct access to internal ports
ufw deny 3001/tcp
ufw deny 5173/tcp
ufw deny 5432/tcp
```

### Secrets Management

#### Option 1: Environment Variables (Basic)

```bash
# Store in .env file (not committed to git)
POSTGRES_PASSWORD=your-secure-password
```

#### Option 2: Docker Secrets (Recommended for Swarm)

```bash
# Create secrets
echo "your-postgres-password" | docker secret create postgres_password -

# Reference in compose
# secrets:
#   - postgres_password
```

#### Option 3: External Secrets Manager

Use HashiCorp Vault, AWS Secrets Manager, or similar:

```bash
# Example with Vault
export POSTGRES_PASSWORD=$(vault kv get -field=password secret/feedback/postgres)
```

### TLS/HTTPS

Use a reverse proxy (nginx, Traefik, Caddy) for TLS termination:

```nginx
# /etc/nginx/sites-available/feedback
server {
    listen 443 ssl http2;
    server_name feedback.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/feedback.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/feedback.your-domain.com/privkey.pem;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Operations

### Starting Services

```bash
# Start all services
task up
# or
docker compose up -d

# Start specific service
docker compose up -d feedback-server
```

### Stopping Services

```bash
# Stop all services (preserves data)
task down
# or
docker compose down

# Stop and remove volumes (DESTRUCTIVE)
docker compose down -v
```

### Viewing Logs

```bash
# All services
task logs
# or
docker compose logs -f

# Specific service
docker compose logs -f feedback-server
docker compose logs -f postgres
```

### Service Health

```bash
# Check health status
task health

# Check individual service
docker inspect feedback-server --format='{{.State.Health.Status}}'
```

### Database Operations

```bash
# Open PostgreSQL shell
task db:shell
# or
docker compose exec postgres psql -U feedback -d feedback

# Create backup
task db:backup

# Restore backup
task db:restore FILE=backups/feedback-2025-01-15.sql

# View database size
docker compose exec postgres psql -U feedback -c "SELECT pg_size_pretty(pg_database_size('feedback'));"
```

### Shell Access

```bash
# Feedback Server shell
task shell:server
# or
docker compose exec feedback-server /bin/sh

# WebUI shell
task shell:webui

# Example app shell
task shell:example
```

---

## Monitoring

### Health Endpoints

| Service | Endpoint | Expected Response |
|---------|----------|-------------------|
| Feedback Server | `/api/v1/health` | `{"status":"ok"}` |
| WebUI | `/health` | `{"status":"ok"}` |
| Example | `/` | HTTP 200 |

### Prometheus Metrics (Optional)

Add to `docker-compose.override.yml`:

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
```

### Log Aggregation

Configure log driver in production:

```yaml
services:
  feedback-server:
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "10"
```

Or use external log aggregation (ELK, Loki, etc.):

```yaml
services:
  feedback-server:
    logging:
      driver: "fluentd"
      options:
        fluentd-address: "localhost:24224"
```

---

## Upgrading

### Standard Upgrade

```bash
# 1. Pull latest images
git pull
docker compose pull

# 2. Stop services
docker compose down

# 3. Run migrations (if needed)
docker compose run --rm feedback-server bun run db:migrate

# 4. Start services
docker compose up -d

# 5. Verify
task health
```

### Rolling Upgrade (Zero Downtime)

```bash
# For each service:
docker compose up -d --no-deps --build feedback-server

# Then:
docker compose up -d --no-deps --build feedback-webui

# Finally:
docker compose up -d --no-deps --build feedback-example
```

### Rollback

```bash
# 1. Stop current version
docker compose down

# 2. Checkout previous version
git checkout v1.2.3

# 3. Start previous version
docker compose up -d

# 4. Restore database if needed
task db:restore FILE=backups/pre-upgrade-backup.sql
```

---

## Troubleshooting

See [troubleshooting.md](troubleshooting.md) for detailed troubleshooting guide.

### Quick Diagnostics

```bash
# Check container status
docker compose ps

# View recent logs
docker compose logs --tail=100

# Check system resources
docker stats

# Inspect container
docker inspect feedback-server
```

### Common Issues

#### Container Won't Start

```bash
# Check exit code
docker inspect feedback-server --format='{{.State.ExitCode}}'

# View startup logs
docker compose logs feedback-server | head -50
```

#### Database Connection Failed

```bash
# Check PostgreSQL is running
docker compose exec postgres pg_isready -U feedback

# Test connection string
docker compose exec feedback-server sh -c 'echo $DATABASE_URL'
```

#### Health Check Failing

```bash
# Manual health check
curl -v http://localhost:3001/api/v1/health

# Check from inside container
docker compose exec feedback-server curl localhost:3001/api/v1/health
```

---

## Task Reference

| Task | Description |
|------|-------------|
| `task up` | Start all services |
| `task down` | Stop all services |
| `task restart` | Restart all services |
| `task logs` | View logs (follow mode) |
| `task status` | Show service status |
| `task health` | Check service health |
| `task db:shell` | Open PostgreSQL shell |
| `task db:backup` | Create database backup |
| `task db:restore FILE=<path>` | Restore from backup |
| `task shell:server` | Open server shell |
| `task shell:webui` | Open WebUI shell |
| `task shell:example` | Open example app shell |
| `task docker:build` | Build all images |
| `task docker:push` | Push to registry |
| `task reset` | Full reset (DESTRUCTIVE) |
| `task prune` | Clean unused resources |

---

## Support

- **Documentation**: [docs/](../)
- **Issues**: [GitHub Issues](https://github.com/Murali1889/react-feedback-widget/issues)
- **API Reference**: [OpenAPI Docs](../api/)

---

*Last updated: 2025-01-XX*
