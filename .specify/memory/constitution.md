<!--
╔═══════════════════════════════════════════════════════════════════════════╗
║                        SYNC IMPACT REPORT                                 ║
╠═══════════════════════════════════════════════════════════════════════════╣
║ Version Change: (initial template) → 1.0.0                               ║
║                                                                           ║
║ Modified Principles:                                                      ║
║   - All principles populated from template                                ║
║                                                                           ║
║ Added Sections:                                                           ║
║   - I. Security-First Architecture (authentication, authorization, SSL)   ║
║   - II. Resource-Constrained Optimization (1GB RAM VPS target)            ║
║   - III. Role-Based Access Control (Master vs User distinction)           ║
║   - IV. API-First Design (REST, documentation, versioning)                ║
║   - V. Docker-Native Deployment (containerization, orchestration)         ║
║   - VI. Input Validation & Error Handling (frontend + backend)            ║
║   - VII. Observability & Alerting (logging, monitoring, notifications)    ║
║   - Technology Stack (specific versions and constraints)                  ║
║   - Deployment & Infrastructure (VPS, Docker, backup requirements)        ║
║                                                                           ║
║ Templates Requiring Updates:                                              ║
║   ✅ plan-template.md - Updated Constitution Check section                ║
║   ✅ spec-template.md - Security & resource constraints added             ║
║   ✅ tasks-template.md - Docker, security, and validation task types      ║
║                                                                           ║
║ Follow-up TODOs: None - all placeholders filled                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
-->

# TasksWeb Application Constitution

## Core Principles

### I. Security-First Architecture

**NON-NEGOTIABLE REQUIREMENTS**:

- **Authentication**: JWT tokens with HttpOnly cookies MUST be used for all authenticated requests. Passwords MUST be hashed with bcrypt (minimum cost factor: 10). Plain text password storage is STRICTLY FORBIDDEN.
- **Authorization**: Role-Based Access Control (RBAC) MUST be enforced server-side for every API endpoint. Master role has full CRUD access to projects/tasks/users; User role has read access to assigned items only.
- **Transport Security**: ALL traffic MUST use HTTPS/TLS. HTTP requests MUST be redirected to HTTPS. Let's Encrypt certificates MUST be automatically renewed.
- **Attack Prevention**: Rate limiting MUST be implemented on authentication endpoints (max 5 attempts per 15 minutes per IP). All inputs MUST be sanitized to prevent XSS and SQL injection. CSRF tokens MUST be validated for state-changing operations.
- **Token Management**: Access tokens MUST expire within 15 minutes. Refresh tokens MUST be stored securely and rotated on use. Logout MUST invalidate tokens immediately (blacklist implementation required).

**Rationale**: This is a multi-tenant task management system handling sensitive project data and user information. Security breaches could expose confidential business operations, timelines, and user credentials. Security MUST be embedded at the architecture level, not added as an afterthought.

### II. Resource-Constrained Optimization

**TARGET ENVIRONMENT**: 1GB RAM VPS with limited CPU and storage.

**MANDATORY OPTIMIZATIONS**:

- **Container Images**: MUST use Alpine Linux base images (node:20-alpine, postgres:16-alpine, nginx:alpine). Total container memory allocation MUST NOT exceed 750MB combined.
- **Database Configuration**: PostgreSQL shared_buffers MUST be set to 128MB or lower. Connection pooling MUST limit concurrent connections to 20 maximum. Query execution plans MUST be optimized to prevent full table scans on large datasets.
- **Frontend Build**: React production builds MUST be optimized with code splitting, tree shaking, and lazy loading. Bundle size MUST NOT exceed 2MB uncompressed. Static assets MUST be served via Nginx with gzip compression.
- **Backend Performance**: API response time MUST be under 200ms (p95) for list/read operations. Pagination MUST be implemented for all list endpoints (max 50 items per page). Background jobs (email alerts, notifications) MUST run asynchronously without blocking request threads.
- **Monitoring**: Container memory limits MUST be enforced via Docker. Health checks MUST terminate and restart containers exceeding 90% memory usage. VPS swap MUST be configured (2GB) but application MUST be optimized to avoid swapping.

