# TasksWeb - Project & Task Management System

A secure, resource-efficient web application for project and task management with role-based access control, built for deployment on 1GB RAM VPS.

## Overview

TasksWeb is a full-stack application designed for teams to manage projects, tasks, and sub-tasks with clear role separation:

- **Master Users**: Create/edit projects, assign tasks, manage team members, monitor deadlines
- **Regular Users**: View assigned tasks, update status, track time, request deadline extensions

Built with security, resource efficiency, and Docker-native deployment as core principles.

## Key Features

- 🔐 **Secure Authentication**: JWT tokens with HttpOnly cookies, bcrypt password hashing
- 👥 **Role-Based Access Control**: Master vs User roles with server-side enforcement
- 📊 **Project Management**: Multi-level task hierarchy (Projects → Tasks → Sub-tasks)
- 📅 **Calendar Integration**: Visual timeline for tasks with upcoming/overdue indicators
- ⏱️ **Time Tracking**: Actual vs. estimated time tracking per task
- 🔔 **Smart Alerts**: Real-time and email notifications for deadline risks
- 🐳 **Docker Deployment**: Single-command deployment with Docker Compose
- 💾 **Automated Backups**: Daily encrypted PostgreSQL backups
- 📱 **Responsive UI**: Desktop and mobile support with modern React components

## Technology Stack

### Backend
- **Runtime**: Node.js 20.x (Alpine)
- **Framework**: Express 4.x with TypeScript
- **Database**: PostgreSQL 16.x (Alpine)
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **Validation**: Joi (server-side input validation)

### Frontend
- **Framework**: React 18.x
- **UI Library**: Material-UI 5.x / Tailwind CSS 3.x / Chakra UI 2.x
- **Validation**: Yup (client-side form validation)
- **State Management**: React Context + Hooks

### Infrastructure
- **Containerization**: Docker 24.x+, Docker Compose 2.x+
- **Reverse Proxy**: Nginx (Alpine) with Let's Encrypt SSL
- **Target Environment**: 1GB RAM VPS (Ubuntu 22.04 / Debian 12)

## Project Structure

```
TareasWeb/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── models/         # Database models and schemas
│   │   ├── services/       # Business logic layer
│   │   ├── controllers/    # API route handlers
│   │   ├── middleware/     # Auth, validation, error handling
│   │   └── utils/          # Helpers, logging, validation
│   ├── tests/              # Backend tests
│   ├── Dockerfile          # Backend container definition
│   └── package.json
├── frontend/               # React single-page application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route-level page components
│   │   ├── services/       # API client, auth utilities
│   │   └── hooks/          # Custom React hooks
│   ├── public/             # Static assets
│   ├── Dockerfile          # Multi-stage frontend build
│   └── package.json
├── database/               # Database initialization scripts
│   └── init.sql            # Schema and seed data
├── nginx/                  # Reverse proxy configuration
│   ├── nginx.conf          # Nginx configuration
│   └── ssl/                # SSL certificates (Let's Encrypt)
├── docker-compose.yml      # Service orchestration
├── .env.example            # Environment variable template
└── .specify/               # Project governance and templates
    ├── memory/
    │   └── constitution.md # Project constitution (principles, standards)
    └── templates/          # Feature specification templates
```

## Quick Start

### Prerequisites

- Docker Engine 24.x+ and Docker Compose 2.x+
- Git
- Text editor or IDE

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd TareasWeb
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration:
   # - Database credentials
   # - JWT secret keys
   # - SMTP settings (for email alerts)
   ```

3. **Build and start services**:
   ```bash
   docker-compose up -d --build
   ```

4. **Verify deployment**:
   ```bash
   docker-compose ps
   # All services should show "Up" status
   
   # Check health endpoints:
   curl http://localhost/api/health
   ```

5. **Access the application**:
   - Frontend: http://localhost (or your domain)
   - API Documentation: http://localhost/api/docs

### Initial Setup

1. **Create Master user** (run inside backend container):
   ```bash
   docker-compose exec backend npm run create-master -- --email admin@example.com --password YourSecurePassword
   ```

2. **Login and configure**:
   - Navigate to http://localhost
   - Login with master credentials
   - Create projects and invite users

## Development

### Local Development Setup

1. **Start services in development mode**:
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

2. **Backend development** (with hot reload):
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **Frontend development** (with hot reload):
   ```bash
   cd frontend
   npm install
   npm start
   ```

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Code Quality

```bash
# Lint and format backend
cd backend
npm run lint
npm run format

# Lint and format frontend
cd frontend
npm run lint
npm run format
```

## Deployment

### VPS Deployment (Production)

1. **Prepare VPS** (Ubuntu 22.04):
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Configure firewall
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   
   # Add swap (for 1GB RAM VPS)
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```

2. **Deploy application**:
   ```bash
   # Clone repository
   git clone <repository-url> /opt/tareasweb
   cd /opt/tareasweb
   
   # Configure production environment
   cp .env.example .env
   nano .env  # Edit with production values
   
   # Deploy
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Setup SSL with Let's Encrypt**:
   ```bash
   # Install certbot
   sudo apt install certbot python3-certbot-nginx
   
   # Obtain certificate
   sudo certbot --nginx -d yourdomain.com
   
   # Auto-renewal is configured by default
   ```

4. **Configure automated backups**:
   ```bash
   # Add backup cron job
   sudo crontab -e
   # Add line: 0 2 * * * /opt/tareasweb/scripts/backup.sh
   ```

### Environment Variables

Key environment variables (see `.env.example` for complete list):

```env
# Database
POSTGRES_DB=tareasweb
POSTGRES_USER=tareasweb_user
POSTGRES_PASSWORD=<secure-random-password>
POSTGRES_HOST=database
POSTGRES_PORT=5432

