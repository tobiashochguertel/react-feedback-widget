# Deployment Guide

This guide covers deploying the Feedback Server in various environments.

## Table of Contents

- [Quick Start](#quick-start)
- [Docker Deployment](#docker-deployment)
- [Docker Compose](#docker-compose)
- [Environment Variables](#environment-variables)
- [Production Configuration](#production-configuration)
- [Reverse Proxy Setup](#reverse-proxy-setup)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Backup & Recovery](#backup--recovery)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) 20.10+
- [Docker Compose](https://docs.docker.com/compose/install/) v2+
- Minimum 1GB RAM, 1 CPU core
- 10GB disk space (adjust based on video storage needs)

### Fastest Deployment

```bash
# Clone the repository
git clone https://github.com/your-org/react-feedback-widget.git
cd react-feedback-widget/packages/feedback-server

# Create environment file
cp .env.example .env

# Edit .env with your settings (at minimum, set API_KEY for production)
nano .env

# Start with Docker Compose
docker compose up -d

# Check logs
docker compose logs -f feedback-server

# Verify health
curl http://localhost:3000/api/v1/health
```

---

## Docker Deployment

### Building the Image

```bash
# Build production image
docker build -t feedback-server:latest .

# Build with specific version tag
docker build -t feedback-server:v1.0.0 .
```

### Running the Container

```bash
# Basic run with SQLite
docker run -d \
  --name feedback-server \
  -p 3000:3000 \
  -v feedback-data:/app/data \
  -v feedback-uploads:/app/uploads \
  -e AUTH_ENABLED=true \
  -e API_KEY=your-secure-api-key \
  feedback-server:latest

# With PostgreSQL connection
docker run -d \
  --name feedback-server \
  -p 3000:3000 \
  -v feedback-uploads:/app/uploads \
  -e DATABASE_URL=postgres://user:password@host:5432/feedback \
  -e AUTH_ENABLED=true \
  -e API_KEY=your-secure-api-key \
  feedback-server:latest
```

### Container Management

```bash
# View logs
docker logs -f feedback-server

# Stop container
docker stop feedback-server

# Start container
docker start feedback-server

# Restart container
docker restart feedback-server

# Remove container (keeps volumes)
docker rm -f feedback-server

# Remove container and volumes (data loss!)
docker rm -f feedback-server
docker volume rm feedback-data feedback-uploads
```

---

## Docker Compose

### Development Mode

```bash
# Start all services
docker compose up

# Start with rebuild
docker compose up --build

# Start in background
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Stop and remove volumes (data loss!)
docker compose down -v
```

### Production Mode

Create `docker-compose.prod.yml`:

```yaml
# Production overrides
services:
  feedback-server:
    restart: always
    environment:
      - NODE_ENV=production
      - LOG_FORMAT=json
      - AUTH_ENABLED=true
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M

  db:
    restart: always
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
```

Deploy with production overrides:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Scaling

```bash
# Scale the API server (requires load balancer)
docker compose up -d --scale feedback-server=3
```

---

## Environment Variables

### Required Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | HTTP server port | `3000` | No |
| `HOST` | Server bind address | `0.0.0.0` | No |
| `DATABASE_URL` | Database connection string | `file:./data/feedback.db` | Yes |

### Security Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `AUTH_ENABLED` | Enable authentication | `false` | Production: Yes |
| `AUTH_TYPE` | Auth type: `apikey` or `jwt` | `apikey` | No |
| `API_KEY` | API key for authentication | - | If `AUTH_TYPE=apikey` |
| `JWT_SECRET` | Secret for JWT signing | - | If `AUTH_TYPE=jwt` |
| `API_KEY_SALT` | Salt for API key hashing | - | No |

### Storage Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `UPLOAD_DIR` | Directory for file uploads | `./uploads` | No |
| `MAX_UPLOAD_SIZE` | Max upload size in bytes | `104857600` (100MB) | No |

### Video Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VIDEO_CHUNK_SIZE` | Chunk size for video uploads | `1048576` (1MB) | No |
| `VIDEO_MAX_DURATION` | Max video duration in seconds | `300` (5 min) | No |
| `ENABLE_VIDEO_UPLOAD` | Enable video uploads | `true` | No |

### Database Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | Connection string | `file:./data/feedback.db` | Yes |
| `POSTGRES_PASSWORD` | PostgreSQL password (Docker Compose) | `feedback` | Production: Yes |

**Connection String Formats:**

```bash
# SQLite (development)
DATABASE_URL=file:./data/feedback.db

# PostgreSQL (production)
DATABASE_URL=postgres://user:password@host:5432/database
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
```

### Network Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CORS_ORIGINS` | Allowed CORS origins | `*` | Production: Yes |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `60000` (1 min) | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | No |

### Feature Flags

| Variable | Description | Default |
|----------|-------------|---------|
| `ENABLE_VIDEO_UPLOAD` | Enable video uploads | `true` |
| `ENABLE_WEBSOCKET` | Enable WebSocket sync | `true` |
| `ENABLE_COMPRESSION` | Enable response compression | `true` |

### Logging Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Log level: `debug`, `info`, `warn`, `error` | `info` |
| `LOG_FORMAT` | Log format: `json` or `pretty` | `json` |

---

## Production Configuration

### Recommended Production Settings

Create a `.env.production` file:

```bash
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database (PostgreSQL recommended)
DATABASE_URL=postgres://feedback:${POSTGRES_PASSWORD}@db:5432/feedback

# Security (REQUIRED for production)
AUTH_ENABLED=true
AUTH_TYPE=apikey
API_KEY=your-secure-api-key-min-32-chars

# Generate with: openssl rand -base64 32
JWT_SECRET=your-jwt-secret-if-using-jwt

# CORS (restrict to your domains)
CORS_ORIGINS=https://app.example.com,https://admin.example.com

# Rate limiting (adjust based on traffic)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Storage
UPLOAD_DIR=/data/uploads
MAX_UPLOAD_SIZE=104857600

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### Security Checklist

- [ ] Set `AUTH_ENABLED=true`
- [ ] Use a strong `API_KEY` (32+ characters)
- [ ] If using JWT, set a strong `JWT_SECRET`
- [ ] Restrict `CORS_ORIGINS` to your domains
- [ ] Use PostgreSQL instead of SQLite
- [ ] Set strong `POSTGRES_PASSWORD`
- [ ] Enable HTTPS via reverse proxy
- [ ] Configure rate limiting
- [ ] Review and set appropriate `MAX_UPLOAD_SIZE`

### Generating Secure Keys

```bash
# Generate API key
openssl rand -base64 32

# Generate JWT secret
openssl rand -hex 64

# Generate PostgreSQL password
openssl rand -base64 24 | tr -d '/+='
```

---

## Reverse Proxy Setup

### Nginx Configuration

```nginx
upstream feedback_api {
    server localhost:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name api.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/ssl/certs/api.example.com.crt;
    ssl_certificate_key /etc/ssl/private/api.example.com.key;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API proxy
    location /api/ {
        proxy_pass http://feedback_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for large uploads
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        client_max_body_size 100M;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://feedback_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400s;
    }
}
```

### Caddy Configuration

```caddyfile
api.example.com {
    # API routes
    handle /api/* {
        reverse_proxy localhost:3000
    }

    # WebSocket
    handle /ws {
        reverse_proxy localhost:3000
    }

    # Headers
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
    }
}
```

---

## Monitoring & Health Checks

### Health Endpoints

```bash
# Basic health check
curl http://localhost:3000/api/v1/health

# Detailed health (if authenticated)
curl -H "X-API-Key: your-api-key" http://localhost:3000/api/v1/health/detailed
```

### Response Format

```json
{
  "status": "ok",
  "timestamp": "2024-01-18T12:00:00.000Z",
  "version": "1.0.0",
  "uptime": 86400,
  "database": {
    "status": "connected",
    "latency": 5
  }
}
```

### Docker Health Check

The container has a built-in health check:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' feedback-server

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' feedback-server
```

### Prometheus Metrics (Future)

Metrics endpoint (if enabled):

```bash
curl http://localhost:3000/metrics
```

---

## Backup & Recovery

### PostgreSQL Backup

```bash
# Backup database
docker exec feedback-db pg_dump -U feedback feedback > backup.sql

# Backup with timestamp
docker exec feedback-db pg_dump -U feedback feedback > backup-$(date +%Y%m%d-%H%M%S).sql

# Restore database
cat backup.sql | docker exec -i feedback-db psql -U feedback feedback
```

### Volume Backup

```bash
# Stop container first
docker compose stop feedback-server

# Backup uploads volume
docker run --rm -v feedback-data:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz /data

# Restore uploads volume
docker run --rm -v feedback-data:/data -v $(pwd):/backup alpine tar xzf /backup/uploads-backup.tar.gz -C /
```

### Automated Backup Script

Create `backup.sh`:

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/backups/feedback-server"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL
docker exec feedback-db pg_dump -U feedback feedback | gzip > "$BACKUP_DIR/db-$DATE.sql.gz"

# Backup uploads (if not using external storage)
docker run --rm -v feedback-data:/data -v "$BACKUP_DIR":/backup alpine \
    tar czf "/backup/uploads-$DATE.tar.gz" /data

# Keep only last 7 days of backups
find "$BACKUP_DIR" -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

Add to crontab:

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh >> /var/log/feedback-backup.log 2>&1
```

---

## Troubleshooting

### Common Issues

#### Container Won't Start

```bash
# Check logs
docker compose logs feedback-server

# Common causes:
# 1. Port already in use
netstat -tlnp | grep 3000

# 2. Database connection failed
docker compose logs db
docker exec feedback-db pg_isready -U feedback

# 3. Permission issues
docker exec feedback-server ls -la /app/data
```

#### Database Connection Errors

```bash
# Check PostgreSQL is running
docker compose ps db

# Test connection from app container
docker exec feedback-server curl -s db:5432

# Verify credentials
docker exec -it feedback-db psql -U feedback -d feedback -c "SELECT 1"
```

#### Upload Failures

```bash
# Check disk space
docker exec feedback-server df -h /app/uploads

# Check permissions
docker exec feedback-server ls -la /app/uploads

# Check upload size limits
curl -v -X POST -F "file=@large-file.mp4" http://localhost:3000/api/v1/videos
```

#### WebSocket Connection Issues

```bash
# Test WebSocket connection
wscat -c ws://localhost:3000/ws

# Check if WebSocket is enabled
curl http://localhost:3000/ws
```

### Debug Mode

```bash
# Start with debug logging
docker compose run -e LOG_LEVEL=debug -e LOG_FORMAT=pretty feedback-server

# Or update .env and restart
echo "LOG_LEVEL=debug" >> .env
docker compose restart feedback-server
```

### Performance Issues

```bash
# Check container resource usage
docker stats feedback-server feedback-db

# Check connection pool
docker exec feedback-server curl localhost:3000/api/v1/health/detailed

# Analyze slow queries (PostgreSQL)
docker exec feedback-db psql -U feedback -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10"
```

---

## Additional Resources

- [API Documentation](/api/docs) - Swagger UI
- [GitHub Repository](https://github.com/your-org/react-feedback-widget)
- [Issue Tracker](https://github.com/your-org/react-feedback-widget/issues)

---

*Last updated: January 2025*