**Rationale**: Low-cost VPS deployment requires extreme resource discipline. Over-allocation leads to OOM kills, slow response times, and poor user experience. Every megabyte and millisecond counts.

### III. Role-Based Access Control (RBAC)

**TWO ROLES ONLY**: Master (administrator) and User (team member).

**MASTER ROLE CAPABILITIES** (MUST be enforced server-side):

- Create, edit, delete projects
- Create, edit, delete tasks and sub-tasks within projects
- Assign users to projects and tasks
- Modify task deadlines, statuses, and assignments
- Approve or deny user requests for deadline extensions
- View all projects, tasks, and users across the system
- Receive alerts for tasks at risk of deadline expiry

**USER ROLE CAPABILITIES** (MUST be enforced server-side):

- View ONLY projects and tasks assigned to them
- Update status and time tracking on assigned tasks/sub-tasks
- Submit requests for deadline reassignments (approval required)
- View personal dashboard with calendar and upcoming tasks (next 2 days)
- Cannot create projects, reassign tasks, or view unassigned items

**ENFORCEMENT**:

- Every API endpoint MUST verify role authorization before data access
- Frontend MUST hide unavailable features but MUST NOT be trusted for security
- Database queries MUST filter by user assignments unless Master role confirmed
- Audit logs MUST record all role-based denials and privilege escalations

**Rationale**: Clear separation of concerns prevents unauthorized access, accidental data modification, and ensures accountability. Master users manage projects; team users execute tasks. No middle ground.

### IV. API-First Design

**REST API REQUIREMENTS**:

- **All features** MUST be accessible via documented REST endpoints
- **Versioning**: API routes MUST be prefixed with version (e.g., `/api/v1/projects`). Breaking changes require major version increment.
- **Standard HTTP Methods**: GET (read), POST (create), PUT/PATCH (update), DELETE (remove). Idempotency MUST be guaranteed for PUT and DELETE.
- **Status Codes**: 200 (success), 201 (created), 204 (no content), 400 (validation error), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error). Error responses MUST include machine-readable error codes and human-readable messages.
- **Documentation**: OpenAPI/Swagger specification MUST be maintained and served at `/api/docs`. Every endpoint MUST document request schemas, response formats, authentication requirements, and example payloads.
- **Response Format**: JSON for all responses. Include metadata (pagination, timestamps) in standardized envelope. Example: `{ "data": {...}, "meta": { "page": 1, "total": 50 } }`

**CRITICAL**: Frontend is a consumer of the API, not the authority. Backend logic MUST NOT be duplicated in frontend. API contracts MUST be stable and backward compatible within major versions.

**Rationale**: API-first design enables multiple clients (web, mobile, CLI, integrations), independent testing, and clear separation of concerns. Documentation prevents integration errors and supports future extensibility.

### V. Docker-Native Deployment

**MANDATORY CONTAINERIZATION**:

- **All services** (backend, frontend, database, reverse proxy) MUST run in Docker containers
- **Orchestration**: Docker Compose MUST manage service definitions, networking, volumes, and dependencies
- **Image Standards**: Alpine-based images MUST be used. Multi-stage builds MUST separate build and runtime environments. Image layers MUST be optimized to minimize size and build time.
- **Configuration**: Environment variables MUST be used for all secrets and configuration (database URLs, JWT secrets, SMTP credentials). Docker secrets or .env files MUST be used; hardcoded secrets are FORBIDDEN.
- **Networking**: Internal services (database) MUST NOT expose ports to host. Only Nginx reverse proxy MUST expose 80/443. Inter-service communication MUST use Docker internal networks.
- **Health Checks**: Every container MUST define health check commands. Unhealthy containers MUST be automatically restarted by Docker. Health check endpoints MUST NOT require authentication.
- **Volumes**: Database data MUST be persisted in named volumes. Application logs MAY be written to volumes for backup. Volumes MUST be explicitly defined in docker-compose.yml.