# JWT Authentication
JWT_SECRET=<secure-random-string-min-32-chars>
JWT_REFRESH_SECRET=<different-secure-random-string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Application
NODE_ENV=production
API_PORT=3000
FRONTEND_URL=https://yourdomain.com

# Email (for alerts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=<app-specific-password>
SMTP_FROM=TasksWeb <noreply@yourdomain.com>
```

## Architecture

### Security Architecture

- **Authentication Flow**: JWT access tokens (15min) + refresh tokens (7 days)
- **Password Security**: bcrypt with cost factor 10-12, salted hashes
- **Authorization**: Server-side RBAC checks on every API endpoint
- **Transport Security**: HTTPS/TLS for all traffic, HSTS enabled
- **Attack Prevention**: Rate limiting (5 attempts/15min), input sanitization, CSRF protection

### Database Schema (High-Level)

```
users
├── id (uuid, primary key)
├── email (unique)
├── password_hash
├── role (enum: 'master', 'user')
└── created_at

projects
├── id (uuid, primary key)
├── name
├── description
├── created_by (fk → users)
└── created_at

tasks
├── id (uuid, primary key)
├── project_id (fk → projects)
├── parent_task_id (fk → tasks, nullable for sub-tasks)
├── title
├── description
├── status (enum: 'not_started', 'in_progress', 'completed')
├── assigned_to (fk → users)
├── start_date
├── end_date
├── estimated_hours
├── actual_hours
└── created_at

task_assignments (many-to-many)
├── task_id (fk → tasks)
├── user_id (fk → users)
└── assigned_at

deadline_requests
├── id (uuid, primary key)
├── task_id (fk → tasks)
├── requested_by (fk → users)
├── new_deadline
├── reason
├── status (enum: 'pending', 'approved', 'denied')
└── created_at
```

### API Endpoints (Summary)

**Authentication**:
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - Login (returns JWT)
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout (invalidate tokens)

**Projects** (Master only):
- `GET /api/v1/projects` - List all projects
- `POST /api/v1/projects` - Create project
- `PUT /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project

**Tasks**:
- `GET /api/v1/tasks` - List tasks (filtered by user role)
- `POST /api/v1/tasks` - Create task (Master only)
- `PUT /api/v1/tasks/:id` - Update task
- `PATCH /api/v1/tasks/:id/status` - Update task status (Users can update assigned tasks)

**Dashboard**:
- `GET /api/v1/dashboard/user` - User dashboard (assigned tasks, upcoming)
- `GET /api/v1/dashboard/master` - Master dashboard (all projects overview)

See `/api/docs` for complete API documentation.

## Resource Optimization

This application is optimized for 1GB RAM VPS:

- **Container Memory Limits**: Backend (300MB), Database (300MB), Nginx (100MB)
- **Database Tuning**: `shared_buffers=128MB`, max 20 connections
- **Frontend Optimization**: Code splitting, lazy loading, gzip compression
- **Query Optimization**: Indexed columns, pagination (50 items/page), optimized joins

**Monitoring**:
```bash
# Check container memory usage
docker stats

# Check database connections
docker-compose exec database psql -U tareasweb_user -d tareasweb -c "SELECT count(*) FROM pg_stat_activity;"
```

## Troubleshooting

### Common Issues

**Containers fail to start**:
```bash
# Check logs
docker-compose logs backend
docker-compose logs database

# Restart services
docker-compose restart
```

**Database connection errors**:
```bash
# Verify database is running
docker-compose ps database

# Check database health
docker-compose exec database pg_isready -U tareasweb_user
```

**High memory usage**:
```bash
# Check stats
docker stats

# Restart specific service
docker-compose restart backend
```

**SSL certificate issues**:
```bash
# Renew certificate
sudo certbot renew

# Reload Nginx
docker-compose restart nginx
```

## Maintenance

### Database Backups

**Manual backup**:
```bash
docker-compose exec database pg_dump -U tareasweb_user tareasweb | gzip > backup_$(date +%Y%m%d).sql.gz
```

**Restore from backup**:
```bash
gunzip < backup_20250101.sql.gz | docker-compose exec -T database psql -U tareasweb_user tareasweb
```

### Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Run migrations (if any)
docker-compose exec backend npm run migrate
```

## Governance

This project follows a strict constitution defining seven core principles:

1. **Security-First Architecture**: JWT, bcrypt, RBAC, HTTPS
2. **Resource-Constrained Optimization**: 1GB RAM target
3. **Role-Based Access Control**: Master vs User enforcement
4. **API-First Design**: REST with versioning and documentation
5. **Docker-Native Deployment**: Container orchestration
6. **Input Validation & Error Handling**: Dual validation (frontend + backend)
7. **Observability & Alerting**: Logging, monitoring, notifications

See `.specify/memory/constitution.md` for complete governance documentation.

### Feature Development Workflow

1. **Specification**: Create feature spec using `.specify/templates/spec-template.md`
2. **Planning**: Generate implementation plan with constitution check
3. **Tasks**: Break down into user stories with independent test capability
4. **Implementation**: Follow test-first approach when applicable
5. **Review**: Verify constitution compliance before merge

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the constitution principles and templates
4. Write tests for new functionality
5. Commit changes (`git commit -m 'feat: add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

[Specify License - e.g., MIT, Apache 2.0, Proprietary]

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Contact: [jrtejada@gmail.com]

## Acknowledgments

Built with modern web technologies and best practices for secure, efficient project management.

---

**Version**: 1.0.0 | **Last Updated**: 2025-11-04
