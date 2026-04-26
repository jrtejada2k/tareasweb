# Implementation Plan: Authentication and Task Management System

**Branch**: `001-auth-task-management` | **Date**: 2025-11-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-auth-task-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Building a complete authentication and task management system with secure JWT-based login, role-based access control (Master/User), project/task/sub-task hierarchy, user assignments, dual dashboards (Master: project cards, User: calendar view), status tracking with Spanish terminology, deadline management with extension requests, automated deadline alerts, and time tracking. 

**Technical Approach**: Full-stack web application using Node.js 20 + Express + TypeScript for backend REST API, React 18 + modern UI library for frontend, PostgreSQL 16 for relational data storage, all containerized with Docker Compose using Alpine-based images optimized for 1GB RAM VPS deployment. JWT authentication with HttpOnly cookies, bcrypt password hashing, server-side RBAC enforcement, Nginx reverse proxy with SSL/TLS termination.

## Technical Context

**Language/Version**: 
- **Backend**: Node.js 20.x LTS with TypeScript 5.x
- **Frontend**: JavaScript/TypeScript with React 18.x

**Primary Dependencies**:
- **Backend**: Express 4.x (REST API), jsonwebtoken (JWT auth), bcrypt (password hashing), Joi (validation), pg (PostgreSQL driver), winston (logging), express-rate-limit (rate limiting), node-cron (scheduled jobs), nodemailer (email alerts)
- **Frontend**: React 18.x, Material-UI 5.x OR Tailwind CSS 3.x OR Chakra UI 2.x (modern component library), React Router 6.x (navigation), Axios (API client), Formik + Yup (form validation), React Calendar OR FullCalendar (calendar view), React Toastify (notifications)
- **Infrastructure**: Docker 24.x+, Docker Compose 2.x+, Nginx (Alpine) for reverse proxy

**Storage**: PostgreSQL 16.x (Alpine image) with optimized configuration:
- shared_buffers: 128MB
- max_connections: 20
- effective_cache_size: 256MB
- Tables: users, projects, tasks, task_assignments, project_assignments, deadline_requests, time_entries, notifications, refresh_tokens, audit_logs

**Testing**: 
- **Backend**: Jest (unit/integration tests), Supertest (API endpoint testing)
- **Frontend**: Jest + React Testing Library (component tests)
- **E2E**: Optional - Playwright or Cypress if resources permit

**Target Platform**: 
- **Production**: Linux VPS (Ubuntu 22.04 LTS or Debian 12) with 1GB RAM, 1 vCPU, 20GB SSD
- **Containers**: Docker Engine 24.x+ with Docker Compose orchestration
- **Web Browsers**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) with responsive design for desktop (1920x1080 to 1366x768) and mobile (375x667 to 414x896)

**Project Type**: Web application (full-stack with separated backend API and frontend SPA)

**Performance Goals**:
- API throughput: 50-100 requests/second sustained
- Login/authentication: <500ms response time (includes bcrypt hashing)
- Read operations (task lists, dashboards): <150ms p95 latency
- Write operations (create/update tasks): <200ms p95 latency
- Dashboard rendering: <2 seconds for 50 projects or 100 tasks
- Calendar view: <300ms load time with lazy loading for large datasets
- Concurrent users: Support 50-100 simultaneous authenticated sessions
- Database query optimization: All queries <100ms execution time with proper indexing

**Constraints**:
- **Memory**: Total container memory allocation ≤750MB (Backend: 300MB, Database: 300MB, Nginx: 100MB, Frontend: 50MB)
- **Response Time**: API p95 latency <200ms for reads, <300ms for writes
- **Bundle Size**: Frontend production build <2MB uncompressed (code-split, tree-shaken)
- **Database**: Connection pool limited to 20 max connections
- **Security**: JWT access tokens expire in 15 minutes, refresh tokens in 7 days
- **Rate Limiting**: Login attempts limited to 5 per 15 minutes per IP
- **Pagination**: All list endpoints return max 50 items per page
- **Accessibility**: WCAG 2.1 Level AA compliance (ideal goal)
- **Browser Support**: No IE11 support (modern browsers only to reduce bundle size)

