# TasksWeb Constitution Amendment Summary

## Change Summary

**Version**: 1.0.0 (Initial Constitution)  
**Date**: 2025-11-04  
**Type**: MAJOR - Initial constitution creation

---

## Constitution Update

### Version Change
- **From**: Template placeholders
- **To**: v1.0.0 (fully populated)

### Core Principles Established

The TasksWeb Constitution defines **seven core principles** that govern all development:

1. **Security-First Architecture** (NON-NEGOTIABLE)
   - JWT authentication with HttpOnly cookies
   - bcrypt password hashing (cost factor 10-12)
   - Role-Based Access Control (RBAC) enforced server-side
   - HTTPS/TLS for all traffic with Let's Encrypt
   - Rate limiting, input sanitization, CSRF protection
   - Token blacklisting on logout

2. **Resource-Constrained Optimization**
   - Target: 1GB RAM VPS with limited CPU/storage
   - Alpine Linux base images for all containers
   - PostgreSQL tuning: shared_buffers=128MB, max 20 connections
   - Total container memory: ≤750MB combined
   - API response time: <200ms (p95) for read operations
   - Pagination required for all list endpoints (max 50 items)

3. **Role-Based Access Control (RBAC)**
   - **Master role**: Full CRUD on projects/tasks, user management, approval workflows
   - **User role**: Read-only on assigned items, status updates, deadline requests
   - Server-side enforcement on every API endpoint
   - Frontend hides unavailable features (but is NOT trusted for security)
   - Audit logging for all role-based denials

4. **API-First Design**
   - All features accessible via documented REST endpoints
   - Versioning: `/api/v1/...` with breaking changes = major version bump
   - Standard HTTP methods and status codes
   - OpenAPI/Swagger documentation at `/api/docs`
   - JSON responses with standardized error format

5. **Docker-Native Deployment**
   - All services containerized: backend, frontend, database, reverse proxy
   - Docker Compose orchestration
   - Alpine-based images with multi-stage builds
   - Environment variables for all secrets (no hardcoded credentials)
   - Health checks for automatic restart of unhealthy containers
   - Named volumes for persistent data

6. **Input Validation & Error Handling**
   - **Dual validation**: Frontend (instant feedback) + Backend (authoritative)
   - Frontend: Formik + Yup for React forms
   - Backend: Joi schemas validated before business logic
   - Clear, actionable error messages for users
   - Structured logging with stack traces for developers
   - Graceful degradation with retry options

7. **Observability & Alerting**
   - Structured JSON logs (timestamp, level, user_id, request_id)
   - Daily log rotation, 7-day retention
   - Health endpoints: `/health` (liveness), `/ready` (readiness)
   - Container metrics: CPU, memory, network monitoring
   - Business alerts: Master users notified of deadline risks
   - Email + in-app notifications (WebSocket or polling)

---

## Technology Stack Defined

### Backend
- Node.js 20.x (LTS) with Express 4.x
- TypeScript 5.x (strongly recommended)
- PostgreSQL 16.x (Alpine)
- JWT (jsonwebtoken) + bcrypt for auth
- Joi for validation

### Frontend
- React 18.x
- Material-UI 5.x / Tailwind CSS 3.x / Chakra UI 2.x
- Yup for form validation
- React Context + Hooks (no Redux unless complexity demands)

### Infrastructure
- Docker 24.x+, Docker Compose 2.x+
- Nginx (Alpine) with Let's Encrypt SSL
- Ubuntu 22.04 / Debian 12 VPS

---

## Template Files Updated

### ✅ `.specify/templates/plan-template.md`
- **Constitution Check section expanded** with all seven principles
- Each principle has a checkbox for compliance verification
- Complexity justification field added for deviations

### ✅ `.specify/templates/spec-template.md`
- **Security Requirements section** added (mandatory for auth/authorization features)
- **Resource Constraints section** added (mandatory for performance-impacting features)
- Sections include: authentication method, role access, input validation, sensitive data handling, rate limiting, database query complexity, memory usage, API latency targets

### ✅ `.specify/templates/tasks-template.md`
- **Phase 1: Setup** expanded with Docker/infrastructure tasks:
  - Docker Compose setup (4 services)
  - Dockerfiles for backend (Node Alpine) and frontend (multi-stage Nginx Alpine)
  - PostgreSQL container with memory limits
  - Nginx reverse proxy with SSL/TLS
  - Environment variable management
  
