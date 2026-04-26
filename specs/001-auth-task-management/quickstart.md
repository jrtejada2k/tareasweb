# TasksWeb - Quick Start Guide

**Feature**: Authentication and Task Management System  
**Branch**: 001-auth-task-management  
**Last Updated**: 2025-11-04

This guide provides step-by-step instructions for setting up and running the TasksWeb application locally.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Docker Deployment](#docker-deployment)
4. [VPS Deployment](#vps-deployment)
5. [Environment Variables](#environment-variables)
6. [Database Management](#database-management)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Docker**: Version 24.0 or higher
- **Docker Compose**: Version 2.0 or higher
- **Git**: For version control
- **Node.js**: Version 20.x LTS (for local development without Docker)
- **PostgreSQL**: Version 16.x (for local development without Docker)

### System Requirements

- **Development**: 4GB RAM, 10GB disk space
- **Production (VPS)**: 1GB RAM, 20GB disk space

### Verify Installation

```powershell
# Check Docker version
docker --version
# Expected: Docker version 24.0.0 or higher

# Check Docker Compose version
docker compose version
# Expected: Docker Compose version v2.0.0 or higher

# Check Node.js version (if running locally)
node --version
# Expected: v20.x.x
```

---

## Local Development Setup

### 1. Clone Repository

```powershell
# Clone the repository
git clone https://github.com/yourusername/TasksWeb.git
cd TasksWeb

# Checkout feature branch
git checkout 001-auth-task-management
```

### 2. Environment Configuration

Create a `.env` file in the project root:

```powershell
# Copy example environment file
Copy-Item .env.example .env

# Edit .env file with your preferred editor
notepad .env
```

**Required `.env` variables** (see [Environment Variables](#environment-variables) section for details):

```env
# Database
POSTGRES_USER=taskswebuser
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=taskswebdb
DATABASE_URL=postgresql://taskswebuser:your_secure_password_here@database:5432/taskswebdb

# JWT
JWT_SECRET=your_jwt_secret_minimum_32_characters_long
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Server
NODE_ENV=development
PORT=3000

# Frontend
VITE_API_URL=http://localhost/api/v1

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 3. Start with Docker Compose (Recommended)

```powershell
# Build and start all services
docker compose up --build

# Or run in detached mode (background)
docker compose up -d --build
```

**Services started**:
- Database (PostgreSQL 16): `localhost:5432`
- Backend API (Node.js + Express): `localhost:3000`
- Frontend (React + Vite): `localhost:5173`
- Nginx Reverse Proxy: `localhost:80` and `localhost:443`

### 4. Verify Services

```powershell
# Check running containers
docker compose ps

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f database
```

### 5. Access Application

- **Frontend**: http://localhost
- **API**: http://localhost/api/v1
- **API Documentation**: http://localhost/api/docs (Swagger UI)
- **Health Check**: http://localhost/health

### 6. Create First User

```powershell
# Register a master user via API
curl -X POST http://localhost/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    "email": "master@example.com",
    "password": "MasterPass123!",
    "full_name": "Master User",
    "role": "master"
  }'
```

Or use the frontend registration form at http://localhost/register

---

## Docker Deployment

### Container Management

#### Start Services

```powershell
# Start all services
docker compose up -d

# Start specific service
docker compose up -d backend
```

#### Stop Services

```powershell
# Stop all services
docker compose down

# Stop and remove volumes (WARNING: Deletes database data)
docker compose down -v
```

#### View Logs

```powershell
# All services
docker compose logs -f

# Last 100 lines
docker compose logs --tail=100

# Specific service with timestamps
docker compose logs -f --timestamps backend
```

#### Restart Services

```powershell
# Restart all services
docker compose restart

# Restart specific service
docker compose restart backend
```

#### Rebuild After Code Changes

```powershell
# Rebuild and restart
docker compose up -d --build

# Rebuild specific service
docker compose build backend
docker compose up -d backend
```

### Resource Monitoring

```powershell
# View container resource usage
docker stats

# View specific service stats
docker stats tasksweb-backend-1
```

### Execute Commands in Containers

```powershell
# Access backend shell
docker compose exec backend sh

# Access database shell
docker compose exec database psql -U taskswebuser -d taskswebdb

# Run database migrations
docker compose exec backend npm run migrate

# Run backend tests
docker compose exec backend npm test
```

---

## VPS Deployment

### Prerequisites

- Ubuntu 22.04 or Debian 12 VPS
- 1GB RAM minimum
- 20GB disk space
- Root or sudo access
- Domain name (optional, for SSL)

### 1. Install Docker on VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### 2. Transfer Files to VPS

```powershell
# From local machine, SCP files to VPS
scp -r . user@your-vps-ip:/opt/tasksweb

# Or use Git
ssh user@your-vps-ip
cd /opt
git clone https://github.com/yourusername/TasksWeb.git tasksweb
cd tasksweb
git checkout 001-auth-task-management
```

### 3. Configure Environment

```bash
# SSH into VPS
ssh user@your-vps-ip

# Navigate to project directory
cd /opt/tasksweb

# Copy and edit .env file
cp .env.example .env
nano .env
```

**Update `.env` for production**:

```env
NODE_ENV=production
VITE_API_URL=https://yourdomain.com/api/v1
CORS_ORIGIN=https://yourdomain.com

# Use strong passwords
POSTGRES_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 48)
```

### 4. Setup SSL Certificates (Optional)

If using a domain name with SSL:

```bash
# Install certbot
sudo apt install certbot -y

# Generate certificates
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Certificates will be in:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem

# Update nginx.conf to use certificates
nano nginx/nginx.conf

# Update ssl_certificate paths:
# ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
```

### 5. Deploy with Docker Compose

```bash
# Build and start services
docker compose -f docker-compose.yml up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### 6. Configure Firewall

```bash
# Allow HTTP, HTTPS, and SSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Check status
sudo ufw status
```

### 7. Setup Automatic Startup

```bash
# Enable Docker to start on boot
sudo systemctl enable docker

# Create systemd service for docker-compose
sudo nano /etc/systemd/system/tasksweb.service
```

**Service file content**:

```ini
[Unit]
Description=TasksWeb Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/tasksweb
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable tasksweb.service
sudo systemctl start tasksweb.service

# Check status
sudo systemctl status tasksweb.service
```

### 8. Setup Automatic Backups

```bash
# Create backup script
sudo nano /opt/tasksweb/scripts/backup.sh
```

**Backup script content**:

```bash
#!/bin/bash
BACKUP_DIR="/opt/tasksweb/backups"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="tasksweb-database-1"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker exec $CONTAINER_NAME pg_dump -U taskswebuser taskswebdb > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Delete backups older than 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

```bash
# Make script executable
chmod +x /opt/tasksweb/scripts/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e

# Add line:
0 2 * * * /opt/tasksweb/scripts/backup.sh >> /var/log/tasksweb-backup.log 2>&1
```

---

## Environment Variables

### Database Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `POSTGRES_USER` | PostgreSQL username | taskswebuser | Yes |
| `POSTGRES_PASSWORD` | PostgreSQL password | - | Yes |
| `POSTGRES_DB` | Database name | taskswebdb | Yes |
| `DATABASE_URL` | Full database connection string | - | Yes |

**Example**:
```env
POSTGRES_USER=taskswebuser
POSTGRES_PASSWORD=SecurePass123!
POSTGRES_DB=taskswebdb
DATABASE_URL=postgresql://taskswebuser:SecurePass123!@database:5432/taskswebdb
```

### JWT Authentication

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | Secret key for JWT signing (min 32 chars) | - | Yes |
| `JWT_ACCESS_EXPIRY` | Access token expiration | 15m | No |
| `JWT_REFRESH_EXPIRY` | Refresh token expiration | 7d | No |

**Example**:
```env
JWT_SECRET=$(openssl rand -base64 48)
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

### Server Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment (development/production) | development | Yes |
| `PORT` | Backend server port | 3000 | No |
| `LOG_LEVEL` | Logging level (info/debug/error) | info | No |

### Frontend Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API base URL | http://localhost/api/v1 | Yes |

### CORS Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CORS_ORIGIN` | Allowed frontend origin | http://localhost:5173 | Yes |

**Production example**:
```env
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

### Security Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `BCRYPT_ROUNDS` | bcrypt cost factor | 12 | No |
| `RATE_LIMIT_LOGIN` | Login rate limit (requests/window) | 5 | No |
| `RATE_LIMIT_API` | API rate limit (requests/window) | 100 | No |
| `RATE_LIMIT_WINDOW` | Rate limit window (minutes) | 15 | No |

---

## Database Management

### Access Database

```powershell
# Access PostgreSQL shell
docker compose exec database psql -U taskswebuser -d taskswebdb
```

### Run SQL Scripts

```powershell
# Run init script
docker compose exec -T database psql -U taskswebuser -d taskswebdb < database/init.sql

# Run custom script
docker compose exec -T database psql -U taskswebuser -d taskswebdb < path/to/script.sql
```

### Backup Database

```powershell
# Create backup
docker compose exec database pg_dump -U taskswebuser taskswebdb > backup_$(Get-Date -Format "yyyyMMdd_HHmmss").sql

# Compress backup
Compress-Archive -Path backup_*.sql -DestinationPath backup_$(Get-Date -Format "yyyyMMdd_HHmmss").zip
```

### Restore Database

```powershell
# Stop backend to prevent connections
docker compose stop backend

# Drop and recreate database
docker compose exec database psql -U taskswebuser -c "DROP DATABASE IF EXISTS taskswebdb;"
docker compose exec database psql -U taskswebuser -c "CREATE DATABASE taskswebdb;"

# Restore from backup
docker compose exec -T database psql -U taskswebuser -d taskswebdb < backup_20251104_120000.sql

# Restart backend
docker compose start backend
```

### Database Queries

```sql
-- List all tables
\dt

-- Check user count
SELECT COUNT(*) FROM users;

-- Check task count by status
SELECT status, COUNT(*) FROM tasks GROUP BY status;

-- Check project assignments
SELECT p.name, COUNT(pa.user_id) as user_count
FROM projects p
LEFT JOIN project_assignments pa ON p.id = pa.project_id
GROUP BY p.name;

-- View recent notifications
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;
```

---

## Testing

### Backend Tests

```powershell
# Run all tests
docker compose exec backend npm test

# Run with coverage
docker compose exec backend npm run test:coverage

# Run specific test file
docker compose exec backend npm test -- auth.test.js

# Run in watch mode
docker compose exec backend npm test -- --watch
```

### Frontend Tests

```powershell
# Run all tests
docker compose exec frontend npm test

# Run with coverage
docker compose exec frontend npm run test:coverage

# Run E2E tests
docker compose exec frontend npm run test:e2e
```

### API Tests with curl

```powershell
# Register user
curl -X POST http://localhost/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"Test123!","full_name":"Test User","role":"user"}'

# Login
$response = curl -X POST http://localhost/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"Test123!"}' `
  -c cookies.txt

# Get profile (uses cookies)
curl -X GET http://localhost/api/v1/auth/me `
  -b cookies.txt

# Create project (master only)
curl -X POST http://localhost/api/v1/projects `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN_HERE" `
  -d '{"name":"Test Project","description":"Test description"}'
```

### Load Testing

```powershell
# Install Apache Bench (comes with Apache)
# Or use PowerShell script for basic load test

# Test login endpoint (50 requests, 10 concurrent)
ab -n 50 -c 10 -p login.json -T application/json http://localhost/api/v1/auth/login

# Where login.json contains:
# {"email":"test@example.com","password":"Test123!"}
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error**: `Bind for 0.0.0.0:80 failed: port is already allocated`

**Solution**:
```powershell
# Find process using port 80
netstat -ano | findstr :80

# Stop process (replace PID with actual process ID)
Stop-Process -Id PID -Force

# Or change port in docker-compose.yml
# nginx:
#   ports:
#     - "8080:80"
```

#### 2. Database Connection Failed

**Error**: `FATAL: password authentication failed for user "taskswebuser"`

**Solution**:
```powershell
# Check .env file has correct credentials
cat .env | Select-String DATABASE_URL

# Recreate containers with new env
docker compose down -v
docker compose up -d --build
```

#### 3. Out of Memory

**Error**: Container keeps restarting or OOM killed

**Solution**:
```powershell
# Check container memory usage
docker stats

# Increase memory limits in docker-compose.yml
# backend:
#   deploy:
#     resources:
#       limits:
#         memory: 512M  # Increase from 300M

# Restart services
docker compose down
docker compose up -d
```

#### 4. SSL Certificate Errors

**Error**: `SSL: CERTIFICATE_VERIFY_FAILED`

**Solution**:
```bash
# Renew Let's Encrypt certificates
sudo certbot renew

# Restart nginx
docker compose restart nginx
```

#### 5. Frontend Can't Connect to Backend

**Error**: `Network Error` or `CORS Error`

**Solution**:
```powershell
# Check CORS_ORIGIN in .env matches frontend URL
cat .env | Select-String CORS_ORIGIN

# Check backend is running
docker compose ps backend

# Check backend logs
docker compose logs backend | Select-String -Pattern "CORS|Error"

# Update CORS_ORIGIN and restart
docker compose restart backend
```

### Logs Location

```powershell
# Docker container logs
docker compose logs backend > backend.log
docker compose logs frontend > frontend.log
docker compose logs database > database.log

# Backend application logs (inside container)
docker compose exec backend ls -la /app/logs

# View application logs
docker compose exec backend tail -f /app/logs/app.log
docker compose exec backend tail -f /app/logs/error.log
```

### Health Checks

```powershell
# Check service health
docker compose ps

# Backend health
curl http://localhost/health

# Database connection test
docker compose exec database pg_isready -U taskswebuser

# Nginx status
curl -I http://localhost
```

### Reset Everything

```powershell
# Stop and remove all containers, volumes, networks
docker compose down -v

# Remove images
docker compose down --rmi all

# Remove all Docker data (WARNING: Nuclear option)
docker system prune -a --volumes -f

# Rebuild from scratch
docker compose up -d --build
```

### Debug Mode

```powershell
# Enable debug logging
# Edit .env:
# LOG_LEVEL=debug
# NODE_ENV=development

# Restart services
docker compose restart

# View detailed logs
docker compose logs -f --tail=1000 backend
```

---

## Performance Optimization

### Development Tips

1. **Use Docker volumes for hot reload**:
   ```yaml
   # Already configured in docker-compose.yml
   backend:
     volumes:
       - ./backend:/app
       - /app/node_modules  # Prevent overwriting
   ```

2. **Use npm cache**:
   ```powershell
   # Build with cache
   docker compose build --no-cache backend  # Only when needed
   docker compose build backend             # Normal build uses cache
   ```

3. **Limit log output**:
   ```powershell
   # Only show last 50 lines
   docker compose logs --tail=50 backend
   ```

### Production Optimization

1. **Enable PostgreSQL connection pooling**: Already configured in `database/init.sql`

2. **Monitor resource usage**:
   ```bash
   # Install monitoring tools on VPS
   sudo apt install htop iotop -y
   
   # Monitor in real-time
   htop
   docker stats
   ```

3. **Setup log rotation**:
   ```bash
   # Docker handles log rotation automatically
   # Check configuration
   docker inspect tasksweb-backend-1 | grep -A 10 LogConfig
   ```

---

## Next Steps

1. **Development**: 
   - Implement authentication endpoints (Phase 2 tasks)
   - Set up testing framework
   - Configure CI/CD pipeline

2. **Production**:
   - Set up monitoring (Prometheus + Grafana)
   - Configure automated backups
   - Setup CDN for static assets
   - Enable HTTPS with Let's Encrypt

3. **Documentation**:
   - API documentation at `/api/docs`
   - User manual
   - Admin guide

---

## Support

- **Documentation**: See README.md
- **API Reference**: http://localhost/api/docs
- **Constitution**: .specify/memory/constitution.md
- **Specification**: specs/001-auth-task-management/spec.md

---

**Quick Start Version**: 1.0.0  
**Last Updated**: 2025-11-04  
**Maintained By**: TasksWeb Development Team