**Scale/Scope**:
- **Users**: 100-1000 total users, 50-100 concurrent sessions
- **Projects**: 50-500 projects in system
- **Tasks**: 500-10,000 tasks (including sub-tasks)
- **Time Entries**: 10,000-100,000 time log entries over time
- **Codebase**: Estimated 15,000-20,000 lines of code (backend + frontend combined)
- **API Endpoints**: Approximately 30-40 REST endpoints across all features
- **Database Growth**: 20-150MB first year with daily backups (7 daily, 4 weekly, 3 monthly retention)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Verify compliance with TasksWeb Constitution principles**:

- [ ] **Security-First**: Does feature implement JWT auth, input validation, RBAC checks, HTTPS?
- [ ] **Resource-Constrained**: Does feature respect 1GB RAM limit, use Alpine images, optimize queries?
- [ ] **RBAC Enforcement**: Does feature properly distinguish Master vs User role capabilities?
- [ ] **API-First Design**: Are all features exposed via documented REST endpoints with proper versioning?
- [ ] **Docker-Native**: Can feature be deployed via Docker Compose with health checks?
- [ ] **Input Validation**: Does feature validate inputs on frontend AND backend with clear error messages?
- [ ] **Observability**: Does feature include logging, monitoring, and business alerts where applicable?

**Complexity Justification** (if any gates fail): [Document trade-offs and mitigation plan]

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/              # Database models (User, Project, Task, etc.)
│   │   ├── User.ts
│   │   ├── Project.ts
│   │   ├── Task.ts
│   │   ├── TaskAssignment.ts
│   │   ├── ProjectAssignment.ts
│   │   ├── DeadlineRequest.ts
│   │   ├── TimeEntry.ts
│   │   ├── Notification.ts
│   │   └── RefreshToken.ts
│   ├── services/            # Business logic layer
│   │   ├── authService.ts
│   │   ├── userService.ts
│   │   ├── projectService.ts
│   │   ├── taskService.ts
│   │   ├── assignmentService.ts
│   │   ├── deadlineService.ts
│   │   ├── timeTrackingService.ts
│   │   ├── notificationService.ts
│   │   └── alertService.ts
│   ├── controllers/         # API route handlers
│   │   ├── authController.ts
│   │   ├── projectController.ts
│   │   ├── taskController.ts
│   │   ├── userController.ts
│   │   ├── dashboardController.ts
│   │   ├── deadlineController.ts
│   │   └── timeTrackingController.ts
│   ├── middleware/          # Express middleware
│   │   ├── authMiddleware.ts      # JWT validation
│   │   ├── rbacMiddleware.ts      # Role-based access control
│   │   ├── validationMiddleware.ts # Input validation
│   │   ├── errorMiddleware.ts     # Error handling
│   │   └── rateLimitMiddleware.ts # Rate limiting
│   ├── utils/               # Helper functions
│   │   ├── jwt.ts
│   │   ├── bcrypt.ts
│   │   ├── validation.ts
│   │   ├── logger.ts
│   │   └── database.ts
│   ├── routes/              # API route definitions
│   │   ├── authRoutes.ts
│   │   ├── projectRoutes.ts
│   │   ├── taskRoutes.ts
│   │   ├── userRoutes.ts
│   │   ├── dashboardRoutes.ts
│   │   ├── deadlineRoutes.ts
│   │   └── timeTrackingRoutes.ts
│   ├── types/               # TypeScript type definitions
│   │   ├── user.types.ts
│   │   ├── project.types.ts
│   │   ├── task.types.ts
│   │   └── api.types.ts
│   ├── config/              # Configuration files
│   │   ├── database.ts
│   │   ├── jwt.ts
│   │   └── server.ts
│   └── app.ts               # Express app setup
│   └── server.ts            # Server entry point
├── tests/
│   ├── unit/                # Unit tests (services, utilities)
│   ├── integration/         # Integration tests (API endpoints)
│   └── setup.ts             # Test configuration
├── Dockerfile               # Backend container definition
├── package.json
├── tsconfig.json
└── .env.example