**DEPLOYMENT PROCESS**:

- Initial deployment: `docker-compose up -d`
- Updates: `docker-compose pull && docker-compose up -d --build`
- Database backups: Automated daily `pg_dump` to encrypted volume outside container

**Rationale**: Docker ensures consistent environments across development, staging, and production. VPS deployment is simplified to single-command deployment. Rollback is achieved by reverting to previous images.

### VI. Input Validation & Error Handling

**DUAL VALIDATION REQUIRED** (frontend AND backend):

- **Frontend Validation**: Immediate user feedback for format errors (email syntax, required fields, date ranges). Prevents unnecessary API calls. Uses libraries like Formik + Yup for React forms.
- **Backend Validation**: Authoritative validation using Joi or similar. MUST reject malformed requests with 400 status and detailed error messages. Schema validation MUST occur before business logic execution.

**ERROR HANDLING STANDARDS**:

- **User-Facing Errors**: Clear, actionable messages (e.g., "Email address already registered. Try logging in or use password reset."). NO technical stack traces in production.
- **Developer Errors**: Structured logging with stack traces, request context, user ID. Logged to files with daily rotation. Critical errors MUST trigger alerts.
- **Graceful Degradation**: Network failures, timeout errors MUST display retry options. Loading states MUST be shown during async operations. Partial failures (e.g., email send failed) MUST NOT block core workflows.

**CRITICAL**: Never trust client-side validation. Backend MUST assume all input is hostile until validated.

**Rationale**: Dual validation improves UX (instant feedback) and security (server-side enforcement). Clear error messages reduce support burden and improve user trust.

### VII. Observability & Alerting

**LOGGING REQUIREMENTS**:

- **Application Logs**: Structured JSON logs with timestamp, level, user_id, request_id, message. Levels: DEBUG, INFO, WARN, ERROR, CRITICAL. Log rotation: daily, keep 7 days.
- **Access Logs**: Nginx access logs with IP, method, endpoint, status, response time. Used for rate limiting and security audits.
- **Audit Logs**: All mutations (create, update, delete) MUST log: user, action, resource, timestamp, old/new values. Stored in database table for compliance.

**MONITORING REQUIREMENTS**:

- **Health Endpoints**: `/health` (liveness), `/ready` (readiness) for each service. Must return JSON with component status (database, external services).
- **Container Metrics**: Docker stats (CPU, memory, network) MUST be monitored. Alerts triggered at 80% memory usage.
- **Database Metrics**: Connection pool usage, slow query log (>100ms), table sizes. Alerts for connection exhaustion or disk space <10%.

**ALERTING REQUIREMENTS** (Business Logic):

- **Deadline Alerts**: Master users MUST receive notifications when tasks are at risk (not started within 50% of timeline, or in progress with <20% time remaining).
- **Delivery Channels**: Real-time in-app notifications (WebSocket or polling) + email alerts (configurable per user).
- **Alert Escalation**: Repeated failures to start tasks MUST escalate alert severity.

**CRITICAL**: Logs MUST NOT contain passwords, tokens, or PII. Sensitive fields MUST be redacted/masked.

**Rationale**: Observability enables proactive problem detection, debugging, and business intelligence (task completion rates, bottlenecks). Alerts prevent missed deadlines and project delays.

## Technology Stack

**REQUIRED VERSIONS AND TOOLS**:

- **Backend**: Node.js 20.x (LTS) with Express 4.x, TypeScript 5.x strongly recommended for type safety
- **Frontend**: React 18.x with modern component library (Material-UI 5.x, Tailwind CSS 3.x, or Chakra UI 2.x)
- **Database**: PostgreSQL 16.x (Alpine image), with pg driver for Node.js
- **Authentication**: jsonwebtoken library for JWT, bcrypt for password hashing (cost factor 10-12)
- **Validation**: Joi (backend), Yup (frontend) for schema validation
- **Container Runtime**: Docker Engine 24.x+, Docker Compose 2.x+
- **Reverse Proxy**: Nginx 1.24+ (Alpine image) with Let's Encrypt certbot for SSL
- **Testing** (optional but recommended): Jest for unit tests, Supertest for API integration tests, React Testing Library for frontend

