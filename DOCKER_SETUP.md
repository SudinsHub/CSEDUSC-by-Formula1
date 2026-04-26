# Docker Setup Guide — CSEDU Students' Club Management System

Complete guide for running the entire system using Docker and Docker Compose.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Architecture Overview](#architecture-overview)
4. [Configuration](#configuration)
5. [Running the System](#running-the-system)
6. [Database Migrations](#database-migrations)
7. [Accessing Services](#accessing-services)
8. [Troubleshooting](#troubleshooting)
9. [Production Deployment](#production-deployment)

---

## Prerequisites

### Required Software

| Software | Version | Download |
|----------|---------|----------|
| Docker | 20.10+ | https://docs.docker.com/get-docker/ |
| Docker Compose | 2.0+ | Included with Docker Desktop |

### Verify Installation

```bash
docker --version
# Docker version 24.0.0 or higher

docker compose version
# Docker Compose version v2.20.0 or higher
```

---

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CSEDUSC-by-Formula1
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.docker .env

# Edit .env with your actual values
nano .env  # or use your preferred editor
```

**Important:** Update at minimum:
- `JWT_SECRET` - Use a strong random string
- `SMTP_USER` and `SMTP_PASS` - For email functionality

### 3. Start All Services

```bash
docker compose up -d
```

This command will:
- Build Docker images for all microservices
- Start PostgreSQL and Redis
- Start all 4 microservices
- Start the API Gateway
- Create necessary networks and volumes

### 4. Verify Services are Running

```bash
docker compose ps
```

You should see all services with status "Up":
```
NAME                  STATUS    PORTS
csedu-postgres        Up        0.0.0.0:5432->5432/tcp
csedu-redis           Up        0.0.0.0:6379->6379/tcp
csedu-ms1-auth        Up        0.0.0.0:3001->3001/tcp
csedu-ms2-election    Up        0.0.0.0:3002->3002/tcp
csedu-ms3-content     Up        0.0.0.0:3003->3003/tcp
csedu-ms4-finance     Up        0.0.0.0:3004->3004/tcp
csedu-api-gateway     Up        0.0.0.0:4000->4000/tcp
```

### 5. Test the API Gateway

```bash
curl http://localhost:4000/health
```

Expected response:
```json
{"status":"ok","uptime":3.2}
```

---

## Architecture Overview

### Container Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Docker Network                           │
│                        (csedu-network)                           │
│                                                                  │
│  ┌──────────────┐                                               │
│  │ API Gateway  │  Port: 4000                                   │
│  │  :4000       │  External: localhost:4000                     │
│  └──────┬───────┘                                               │
│         │                                                        │
│    ┌────┴────┬────────┬────────┐                               │
│    │         │        │        │                                │
│  ┌─▼──┐   ┌─▼──┐  ┌─▼──┐  ┌─▼──┐                             │
│  │MS1 │   │MS2 │  │MS3 │  │MS4 │                              │
│  │3001│   │3002│  │3003│  │3004│                              │
│  └─┬──┘   └─┬──┘  └─┬──┘  └─┬──┘                             │
│    │        │       │       │                                   │
│    └────┬───┴───┬───┴───┬───┘                                  │
│         │       │       │                                       │
│    ┌────▼───┐  │  ┌────▼────┐                                 │
│    │Postgres│  └──│  Redis  │                                  │
│    │ :5432  │     │  :6379  │                                  │
│    └────────┘     └─────────┘                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Service Dependencies

```
postgres (healthy) ──┐
                     ├──> ms1-auth ──┐
redis (healthy) ─────┤                │
                     ├──> ms2-election├──> api-gateway
                     ├──> ms3-content │
                     └──> ms4-finance ┘
```

### Volumes

| Volume | Purpose | Persistence |
|--------|---------|-------------|
| `postgres_data` | Database storage | Persistent across restarts |
| `redis_data` | Redis cache/queue data | Persistent across restarts |
| `uploads_data` | User uploaded files (MS3) | Persistent across restarts |

---

## Configuration

### Environment Variables

The `.env` file at the project root configures all services:

```env
# JWT Configuration (CRITICAL - must be the same across all services)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Node Environment
NODE_ENV=development  # or production

# Frontend Configuration
FRONTEND_URL=http://localhost:5173
FRONTEND_ORIGIN=http://localhost:5173,http://localhost:3000

# SMTP Configuration (for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Service-Specific Configuration

Each service can be configured via environment variables in `docker-compose.yml`:

**MS1 (Auth):**
- `JWT_ACCESS_EXPIRES` - Access token expiry (default: 15m)
- `JWT_REFRESH_EXPIRES` - Refresh token expiry (default: 7d)
- `SMTP_*` - Email configuration for password reset

**MS2 (Elections):**
- `REDIS_URL` - Redis connection for job queues

**MS3 (Content):**
- `UPLOAD_DIR` - File upload directory
- `UPLOAD_MAX_SIZE_MB` - Max file size (default: 10MB)
- `ALLOWED_MIME_TYPES` - Allowed file types

**MS4 (Finance):**
- `SMTP_*` - Email configuration for notifications

---

## Running the System

### Start All Services

```bash
# Start in detached mode (background)
docker compose up -d

# Start with logs visible
docker compose up

# Start specific services only
docker compose up -d postgres redis ms1-auth
```

### Stop All Services

```bash
# Stop all services (containers remain)
docker compose stop

# Stop and remove containers
docker compose down

# Stop, remove containers, and delete volumes (WARNING: deletes data)
docker compose down -v
```

### View Logs

```bash
# View logs from all services
docker compose logs

# Follow logs in real-time
docker compose logs -f

# View logs from specific service
docker compose logs -f api-gateway

# View last 100 lines
docker compose logs --tail=100 ms1-auth
```

### Restart Services

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart api-gateway

# Rebuild and restart (after code changes)
docker compose up -d --build
```

### Scale Services (Optional)

```bash
# Run multiple instances of a service
docker compose up -d --scale ms2-election=3
```

---

## Database Migrations

### Running Migrations

Each microservice has its own migrations. Run them after first startup:

**MS1 (Auth):**
```bash
docker compose exec ms1-auth node -e "
import pg from 'pg';
import fs from 'fs';
const client = new pg.Client(process.env.DATABASE_URL);
await client.connect();
const sql = fs.readFileSync('./migrations/001_create_users.sql', 'utf8');
await client.query(sql);
await client.end();
console.log('MS1 migrations completed');
"
```

Or manually:
```bash
# Copy migration file to container
docker cp ms1-auth/migrations/001_create_users.sql csedu-postgres:/tmp/

# Execute migration
docker compose exec postgres psql -U postgres -d csedu_sc -f /tmp/001_create_users.sql
```

**MS2 (Elections):**
```bash
docker cp ms2-election/migrations/001_create_election_schema.sql csedu-postgres:/tmp/
docker compose exec postgres psql -U postgres -d csedu_sc -f /tmp/001_create_election_schema.sql
```

**MS3 (Content):**
```bash
docker cp ms3/migrations/001_create_content_schema.sql csedu-postgres:/tmp/
docker compose exec postgres psql -U postgres -d csedu_sc -f /tmp/001_create_content_schema.sql
```

**MS4 (Finance):**
```bash
docker cp ms4-finance-notification-log/migrations/001_create_finance_schema.sql csedu-postgres:/tmp/
docker compose exec postgres psql -U postgres -d csedu_sc -f /tmp/001_create_finance_schema.sql
```

### Automated Migration Script

Create a helper script `run-migrations.sh`:

```bash
#!/bin/bash
echo "Running database migrations..."

services=("ms1-auth" "ms2-election" "ms3" "ms4-finance-notification-log")

for service in "${services[@]}"; do
  echo "Migrating $service..."
  for migration in $service/migrations/*.sql; do
    if [ -f "$migration" ]; then
      docker cp "$migration" csedu-postgres:/tmp/migration.sql
      docker compose exec -T postgres psql -U postgres -d csedu_sc -f /tmp/migration.sql
      echo "✓ Applied $(basename $migration)"
    fi
  done
done

echo "All migrations completed!"
```

Make it executable and run:
```bash
chmod +x run-migrations.sh
./run-migrations.sh
```

---

## Accessing Services

### Service URLs

| Service | Internal URL | External URL | Purpose |
|---------|-------------|--------------|---------|
| API Gateway | http://api-gateway:4000 | http://localhost:4000 | Main entry point |
| MS1 (Auth) | http://ms1-auth:3001 | http://localhost:3001 | Direct access (dev only) |
| MS2 (Elections) | http://ms2-election:3002 | http://localhost:3002 | Direct access (dev only) |
| MS3 (Content) | http://ms3-content:3003 | http://localhost:3003 | Direct access (dev only) |
| MS4 (Finance) | http://ms4-finance:3004 | http://localhost:3004 | Direct access (dev only) |
| PostgreSQL | postgres:5432 | localhost:5432 | Database |
| Redis | redis:6379 | localhost:6379 | Cache/Queue |

### Database Access

**Using psql from host:**
```bash
psql -h localhost -p 5432 -U postgres -d csedu_sc
# Password: postgres_password
```

**Using psql from container:**
```bash
docker compose exec postgres psql -U postgres -d csedu_sc
```

**Using GUI tools (DBeaver, pgAdmin):**
- Host: localhost
- Port: 5432
- Database: csedu_sc
- Username: postgres
- Password: postgres_password

### Redis Access

**Using redis-cli from host:**
```bash
redis-cli -h localhost -p 6379
```

**Using redis-cli from container:**
```bash
docker compose exec redis redis-cli
```

### Container Shell Access

```bash
# Access bash shell in any service
docker compose exec ms1-auth sh

# Run commands directly
docker compose exec ms1-auth node --version
docker compose exec postgres psql --version
```

---

## Troubleshooting

### Services Won't Start

**Check logs:**
```bash
docker compose logs <service-name>
```

**Common issues:**

1. **Port already in use:**
```
Error: bind: address already in use
```
Solution: Stop the conflicting service or change ports in `docker-compose.yml`

2. **Database connection failed:**
```
Error: connect ECONNREFUSED postgres:5432
```
Solution: Wait for postgres to be healthy
```bash
docker compose ps postgres
# Wait until STATUS shows "healthy"
```

3. **Out of disk space:**
```
Error: no space left on device
```
Solution: Clean up Docker resources
```bash
docker system prune -a --volumes
```

### Rebuild After Code Changes

```bash
# Rebuild specific service
docker compose build ms1-auth

# Rebuild all services
docker compose build

# Rebuild and restart
docker compose up -d --build
```

### Reset Everything

```bash
# Stop and remove all containers, networks, volumes
docker compose down -v

# Remove all images
docker compose down --rmi all

# Start fresh
docker compose up -d --build
```

### View Resource Usage

```bash
# See CPU, memory usage
docker stats

# See disk usage
docker system df
```

### Network Issues

**Test connectivity between services:**
```bash
# From api-gateway to ms1-auth
docker compose exec api-gateway wget -O- http://ms1-auth:3001/health

# From ms1-auth to postgres
docker compose exec ms1-auth nc -zv postgres 5432
```

### Database Issues

**Check if database exists:**
```bash
docker compose exec postgres psql -U postgres -c "\l"
```

**Check tables:**
```bash
docker compose exec postgres psql -U postgres -d csedu_sc -c "\dt"
```

**Reset database:**
```bash
docker compose exec postgres psql -U postgres -c "DROP DATABASE csedu_sc;"
docker compose exec postgres psql -U postgres -c "CREATE DATABASE csedu_sc;"
# Then run migrations again
```

---

## Production Deployment

### Security Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Change database password from default
- [ ] Use environment-specific `.env` file
- [ ] Enable HTTPS/TLS
- [ ] Set `NODE_ENV=production`
- [ ] Restrict database access (remove external port mapping)
- [ ] Use Docker secrets for sensitive data
- [ ] Enable firewall rules
- [ ] Set up log aggregation
- [ ] Configure backup strategy

### Production docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    # Remove ports mapping - internal only
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - csedu-network

  api-gateway:
    build:
      context: ./api-gateway
    environment:
      NODE_ENV: production
      JWT_SECRET_FILE: /run/secrets/jwt_secret
    secrets:
      - jwt_secret
    ports:
      - "4000:4000"
    restart: always
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

secrets:
  db_password:
    file: ./secrets/db_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt

networks:
  csedu-network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
```

### Using Docker Secrets

```bash
# Create secrets directory
mkdir -p secrets

# Generate strong JWT secret
openssl rand -base64 32 > secrets/jwt_secret.txt

# Set database password
echo "your_strong_db_password" > secrets/db_password.txt

# Secure the files
chmod 600 secrets/*
```

### Backup Strategy

**Automated backup script:**

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker compose exec -T postgres pg_dump -U postgres csedu_sc | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Backup uploads
docker run --rm -v csedusc-by-formula1_uploads_data:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/uploads_$DATE.tar.gz -C /data .

echo "Backup completed: $DATE"

# Keep only last 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
```

**Restore from backup:**

```bash
# Restore database
gunzip < backups/db_20260416_120000.sql.gz | docker compose exec -T postgres psql -U postgres csedu_sc

# Restore uploads
docker run --rm -v csedusc-by-formula1_uploads_data:/data -v $(pwd)/backups:/backup alpine tar xzf /backup/uploads_20260416_120000.tar.gz -C /data
```

### Monitoring

**Health check endpoints:**
```bash
# API Gateway
curl http://localhost:4000/health

# Individual services (if exposed)
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
```

**Set up monitoring with Prometheus + Grafana:**

Add to `docker-compose.yml`:
```yaml
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

---

## Useful Commands Reference

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Rebuild after changes
docker compose up -d --build

# Run migrations
./run-migrations.sh

# Access database
docker compose exec postgres psql -U postgres -d csedu_sc

# Access Redis
docker compose exec redis redis-cli

# Shell into container
docker compose exec ms1-auth sh

# Check service health
docker compose ps

# View resource usage
docker stats

# Clean up
docker system prune -a

# Backup database
docker compose exec postgres pg_dump -U postgres csedu_sc > backup.sql

# Restore database
docker compose exec -T postgres psql -U postgres csedu_sc < backup.sql
```

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

---

**Last Updated:** April 16, 2026  
**Maintained By:** DevOps Team  
**Questions?** Contact [devops@example.com]