frontend/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── projects/
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── ProjectList.tsx
│   │   │   └── ProjectForm.tsx
│   │   ├── tasks/
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskForm.tsx
│   │   │   ├── SubTaskList.tsx
│   │   │   └── TaskStatusBadge.tsx
│   │   ├── dashboard/
│   │   │   ├── MasterDashboard.tsx
│   │   │   ├── UserDashboard.tsx
│   │   │   ├── CalendarView.tsx
│   │   │   └── UpcomingTasksPanel.tsx
│   │   ├── shared/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── Notification.tsx
│   │   └── time-tracking/
│   │       ├── TimeEntryForm.tsx
│   │       └── TimeLogList.tsx
│   ├── pages/               # Route-level page components
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ProjectDetailPage.tsx
│   │   ├── TaskDetailPage.tsx
│   │   ├── UserProfilePage.tsx
│   │   └── NotFoundPage.tsx
│   ├── services/            # API client and utilities
│   │   ├── api.ts           # Axios instance with interceptors
│   │   ├── authService.ts
│   │   ├── projectService.ts
│   │   ├── taskService.ts
│   │   ├── deadlineService.ts
│   │   └── timeTrackingService.ts
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useProjects.ts
│   │   ├── useTasks.ts
│   │   └── useNotifications.ts
│   ├── contexts/            # React Context providers
│   │   ├── AuthContext.tsx
│   │   └── NotificationContext.tsx
│   ├── types/               # TypeScript interfaces
│   │   ├── user.types.ts
│   │   ├── project.types.ts
│   │   └── task.types.ts
│   ├── utils/               # Helper functions
│   │   ├── dateFormatter.ts
│   │   ├── validation.ts
│   │   └── constants.ts
│   ├── styles/              # Global styles (if using CSS/SCSS)
│   │   └── global.css
│   ├── App.tsx              # Root component
│   ├── index.tsx            # Entry point
│   └── routes.tsx           # Route definitions
├── public/
│   ├── index.html
│   └── assets/
├── tests/
│   └── components/          # Component tests
├── Dockerfile               # Multi-stage frontend build
├── package.json
├── tsconfig.json
└── .env.example

database/
├── init.sql                 # Initial schema (already created)
└── migrations/              # Future schema migrations
    └── .gitkeep

nginx/
├── nginx.conf               # Reverse proxy config (already created)
└── ssl/                     # SSL certificates (already created)
    └── README.md