- **Phase 2: Foundational** expanded with security/validation tasks:
  - JWT authentication middleware
  - bcrypt password hashing utilities
  - RBAC authorization middleware
  - Input validation framework (Joi/Yup)
  - Rate limiting middleware
  - Error handling and structured logging
  - Health check endpoints
  - CORS and security headers (helmet.js)
  - Database connection pooling

---

## Supporting Documentation Created

### ✅ `README.md` (Comprehensive Project Documentation)
- **Overview**: Features, tech stack, architecture
- **Quick Start**: Installation, configuration, deployment steps
- **Development**: Local setup, testing, code quality
- **Deployment**: VPS preparation, Docker deployment, SSL setup
- **Architecture**: Security flow, database schema, API endpoints
- **Resource Optimization**: Memory limits, monitoring commands
- **Troubleshooting**: Common issues and solutions
- **Maintenance**: Backup/restore procedures, update process
- **Governance**: Reference to constitution and feature workflow

### ✅ `.env.example` (Environment Variables Template)
- Database credentials (PostgreSQL)
- JWT secrets (access + refresh)
- bcrypt cost factor
- Rate limiting configuration
- SMTP settings for email alerts
- Logging configuration
- CORS origins
- Alert thresholds
- Feature flags

### ✅ `.gitignore`
- Environment files (.env, .env.*)
- Secrets (*.pem, *.key, ssl/)
- Node.js artifacts (node_modules, logs)
- Docker runtime data
- Database backups
- IDE/editor files

### ✅ `docker-compose.yml` (Service Orchestration)
- **4 services**: database (PostgreSQL), backend (Node.js), frontend (React/Nginx), nginx (reverse proxy)
- **Memory limits**: Database (300MB), Backend (300MB), Nginx (100MB)
- **Health checks**: All services with proper startup dependencies
- **Networks**: Isolated bridge network for internal communication
- **Volumes**: Persistent data for database and logs

### ✅ `database/init.sql` (Database Schema)
- **8 tables**: users, refresh_tokens, projects, tasks, task_assignments, deadline_requests, time_logs, notifications, audit_logs
- **Indexes**: Optimized for query performance
- **Constraints**: Data integrity with check constraints
- **Triggers**: Auto-update timestamps, aggregate actual_hours from time_logs
- **Views**: task_details (with assignments), user_workload (summary)
- **Comments**: Documentation for all tables

### ✅ `nginx/nginx.conf` (Reverse Proxy Configuration)
- **Security headers**: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, HSTS
- **Rate limiting**: Login endpoints (5 req/min), API (100 req/min)
- **Gzip compression**: Static assets, JSON, JavaScript
- **SSL/TLS**: TLS 1.2/1.3, modern cipher suites, OCSP stapling
- **HTTP → HTTPS redirect**: All traffic forced to HTTPS
- **Proxy configuration**: Backend API and frontend static files
- **Health checks**: Accessible at `/health`

### ✅ `nginx/ssl/README.md` (SSL Setup Instructions)
- Development: Self-signed certificate generation
- Production: Let's Encrypt with certbot
- Certificate renewal process
- Security best practices
- Troubleshooting guide

---

## Governance Rules Established

### Authority
- Constitution supersedes all other practices
- In case of conflict, constitution takes precedence

### Compliance Verification
- Every feature spec MUST include "Constitution Check" section
- Code reviews MUST verify compliance with principles
- New dependencies MUST justify resource impact

### Amendment Process
- **MAJOR version**: Backward-incompatible changes (removing/redefining principles)
- **MINOR version**: New principles or expanded guidance
- **PATCH version**: Clarifications, typos, non-semantic refinements
- All templates MUST be updated in same commit as constitution amendment

### Complexity Justification
- Deviations from principles MUST be documented in specs
- Performance trade-offs MUST include benchmarks
- Third-party dependencies MUST be justified

---

## Project Structure Created

