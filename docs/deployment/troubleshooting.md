# Troubleshooting Guide

**Version**: 1.0.0  
**Last Updated**: 2025-01-XX

This guide helps diagnose and resolve common issues with the React Visual Feedback Docker deployment.

---

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Container Issues](#container-issues)
- [Database Issues](#database-issues)
- [Network Issues](#network-issues)
- [Performance Issues](#performance-issues)
- [Health Check Failures](#health-check-failures)
- [Log Analysis](#log-analysis)
- [Getting Help](#getting-help)

---

## Quick Diagnostics

Run these commands first to gather system state:

```bash
# 1. Check all container status
docker compose ps -a

# 2. View recent logs from all services
docker compose logs --tail=50

# 3. Check system resources
docker stats --no-stream

# 4. Check disk space
df -h

# 5. Check Docker daemon health
docker info

# 6. Check network connectivity between containers
docker compose exec feedback-server ping -c 3 postgres
```

### Using Taskfile Diagnostics

```bash
# Run all health checks
task health

# Show detailed status
task status

# Collect diagnostic info
task debug:info
```

---

## Container Issues

### Container Won't Start

**Symptoms:**
- Container exits immediately after starting
- Status shows "Exited (1)" or similar
- `docker compose up` fails

**Diagnosis:**

```bash
# Check exit code
docker inspect feedback-server --format='{{.State.ExitCode}} - {{.State.Error}}'

# View startup logs
docker compose logs feedback-server 2>&1 | head -100

# Check if port is already in use
lsof -i :3001
```

**Common Causes & Solutions:**

1. **Port already in use:**
   ```bash
   # Find process using the port
   lsof -i :3001
   
   # Kill the process or change port in .env
   FEEDBACK_SERVER_PORT=3003
   ```

2. **Missing environment variables:**
   ```bash
   # Check required env vars are set
   docker compose config
   
   # Ensure .env file exists
   ls -la .env
   ```

3. **Permission denied:**
   ```bash
   # Check volume permissions
   ls -la ./data
   
   # Fix permissions
   sudo chown -R 1001:1001 ./data
   ```

4. **Image build failed:**
   ```bash
   # Rebuild without cache
   docker compose build --no-cache feedback-server
   ```

---

### Container Keeps Restarting

**Symptoms:**
- Container restarts repeatedly
- Status shows "Restarting"
- Logs show crash-restart cycle

**Diagnosis:**

```bash
# Check restart count
docker inspect feedback-server --format='{{.RestartCount}}'

# View logs across restarts
docker compose logs --tail=200 feedback-server

# Check memory limits
docker stats feedback-server --no-stream
```

**Common Causes & Solutions:**

1. **Out of memory (OOM killed):**
   ```bash
   # Check if OOM killed
   docker inspect feedback-server --format='{{.State.OOMKilled}}'
   
   # Increase memory limit in docker-compose.yml
   deploy:
     resources:
       limits:
         memory: 1G
   ```

2. **Application crash:**
   ```bash
   # Check for error patterns in logs
   docker compose logs feedback-server 2>&1 | grep -i "error\|exception\|failed"
   
   # Enable debug logging
   LOG_LEVEL=debug docker compose up feedback-server
   ```

3. **Database not ready:**
   ```bash
   # Check if postgres is healthy
   docker compose exec postgres pg_isready -U feedback
   
   # Ensure proper depends_on with healthcheck
   # Already configured in docker-compose.yml
   ```

---

### Container is Slow to Start

**Symptoms:**
- Container takes long time to become healthy
- "Waiting for service" messages

**Solutions:**

```bash
# Increase health check start period
healthcheck:
  start_period: 60s

# Pre-warm dependencies before starting dependent services
docker compose up -d postgres
docker compose exec postgres pg_isready -U feedback --timeout=60
docker compose up -d feedback-server
```

---

## Database Issues

### Cannot Connect to Database

**Symptoms:**
- "Connection refused" errors
- "FATAL: password authentication failed"
- Application fails to start with database errors

**Diagnosis:**

```bash
# 1. Check PostgreSQL container is running
docker compose ps postgres

# 2. Check PostgreSQL is ready
docker compose exec postgres pg_isready -U feedback

# 3. Check connection string
docker compose exec feedback-server sh -c 'echo $DATABASE_URL'

# 4. Test connection from app container
docker compose exec feedback-server sh -c 'nc -zv postgres 5432'
```

**Solutions:**

1. **PostgreSQL not started:**
   ```bash
   docker compose up -d postgres
   docker compose logs postgres
   ```

2. **Wrong credentials:**
   ```bash
   # Check .env matches what postgres was initialized with
   cat .env | grep POSTGRES
   
   # If mismatch, reset postgres data
   docker compose down -v
   docker volume rm react-feedback-widget_postgres_data
   docker compose up -d
   ```

3. **Connection string malformed:**
   ```bash
   # Correct format
   DATABASE_URL=postgresql://user:password@postgres:5432/database
   ```

---

### Database Migration Failures

**Symptoms:**
- "Migration failed" errors
- Application starts but database tables missing
- "relation does not exist" errors

**Diagnosis:**

```bash
# Check migration status
docker compose exec feedback-server bun run db:migrate:status

# View migration logs
docker compose logs feedback-server 2>&1 | grep -i "migration"
```

**Solutions:**

1. **Run migrations manually:**
   ```bash
   docker compose exec feedback-server bun run db:migrate
   ```

2. **Reset and re-migrate (DESTRUCTIVE):**
   ```bash
   docker compose down -v
   docker compose up -d postgres
   sleep 5
   docker compose run --rm feedback-server bun run db:migrate
   docker compose up -d
   ```

3. **Migration lock stuck:**
   ```bash
   # Release migration lock (if using Prisma)
   docker compose exec postgres psql -U feedback -c "DELETE FROM _prisma_migrations WHERE finished_at IS NULL;"
   ```

---

### Database Performance Issues

**Symptoms:**
- Slow queries
- High CPU on postgres container
- Timeout errors

**Diagnosis:**

```bash
# Check active queries
docker compose exec postgres psql -U feedback -c "SELECT pid, query, state, wait_event FROM pg_stat_activity WHERE state != 'idle';"

# Check table sizes
docker compose exec postgres psql -U feedback -c "SELECT relname, pg_size_pretty(pg_relation_size(relid)) FROM pg_stat_user_tables ORDER BY pg_relation_size(relid) DESC LIMIT 10;"

# Check for locks
docker compose exec postgres psql -U feedback -c "SELECT * FROM pg_locks WHERE granted = false;"
```

**Solutions:**

1. **Add missing indexes:**
   ```sql
   -- Check slow queries and add appropriate indexes
   CREATE INDEX idx_feedback_created_at ON feedback(created_at);
   ```

2. **Increase shared buffers:**
   ```yaml
   # docker-compose.yml
   postgres:
     command: postgres -c shared_buffers=256MB -c work_mem=16MB
   ```

3. **Vacuum database:**
   ```bash
   docker compose exec postgres vacuumdb -U feedback -d feedback --analyze
   ```

---

## Network Issues

### Services Can't Communicate

**Symptoms:**
- "Connection refused" between services
- DNS resolution failures
- Timeout errors

**Diagnosis:**

```bash
# Check network exists
docker network ls | grep feedback

# Check services are on same network
docker network inspect react-feedback-widget_feedback-network

# Test DNS resolution
docker compose exec feedback-server nslookup postgres

# Test connectivity
docker compose exec feedback-server ping -c 3 postgres
docker compose exec feedback-server nc -zv postgres 5432
```

**Solutions:**

1. **Recreate network:**
   ```bash
   docker compose down
   docker network rm react-feedback-widget_feedback-network
   docker compose up -d
   ```

2. **Check network configuration:**
   ```yaml
   # docker-compose.yml - ensure services on same network
   services:
     feedback-server:
       networks:
         - feedback-network
     postgres:
       networks:
         - feedback-network
   ```

---

### Port Conflicts

**Symptoms:**
- "Bind: address already in use"
- Container won't start due to port

**Diagnosis:**

```bash
# Find what's using the port
lsof -i :3001
netstat -tlpn | grep 3001
```

**Solutions:**

1. **Kill conflicting process:**
   ```bash
   kill $(lsof -t -i:3001)
   ```

2. **Change port in .env:**
   ```env
   FEEDBACK_SERVER_PORT=3003
   ```

3. **Use different host binding:**
   ```yaml
   ports:
     - "127.0.0.1:3001:3001"
   ```

---

## Performance Issues

### High Memory Usage

**Diagnosis:**

```bash
# Check container memory usage
docker stats --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}"

# Check for memory leaks (increasing over time)
watch -n 5 'docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}"'
```

**Solutions:**

1. **Set memory limits:**
   ```yaml
   deploy:
     resources:
       limits:
         memory: 512M
       reservations:
         memory: 256M
   ```

2. **Increase Node.js heap (for Bun):**
   ```yaml
   environment:
     - BUN_MEMORY_LIMIT=512
   ```

---

### High CPU Usage

**Diagnosis:**

```bash
# Check CPU usage
docker stats --format "table {{.Name}}\t{{.CPUPerc}}"

# Profile container
docker compose exec feedback-server top
```

**Solutions:**

1. **Set CPU limits:**
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '1.0'
   ```

2. **Check for infinite loops in logs:**
   ```bash
   docker compose logs feedback-server 2>&1 | tail -100
   ```

---

### Slow Response Times

**Diagnosis:**

```bash
# Test response time
time curl -s http://localhost:3001/api/v1/health

# Check container health timing
docker inspect feedback-server --format='{{json .State.Health}}' | jq
```

**Solutions:**

1. **Check database connection pool:**
   ```env
   DATABASE_POOL_SIZE=20
   ```

2. **Enable connection keep-alive:**
   ```yaml
   environment:
     - HTTP_KEEP_ALIVE=true
   ```

---

## Health Check Failures

### Understanding Health Status

```bash
# Check health status
docker inspect feedback-server --format='{{.State.Health.Status}}'
# Possible values: starting, healthy, unhealthy

# View health check history
docker inspect feedback-server --format='{{json .State.Health}}' | jq '.Log[-3:]'
```

### Health Check Failing Immediately

**Diagnosis:**

```bash
# Run health check manually
docker compose exec feedback-server curl -sf localhost:3001/api/v1/health

# Check if port is listening
docker compose exec feedback-server netstat -tlpn | grep 3001
```

**Solutions:**

1. **Increase start period:**
   ```yaml
   healthcheck:
     start_period: 60s
   ```

2. **Fix health endpoint:**
   ```bash
   # Ensure endpoint returns 2xx
   curl -v http://localhost:3001/api/v1/health
   ```

---

### Intermittent Health Check Failures

**Diagnosis:**

```bash
# Watch health check results
watch -n 5 'docker inspect feedback-server --format="{{json .State.Health.Status}}"'

# Check container logs during failures
docker compose logs -f feedback-server
```

**Solutions:**

1. **Increase timeout:**
   ```yaml
   healthcheck:
     timeout: 30s
   ```

2. **Reduce check frequency:**
   ```yaml
   healthcheck:
     interval: 60s
   ```

---

## Log Analysis

### Finding Error Patterns

```bash
# Search for errors
docker compose logs 2>&1 | grep -i "error"

# Search for specific error codes
docker compose logs 2>&1 | grep -E "(500|502|503|504)"

# Search for exceptions
docker compose logs 2>&1 | grep -i "exception\|stack\|trace"
```

### Log Locations

| Service | Container Log | Persistent Log |
|---------|---------------|----------------|
| feedback-server | `docker compose logs feedback-server` | `/var/log/feedback/server.log` |
| feedback-webui | `docker compose logs feedback-webui` | N/A |
| postgres | `docker compose logs postgres` | Postgres data volume |

### Log Retention

```bash
# Check log size
docker compose logs --no-log-prefix 2>&1 | wc -c

# Clear old logs (Docker handles rotation)
docker system prune --volumes -f
```

---

## Getting Help

### Before Reporting an Issue

1. **Collect diagnostic information:**
   ```bash
   task debug:info > debug-info.txt
   # or manually:
   {
     echo "=== Docker Version ==="
     docker version
     echo "=== Docker Compose Version ==="
     docker compose version
     echo "=== Container Status ==="
     docker compose ps -a
     echo "=== Recent Logs ==="
     docker compose logs --tail=100
     echo "=== Environment (sanitized) ==="
     cat .env | sed 's/PASSWORD=.*/PASSWORD=***/'
   } > debug-info.txt
   ```

2. **Check existing issues:**
   - [GitHub Issues](https://github.com/Murali1889/react-feedback-widget/issues)

3. **Search documentation:**
   - [Deployment Guide](./README.md)
   - [Configuration Reference](./README.md#configuration)

### Reporting an Issue

Include the following in your issue:

```markdown
## Environment
- OS: [e.g., Ubuntu 22.04]
- Docker: [version]
- Docker Compose: [version]

## Problem Description
[Clear description of the issue]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Logs
```
[Paste relevant logs here]
```

## Configuration (sanitized)
```env
[Paste .env without passwords]
```
```

---

## Emergency Procedures

### Complete Reset (DESTRUCTIVE)

```bash
# ⚠️ WARNING: This deletes ALL data

# Stop and remove everything
docker compose down -v --rmi all

# Remove networks
docker network prune -f

# Remove volumes
docker volume prune -f

# Clean up
docker system prune -a -f

# Fresh start
docker compose up -d
```

### Database Backup Before Changes

```bash
# Always backup before troubleshooting
task db:backup

# Or manually
docker compose exec postgres pg_dump -U feedback -d feedback > backup-$(date +%Y%m%d-%H%M%S).sql
```

### Rollback to Previous Version

```bash
# 1. Stop current version
docker compose down

# 2. Restore database
task db:restore FILE=backups/your-backup.sql

# 3. Checkout previous code
git checkout v1.2.3

# 4. Start previous version
docker compose up -d
```

---

*Last updated: 2025-01-XX*