.specify/                    # Governance and templates (already exists)
docker-compose.yml           # Service orchestration (already created)
.env.example                 # Environment variables template (already created)
.gitignore                   # Git ignore rules (already created)
README.md                    # Project documentation (already created)
```

**Structure Decision**: Web application structure (Option 2) selected. This feature requires both a backend REST API and frontend SPA, necessitating separated `backend/` and `frontend/` directories. The backend follows a layered architecture (models/services/controllers/middleware) for clear separation of concerns. The frontend uses component-based architecture with React, organized by feature (auth, projects, tasks, dashboard) and shared components. Database initialization scripts in `database/` directory, Nginx configuration in `nginx/`, and Docker orchestration at root level. This structure aligns with the constitution's modularity principles and supports independent development/testing of backend and frontend.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | Full compliance with all constitution principles | N/A - No constitution violations |

---

## Phase 0: Research (Technology Decisions)

**Status**: ✅ **COMPLETE**  
**Deliverable**: `research.md` in this directory  
**Completion Date**: 2025-11-04

### Summary

Completed comprehensive technology research covering:

1. **Authentication Strategy**: JWT with HttpOnly cookies selected over session-based auth for statelessness and scalability
2. **Backend Framework**: Node.js + Express + TypeScript chosen over NestJS for lower memory footprint (critical for 1GB RAM constraint)
3. **Frontend UI Library**: Material-UI recommended for rapid development; Tailwind alternative for smaller bundle size
4. **Database Optimization**: PostgreSQL 16 Alpine with tuned configuration (128MB shared_buffers, 20 max connections)
5. **Calendar Implementation**: react-calendar + date-fns (50KB) selected over FullCalendar (200KB+) for bundle size
6. **Real-time Notifications**: Server-Sent Events (SSE) chosen over WebSockets for lower overhead
7. **Docker Optimization**: Multi-stage Alpine builds, layer caching, health checks implemented
8. **Alert System**: node-cron for scheduled deadline checks (every 15 minutes)
9. **Security Practices**: bcrypt (cost 10-12), rate limiting, input validation, RBAC enforcement
10. **Logging Strategy**: Winston with daily rotation, 7-day retention, structured JSON logs
11. **Testing Approach**: Jest + Supertest (backend), Jest + React Testing Library (frontend)
12. **Deployment Process**: Docker Compose with health checks, automated backups, monitoring

**Key Decisions Documented**: See `research.md` for full rationale and alternatives considered.

---

## Phase 1: Design (Data Model & API Contracts)

**Status**: ✅ **COMPLETE**  
**Deliverables**: 
- `data-model.md` - Database schema and entity definitions
- `contracts/api-endpoints.md` - REST API endpoint specifications
- `contracts/openapi.yaml` - OpenAPI 3.0 specification
- `quickstart.md` - Development setup guide
**Completion Date**: 2025-11-04

### Phase 1.1: Data Model (`data-model.md`)

**Entities Defined** (10 total):

1. **User**: Authentication and user profile (email, password_hash, role, is_active)
2. **Project**: Project container (name, description, status, dates, created_by)
3. **Task**: Work item with hierarchy (title, status, priority, dates, hours, parent_task_id)
4. **TaskAssignment**: User-to-task M:M relationship
5. **ProjectAssignment**: User-to-project M:M relationship
6. **DeadlineRequest**: Deadline extension workflow (requested/current deadline, reason, status, review)
7. **TimeEntry**: Work log tracking (task_id, user_id, hours_worked, work_date, description)
8. **Notification**: User alerts (type, message, related entities, is_read, is_email_sent)
9. **RefreshToken**: JWT refresh token management (token_hash, expires_at, is_revoked)
10. **AuditLog**: Action tracking (user_id, action, entity_type, old/new values, ip_address)

**Relationships**:
- User → Projects (1:M creator)
- User ↔ Projects (M:M assignments via project_assignments)
- Project → Tasks (1:M)
- Task → Task (1:M parent-child hierarchy)
- User ↔ Tasks (M:M assignments via task_assignments)
- Task → DeadlineRequests (1:M)
- Task → TimeEntries (1:M)
- User → Notifications (1:M)
- User → RefreshTokens (1:M)
- User → AuditLogs (1:M)

**Indexes Created**:
- All primary keys (UUID)
- All foreign keys
- Unique constraints (email, task/project assignments)
- Query optimization indexes (status, dates, user_id)

**Database Views**:
- `task_details`: Pre-joined view of tasks with projects, assignments, time entries
- `user_workload`: Aggregated view of user's active/completed tasks and hours

**Storage Estimates**:
- Year 1: 50-150MB
- Year 3: 500MB-1GB (with archival strategy)

### Phase 1.2: API Contracts (`contracts/`)

**API Documentation Created**:

1. **`api-endpoints.md`**: Human-readable REST API specification
   - 32 REST endpoints documented
   - Request/response schemas with examples
   - Authentication and authorization requirements
   - Query parameters and validation rules
   - Error codes and handling
   - Rate limiting policies

2. **`openapi.yaml`**: Machine-readable OpenAPI 3.0 specification
   - Complete schemas for all entities
   - Request/response validation
   - Security schemes (Bearer + Cookie auth)
   - Reusable components and references
   - Error response templates
   - Can be imported into Postman, Swagger UI, code generators

**Endpoint Categories** (32 total):

- **Authentication** (5 endpoints): register, login, logout, refresh, me
- **Projects** (7 endpoints): CRUD, list, assign/unassign users
- **Tasks** (7 endpoints): CRUD, list, status update, assign users
- **Dashboard** (2 endpoints): Master (project cards), User (calendar)
- **Deadline Requests** (4 endpoints): Create, list, approve, deny
- **Time Tracking** (3 endpoints): Create, list, delete entries
- **Notifications** (3 endpoints): List, mark read, mark all read
- **Health** (1 endpoint): Service health check

**Authentication & Authorization**:
- JWT access tokens (15min) in HttpOnly cookies or Bearer header
- Refresh tokens (7 days) for token renewal
- Role-based authorization (Master/User) enforced on all endpoints
- Rate limiting: 5 login attempts / 15 min, 100 API requests / 15 min

**API Versioning**: All endpoints prefixed with `/api/v1`

### Phase 1.3: Quick Start Guide (`quickstart.md`)

**Setup Documentation Sections**:

1. **Prerequisites**: Docker, Node.js, PostgreSQL version requirements
2. **Local Development Setup**: Step-by-step with Docker Compose
3. **Docker Deployment**: Container management commands
4. **VPS Deployment**: Production deployment on 1GB RAM Ubuntu/Debian VPS
5. **Environment Variables**: Complete .env configuration reference
6. **Database Management**: Backup, restore, migrations, queries
7. **Testing**: Backend, frontend, API, load testing instructions
8. **Troubleshooting**: Common issues and solutions

**Quick Start Commands**:
```powershell
# Clone and setup
git clone https://github.com/yourusername/TasksWeb.git
cd TasksWeb
Copy-Item .env.example .env