**CONSTRAINTS**:

- Avoid heavy dependencies (e.g., full ORMs like Sequelize). Prefer lightweight query builders (pg with raw SQL or lightweight abstractions).
- No client-side state management libraries (Redux, MobX) unless application complexity demands it. Start with React Context + hooks.
- No GraphQL, WebSockets for primary API (use REST). WebSockets MAY be used for real-time notifications only.

**Rationale**: Version pinning ensures reproducible builds. Lightweight choices align with resource constraints. TypeScript prevents runtime type errors. Established tools reduce learning curve and leverage community support.

## Deployment & Infrastructure

**VPS SPECIFICATIONS**:

- **Minimum**: 1 vCPU, 1GB RAM, 20GB SSD, unmetered bandwidth
- **Operating System**: Ubuntu 22.04 LTS or Debian 12
- **Firewall**: UFW configured to allow only 22 (SSH), 80 (HTTP), 443 (HTTPS)
- **Swap**: 2GB swap file configured to handle memory spikes

**DOCKER INFRASTRUCTURE**:

- **Compose Services**: backend (Node.js API), frontend (Nginx serving static build), database (PostgreSQL), reverse-proxy (Nginx with SSL)
- **Memory Limits**: Backend (300MB), Database (300MB), Nginx (100MB), with 50MB reserved for OS and monitoring
- **Restart Policy**: `restart: unless-stopped` for all services

**BACKUP & DISASTER RECOVERY**:

- **Database Backup**: Automated daily `pg_dump` via cron job inside database container. Encrypted backups stored on separate volume or external storage (S3, SFTP).
- **Backup Retention**: Keep 7 daily, 4 weekly, 3 monthly backups
- **Restore Testing**: Monthly verification that backups can be restored successfully
- **Application Configuration**: `.env` files and docker-compose.yml MUST be version controlled (secrets excluded, stored securely on VPS)

**SECURITY HARDENING**:

- SSH key-only authentication (disable password login)
- Automatic security updates enabled (unattended-upgrades)
- Fail2ban configured for SSH and Nginx
- Docker containers run as non-root users where possible

**Rationale**: Documented infrastructure enables disaster recovery, reproducible deployments, and knowledge transfer. Security hardening reduces attack surface. Backups protect against data loss from hardware failure, user error, or ransomware.

## Governance

**AUTHORITY**: This constitution supersedes all other development practices, guidelines, and conventions. In case of conflict, constitution principles take precedence.

**COMPLIANCE VERIFICATION**:

- Every feature specification MUST include a "Constitution Check" section verifying alignment with all seven core principles
- Code reviews MUST verify compliance with security, validation, and error handling standards
- Pull requests introducing new dependencies MUST justify impact on resource constraints (Principle II)

**AMENDMENT PROCESS**:

1. Proposed amendments MUST be documented with rationale and impact analysis
2. Breaking changes (removing or redefining principles) require MAJOR version increment
3. New principles or expanded guidance require MINOR version increment
4. Clarifications, typo fixes, or non-semantic refinements require PATCH increment
5. Amendments MUST include migration plan for existing code/infrastructure if applicable
6. All template files (plan, spec, tasks) MUST be updated to reflect new principles within same commit

**COMPLEXITY JUSTIFICATION**:

- Deviations from core principles MUST be explicitly justified in specification documents
- Performance optimizations that reduce code clarity MUST document trade-offs and benchmarks
- Third-party dependencies MUST be justified (functionality not feasible to implement in-house within resource constraints)

**RUNTIME GUIDANCE**: For operational development workflow, refer to `.github/prompts/speckit.constitution.prompt.md` for constitution update procedures and `.specify/templates/` for feature implementation workflows.

**Version**: 1.0.0 | **Ratified**: 2025-11-04 | **Last Amended**: 2025-11-04