```
TareasWeb/
├── .github/
│   └── prompts/
│       └── speckit.constitution.prompt.md
├── .specify/
│   ├── memory/
│   │   └── constitution.md          ✅ UPDATED (v1.0.0)
│   └── templates/
│       ├── plan-template.md         ✅ UPDATED
│       ├── spec-template.md         ✅ UPDATED
│       ├── tasks-template.md        ✅ UPDATED
│       ├── agent-file-template.md
│       └── checklist-template.md
├── database/
│   └── init.sql                     ✅ NEW
├── nginx/
│   ├── nginx.conf                   ✅ NEW
│   └── ssl/
│       └── README.md                ✅ NEW
├── .env.example                     ✅ NEW
├── .gitignore                       ✅ NEW
├── docker-compose.yml               ✅ NEW
└── README.md                        ✅ NEW
```

**Note**: Backend and frontend source code directories will be created during implementation phase following the established constitution.

---

## Next Steps

### Immediate Actions Required

1. **Create Backend Structure**:
   ```bash
   mkdir -p backend/{src/{models,services,controllers,middleware,utils},tests}
   ```

2. **Create Frontend Structure**:
   ```bash
   mkdir -p frontend/{src/{components,pages,services,hooks},public}
   ```

3. **Initialize Projects**:
   ```bash
   cd backend && npm init -y
   cd ../frontend && npx create-react-app .
   ```

4. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with secure values
   ```

5. **Generate SSL Certificate** (Development):
   ```bash
   cd nginx/ssl
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout privkey.pem -out fullchain.pem \
     -subj "/CN=localhost"
   ```

### Feature Development Workflow

For each new feature:

1. **Specification Phase**:
   - Create spec using `.specify/templates/spec-template.md`
   - Define user stories with priorities (P1, P2, P3)
   - Include Security Requirements and Resource Constraints sections
   - Run Constitution Check against all seven principles

2. **Planning Phase**:
   - Create implementation plan using `.specify/templates/plan-template.md`
   - Document technical context (versions, dependencies, constraints)
   - Verify Constitution Check compliance
   - Define project structure (backend/frontend paths)

3. **Task Breakdown**:
   - Generate tasks using `.specify/templates/tasks-template.md`
   - Group by user story for independent implementation
   - Include foundational tasks (auth, validation, Docker) before features
   - Add tests first if TDD is required

4. **Implementation**:
   - Follow tasks in order: Setup → Foundational → User Stories
   - Write tests before implementation (if applicable)
   - Verify compliance at each checkpoint
   - Update documentation as you build

5. **Review & Merge**:
   - Code review verifies constitution compliance
   - All tests pass
   - Documentation updated
   - Complexity deviations justified

---

## Suggested Commit Message

```
docs: initialize TasksWeb constitution v1.0.0 with governance framework

- Establish seven core principles: Security-First, Resource-Constrained,
  RBAC, API-First, Docker-Native, Validation, Observability
- Define technology stack: Node.js 20, React 18, PostgreSQL 16, Docker
- Update templates with constitution checks and expanded task types
- Create comprehensive README, docker-compose.yml, database schema
- Configure Nginx reverse proxy with security hardening
- Set up environment configuration and .gitignore

BREAKING CHANGE: Initial constitution ratification establishes
non-negotiable principles for all future development
```

---

## Files Requiring Manual Attention

### ⚠️ Pending Implementation
None - all placeholders filled, all templates updated.

### 📋 Follow-up Tasks
1. **Backend Implementation**: Set up Express server, models, controllers, middleware
2. **Frontend Implementation**: Create React components, pages, API client
3. **Testing Setup**: Jest, Supertest, React Testing Library
4. **CI/CD Pipeline**: GitHub Actions or similar (optional, resource-permitting)
5. **Production SSL**: Obtain Let's Encrypt certificate for domain

---

## Validation Checklist

- [x] Constitution template fully populated (no bracketed placeholders)
- [x] Version incremented correctly (1.0.0 for initial ratification)
- [x] Ratification and amendment dates set to 2025-11-04
- [x] All seven principles defined with rationale
- [x] Technology stack specified with versions
- [x] Deployment infrastructure documented
- [x] Governance rules established
- [x] Plan template updated with constitution checks
- [x] Spec template updated with security/resource sections
- [x] Tasks template updated with Docker/validation tasks
- [x] README created with comprehensive documentation
- [x] Environment variables template created
- [x] .gitignore configured
- [x] Docker Compose configured with memory limits
- [x] Database schema created with indexes and triggers
- [x] Nginx reverse proxy configured with security headers
- [x] SSL setup instructions provided

---

**Constitution Status**: ✅ **RATIFIED** - Ready for development

All governance artifacts are in place. Feature development can begin following the established workflow.