# Start with Docker Compose
docker compose up -d --build

# Access application
# Frontend: http://localhost
# API: http://localhost/api/v1
# API Docs: http://localhost/api/docs
```

**VPS Deployment Covered**:
- Docker installation on Ubuntu 22.04/Debian 12
- SSL certificate setup with Let's Encrypt
- Firewall configuration (ufw)
- Automatic startup with systemd
- Automated backup script with cron

**Troubleshooting Guides**:
- Port conflicts
- Database connection issues
- Out of memory errors
- SSL certificate problems
- CORS errors
- Debug mode activation
- Log locations and analysis

---

## Phase 1: Constitution Check Re-evaluation

*Re-check after completing Phase 1 design deliverables*

**Verify compliance with TasksWeb Constitution principles**:

- [x] **Security-First**: JWT auth with HttpOnly cookies, bcrypt (cost 12), rate limiting (5 login/15min), RBAC on all endpoints, input validation with Joi/Yup, HTTPS via Nginx
- [x] **Resource-Constrained**: Total memory allocation 750MB (Backend 300MB, DB 300MB, Nginx 100MB, Frontend 50MB), Alpine images, PostgreSQL optimized (128MB shared_buffers, 20 connections max), frontend bundle <2MB
- [x] **RBAC Enforcement**: Master-only endpoints documented (project/task CRUD), User-only endpoints documented (task status updates, time logging), authorization checks in API contracts
- [x] **API-First Design**: 32 REST endpoints with `/api/v1` versioning, OpenAPI 3.0 spec for code generation, comprehensive error codes, pagination on all lists (max 50 items)
- [x] **Docker-Native**: docker-compose.yml orchestration, health checks on all services, Alpine-based images, multi-stage frontend build, service dependencies configured
- [x] **Input Validation**: Dual-layer validation documented (Joi backend, Yup frontend), field-level validation rules in data model (email format, password strength, enum values, numeric ranges), error details array in API responses
- [x] **Observability**: Winston logging with daily rotation (7-day retention), health check endpoint (`/health`), audit_log table for action tracking, notification system for business alerts (deadline warnings)

**Complexity Justification**: 
✅ **No violations** - All constitution principles satisfied. Feature design aligns with security requirements, resource constraints, RBAC enforcement, API-first architecture, Docker deployment, input validation, and observability standards.

**Design Risks Identified**: None blocking - All risks mitigated through research decisions and documented in constitution-compliant manner.

---

## Phase 2: Task Generation (Separate Command)

**Status**: ⏸️ **PENDING**  
**Action Required**: Run `/speckit.tasks` command to generate `tasks.md`  
**Command**: `/speckit.tasks`

**Note**: Task breakdown is created via a separate command after Phase 0 Research and Phase 1 Design are complete. The `/speckit.tasks` command will generate:

- **`tasks.md`**: Granular task breakdown with:
  - Phase 0: Repository setup, Docker environment, environment variables
  - Phase 1: Database initialization, backend foundation, authentication, RBAC
  - Phase 2: Project management, task management, user assignments
  - Phase 3: Dashboard views, deadline management, alerts, time tracking
  - Phase 4: Notifications, testing, deployment, documentation
  - Phase 5: Optimization, monitoring, security hardening

**Why Separate?**: The task generation command requires analyzing the completed research.md, data-model.md, and contracts/ to create implementation tasks with proper dependencies, estimation, and assignment recommendations. This separation prevents premature task breakdown before design is finalized.

**Next Step**: After reviewing this plan.md and all Phase 1 deliverables, run `/speckit.tasks` to generate the granular task breakdown for implementation.

---

## Agent Context Update

**Status**: ⏸️ **PENDING**  
**Action Required**: Run agent context update script after Phase 1 completion

After completing Phase 1, update the agent context file to include new technologies, patterns, and decisions:

```powershell
# Update Copilot agent context
.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot
```

**Technologies to Add**:
- Node.js 20 + Express 4 + TypeScript 5
- React 18 + Material-UI 5 / Tailwind CSS 3
- PostgreSQL 16 (Alpine) with optimization config
- JWT authentication (jsonwebtoken, bcrypt)
- Docker Compose orchestration
- Nginx reverse proxy
- Winston logging
- Joi/Yup validation
- react-calendar + date-fns
- Server-Sent Events (SSE)
- Jest + Supertest + React Testing Library

**Patterns to Document**:
- JWT with HttpOnly cookies
- Layered backend architecture (models/services/controllers)
- React component structure (feature-based + shared)
- RBAC middleware enforcement
- Dual input validation (frontend + backend)
- Alpine multi-stage Docker builds
- Health check patterns
- Error envelope structure

---

## Summary

✅ **Phase 0 Complete**: Technology research decisions documented in `research.md`  
✅ **Phase 1 Complete**: Data model, API contracts, and quickstart guide created  
✅ **Constitution Check**: All principles satisfied, no violations  
⏸️ **Phase 2 Pending**: Run `/speckit.tasks` command to generate implementation tasks  
⏸️ **Agent Context Pending**: Run update script after Phase 1 review

**Total Deliverables Created**:
1. ✅ `research.md` (12 technology decisions with rationales)
2. ✅ `data-model.md` (10 entities, relationships, indexes, views, storage estimates)
3. ✅ `contracts/api-endpoints.md` (32 REST endpoints with full documentation)
4. ✅ `contracts/openapi.yaml` (OpenAPI 3.0 machine-readable specification)
5. ✅ `quickstart.md` (Development setup, Docker deployment, VPS deployment, troubleshooting)

**Ready for Implementation**: All design artifacts complete. Next step is to run `/speckit.tasks` to generate granular implementation tasks.
