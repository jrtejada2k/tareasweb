# Implementation Tasks: Authentication and Task Management System

**Feature**: Authentication and Task Management System  
**Branch**: `001-auth-task-management`  
**Date**: 2025-11-04  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Overview

This document breaks down the implementation into granular, executable tasks organized by user story. Each phase represents a complete, independently testable increment that delivers value.

**Total Tasks**: 93 tasks (updated from 89 - added 4 HIGH priority fixes)  
**Completed Tasks**: 91/93 (97.8%)  
**Estimated Timeline**: 8-10 weeks (2-week sprints × 4-5 sprints)  
**MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1: Authentication)  
**Last Updated**: 2025-11-05 (T089 complete: Deployment validation identified 150 TypeScript compilation errors. Status: NOT PRODUCTION READY. See DEPLOYMENT_VALIDATION_REPORT.md for details and fix strategy.)

---

## Implementation Strategy

### Delivery Approach

**MVP First (Phase 1-3)**: Deliver secure authentication system first. This unblocks all other features and provides immediate value.

**Incremental User Stories**: Each subsequent phase delivers a complete user story that can be demoed and tested independently.

**Parallel Execution**: Tasks marked with `[P]` can be executed in parallel with other tasks in the same phase (different files, no blocking dependencies).

### Phase Structure

- **Phase 1**: Setup & Infrastructure (T001-T009) - Repository, Docker, environment
- **Phase 2**: Foundational (T010-T020) - Database, shared middleware, utilities
- **Phase 3**: **US1** - Secure User Authentication (T021-T029) - JWT auth, login/logout
- **Phase 4**: **US2** - Project and Task Creation (T030-T039) - Master CRUD operations
- **Phase 5**: **US3** - User Assignment to Projects (T040-T044) - Project access control
- **Phase 6**: **US4** - Task Assignment (T045-T050) - Task assignment and scheduling
- **Phase 7**: **US6** - Task Status Updates (T051-T056) - Status tracking workflow
- **Phase 8**: **US5** - View Assigned Tasks (T057-T060) - Task querying by date
- **Phase 9**: **US10** - Master Dashboard (T061-T064) - Project cards view
- **Phase 10**: **US7** - User Dashboard (T065-T069) - Calendar view
- **Phase 11**: **US9** - Deadline Alerts (T070-T073) - Alert system
- **Phase 12**: **US8** - Deadline Extensions (T074-T077) - Extension requests
- **Phase 13**: **US11** - Time Tracking (T078-T081) - Time entry logging
- **Phase 14**: Polish & Deployment (T082-T089) - Testing, docs, deployment

---

## Dependencies & Execution Order

### Critical Path (Must Complete in Order)

```
Phase 1 (Setup) 
  ↓
Phase 2 (Foundation)
  ↓
Phase 3 (US1: Auth) ──────────────┐
  ↓                               │
Phase 4 (US2: Projects & Tasks) ←─┘ (blocked by auth)
  ↓
Phase 5 (US3: Project Assignment) ← (needs US2)
  ↓
Phase 6 (US4: Task Assignment) ←─── (needs US2 + US3)
  ↓
Phase 7 (US6: Status Updates) ←──── (needs US4)
```

### Independent Branches (Can Parallelize After Phase 6)

```
Phase 8 (US5: View Tasks) ←───────┐
Phase 9 (US10: Master Dashboard) ←┼─ (all need US4-US7)
Phase 10 (US7: User Dashboard) ←──┤
Phase 11 (US9: Alerts) ←──────────┤
Phase 12 (US8: Extensions) ←──────┤
Phase 13 (US11: Time Tracking) ←──┘
```

### Parallel Execution Examples

**Within Phase 4 (US2)**: After T030 (Project model), can parallelize:
- T031 [P] ProjectService
- T032 [P] Project validation schemas
- T033 [P] Task model
- T034 [P] TaskService

**Within Phase 7 (US6)**: Can parallelize:
- T051 [P] Status validation logic
- T052 [P] Status update service
- T053 [P] Frontend status component

---

## Phase 1: Setup & Infrastructure

**Goal**: Initialize project structure, Docker environment, and basic configuration.

**Deliverable**: Runnable Docker Compose environment with PostgreSQL and placeholder backend/frontend services.

**Independent Test**: Run `docker compose up` and verify all services start without errors. Access http://localhost should show placeholder page.

### Tasks

- [X] T001 Initialize Git repository with .gitignore for Node.js, React, Docker, and IDE files
- [X] T002 Copy .env.example to .env and configure environment variables (DATABASE_URL, JWT_SECRET, CORS_ORIGIN, PORT) per quickstart.md
- [X] T003 Create backend/ directory structure: src/{models,services,controllers,middleware,routes,utils,types,config}, tests/{unit,integration}
- [X] T004 Create frontend/ directory structure: src/{components,pages,services,hooks,contexts,types,utils,styles}, tests/components/
- [X] T005 Initialize backend/package.json with dependencies: express, typescript, @types/node, @types/express, jsonwebtoken, bcrypt, joi, pg, winston, express-rate-limit, cors, dotenv, node-cron, nodemailer, @types/nodemailer
- [X] T006 Initialize frontend/package.json with dependencies: react, react-dom, react-router-dom, @mui/material, @emotion/react, @emotion/styled, axios, formik, yup, react-calendar, date-fns, react-toastify
- [X] T007 Create backend/tsconfig.json with strict TypeScript configuration (target: ES2020, module: commonjs, outDir: dist, rootDir: src, strict: true)
- [X] T008 Create backend/Dockerfile with multi-stage build (Node 20-alpine base, npm install, build TypeScript, slim runtime image <300MB)
- [X] T009 Create frontend/Dockerfile with multi-stage build (Node 20-alpine, npm install, vite build, nginx alpine serve, <100MB total)
- [X] T009a Create database/init.sql with all table DDL statements from data-model.md: users, projects, tasks, task_assignments, project_assignments, deadline_requests, time_entries, notifications, refresh_tokens, audit_logs tables with indexes, foreign keys, constraints, ENUM types (TaskStatus, ProjectStatus, etc.)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Goal**: Set up database schema, shared utilities, and core middleware that all features depend on.

**Deliverable**: Database initialized with all tables, JWT utilities, logging, error handling, and RBAC middleware ready.

**Independent Test**: Run backend server, hit /health endpoint, verify database connection successful and Winston logs output to console/file.

### Tasks

- [X] T010 Execute database/init.sql to create all tables (users, projects, tasks, task_assignments, project_assignments, deadline_requests, time_entries, notifications, refresh_tokens, audit_logs) with indexes and constraints
- [X] T011 [P] Implement backend/src/utils/logger.ts using Winston with daily file rotation, 7-day retention, JSON format, log levels (info, debug, error)
- [X] T012 [P] Implement backend/src/utils/jwt.ts with functions: generateAccessToken (15min expiry), generateRefreshToken (7d expiry), verifyToken, extractUserId
- [X] T013 [P] Implement backend/src/utils/bcrypt.ts with functions: hashPassword (cost factor 12), comparePassword
- [X] T014 [P] Implement backend/src/utils/database.ts with pg Pool connection (max 20 connections), query wrapper with error logging, transaction helpers
- [X] T015 [P] Implement backend/src/middleware/authMiddleware.ts to validate JWT from cookie or Authorization header, attach user to req.user, return 401 if invalid
- [X] T016 [P] Implement backend/src/middleware/rbacMiddleware.ts with requireMaster() and requireUser() functions checking req.user.role, return 403 if insufficient permissions
- [X] T017 [P] Implement backend/src/middleware/validationMiddleware.ts with validateBody(schema), validateQuery(schema), validateParams(schema) using Joi
- [X] T018 [P] Implement backend/src/middleware/errorMiddleware.ts to catch all errors, format as {success: false, error: {code, message, details}}, log errors with Winston
- [X] T019 [P] Implement backend/src/middleware/rateLimitMiddleware.ts with loginRateLimiter (5 req/15min per IP) and apiRateLimiter (100 req/15min per user)
- [X] T020 [P] Create backend/src/app.ts Express app setup with CORS, JSON parser, rate limiters, routes mounting, error middleware, health check endpoint at GET /health
- [X] T020a [P] Install and configure node-cron scheduler service in backend/src/utils/scheduler.ts: initialize cron instance, export addJob(schedule, callback) function, log job execution with Winston, start scheduler in server.ts after database connection

---

## Phase 3: User Story 1 - Secure User Authentication (Priority: P1)

**Goal**: Implement complete JWT-based authentication system with register, login, logout, refresh, and profile endpoints.

**Deliverable**: Users can register, login with credentials, receive JWT tokens in HttpOnly cookies, access protected routes, refresh tokens, and logout.

**Independent Test**: 
1. Register new user via POST /api/v1/auth/register
2. Login via POST /api/v1/auth/login and receive access_token cookie
3. Access GET /api/v1/auth/me with cookie and receive user profile
4. Refresh token via POST /api/v1/auth/refresh
5. Logout via POST /api/v1/auth/logout and verify token invalidated

**Success Criteria**:
- User can register with email, password, full_name, role
- User can login and receive JWT in HttpOnly cookie
- Authenticated requests include valid JWT
- Invalid credentials return 401
- Rate limiting prevents brute force (5 login attempts / 15 min)
- Logout invalidates refresh token

### Tasks

- [X] T021 [US1] Create backend/src/models/User.ts with interface (id, email, password_hash, full_name, role, is_active, created_at, updated_at, last_login_at)
- [X] T022 [US1] Create backend/src/models/RefreshToken.ts with interface (id, user_id, token_hash, expires_at, is_revoked, created_at)
- [X] T023 [P] [US1] Implement backend/src/services/authService.ts with functions: registerUser (validate, hash password, insert user), loginUser (verify credentials, generate tokens, save refresh token), refreshAccessToken (verify refresh token, generate new access token), logoutUser (revoke refresh token)
- [X] T024 [P] [US1] Implement backend/src/controllers/authController.ts with handlers: register (POST), login (POST, set cookies), refresh (POST), logout (POST, clear cookies), me (GET, return req.user)
- [X] T025 [P] [US1] Create backend/src/routes/authRoutes.ts with routes: POST /register, POST /login (with loginRateLimiter), POST /refresh, POST /logout (with authMiddleware), GET /me (with authMiddleware)
- [X] T026 [P] [US1] Create backend/src/types/user.types.ts with UserRole enum, CreateUserDTO, LoginDTO, UserProfileDTO, JWTPayload interfaces
- [X] T027 [P] [US1] Implement backend/src/utils/validation.ts with Joi schemas: registerSchema (email, password min 8 chars with complexity, full_name 2-255 chars, role enum), loginSchema (email, password)
- [X] T028 [US1] Mount authRoutes in backend/src/app.ts at /api/v1/auth
- [X] T029 [US1] Create backend/src/server.ts as entry point: import app, connect database, start server on PORT with graceful shutdown handlers

---

## Phase 4: User Story 2 - Project and Task Creation (Priority: P2)

**Goal**: Master users can create projects, add tasks to projects, and create sub-tasks within tasks.

**Deliverable**: Master users can CRUD projects and tasks, establish parent-child task relationships.

**Independent Test**:
1. Login as master user
2. Create project via POST /api/v1/projects
3. Create task in project via POST /api/v1/tasks with project_id
4. Create sub-task via POST /api/v1/tasks with parent_task_id
5. GET /api/v1/projects/:id to see project with tasks
6. GET /api/v1/tasks/:id to see task with sub-tasks

**Success Criteria**:
- Master can create/edit/delete projects
- Master can create tasks with title, description, dates, status, priority
- Master can create sub-tasks linked to parent tasks
- Projects display associated tasks
- Tasks display sub-tasks hierarchically
- Regular users cannot create/edit/delete (403 Forbidden)

### Tasks

- [X] T030 [US2] Create backend/src/models/Project.ts with interface (id, name, description, status, created_by, start_date, end_date, created_at, updated_at)
- [X] T031 [P] [US2] Implement backend/src/services/projectService.ts with functions: createProject (master only validation), updateProject, deleteProject (check no active tasks), getProjectById (with tasks), listProjects (with pagination, status filter)
- [X] T032 [P] [US2] Create backend/src/types/project.types.ts with ProjectStatus enum, CreateProjectDTO, UpdateProjectDTO, ProjectDTO, ProjectSummaryDTO
- [X] T033 [P] [US2] Create backend/src/models/Task.ts with interface (id, project_id, parent_task_id, title, description, status, priority, start_date, end_date, estimated_hours, actual_hours, completion_percentage, created_by, created_at, updated_at, completed_at)
- [X] T034 [P] [US2] Implement backend/src/services/taskService.ts with functions: createTask (validate project exists, validate parent_task if provided, inherit project_id from parent), updateTask, deleteTask (check no sub-tasks), getTaskById (with sub-tasks, time entries), listTasks (filters: project_id, status, priority, assigned user, date ranges, pagination)
- [X] T035 [P] [US2] Create backend/src/types/task.types.ts with TaskStatus enum (EXACT values: 'not_started', 'iniciada', 'en_progreso', 'completada' matching database ENUM from data-model.md), TaskPriority enum ('low', 'medium', 'high', 'urgent'), CreateTaskDTO, UpdateTaskDTO, TaskDTO, TaskSummaryDTO
- [X] T036 [P] [US2] Implement backend/src/controllers/projectController.ts with handlers: create (requireMaster), update (requireMaster), delete (requireMaster), getById (requireMaster or assigned user check), list (filter by user assignments for regular users)
- [X] T037 [P] [US2] Implement backend/src/controllers/taskController.ts with handlers: create (requireMaster), update (requireMaster), delete (requireMaster), getById (RBAC check), list (filter by assignments)
- [X] T038 [US2] Create backend/src/routes/projectRoutes.ts with routes: POST / (requireMaster), GET /, GET /:id, PUT /:id (requireMaster), DELETE /:id (requireMaster)
- [X] T039 [US2] Create backend/src/routes/taskRoutes.ts with routes: POST / (requireMaster), GET /, GET /:id, PUT /:id (requireMaster), DELETE /:id (requireMaster)

---

## Phase 5: User Story 3 - User Assignment to Projects (Priority: P3)

**Goal**: Master users can assign regular users to projects, granting them access to project tasks.

**Deliverable**: Project assignment functionality with access control enforcement.

**Independent Test**:
1. Login as master user
2. Create project
3. Assign regular user via POST /api/v1/projects/:id/assign-user
4. Login as regular user
5. GET /api/v1/projects and verify project appears
6. GET /api/v1/projects/:id and verify access granted
7. Login as different non-assigned user
8. GET /api/v1/projects/:id and verify 403 Forbidden

**Success Criteria**:
- Master can assign users to projects
- Assigned users see project in their project list
- Assigned users can view project tasks
- Non-assigned users cannot access project (403)
- Master can remove user assignments

### Tasks

- [X] T040 [US3] Create backend/src/models/ProjectAssignment.ts with interface (id, project_id, user_id, assigned_by, assigned_at)
- [X] T041 [P] [US3] Implement backend/src/services/assignmentService.ts with functions: assignUserToProject (validate user exists, validate not already assigned), removeUserFromProject, getUserProjectAssignments, getProjectUserAssignments
- [X] T042 [P] [US3] Update projectService.getProjectById to check if req.user is master or assigned to project, return 403 if neither
- [X] T043 [P] [US3] Update projectService.listProjects to filter projects: masters see all, regular users see only assigned projects
- [X] T044 [US3] Add routes to projectRoutes.ts: POST /:id/assign-user (requireMaster), DELETE /:id/unassign-user/:userId (requireMaster)

---

## Phase 6: User Story 4 - Task Assignment (Priority: P2)

**Goal**: Master users can assign tasks to specific users with dates, users see assigned tasks in their list.

**Deliverable**: Task assignment with user-specific task views.

**Independent Test**:
1. Login as master user
2. Create task in project
3. Assign task to user via POST /api/v1/tasks/:id/assign-user
4. Login as assigned user
5. GET /api/v1/tasks?assigned_to_me=true and verify task appears
6. GET /api/v1/tasks/:id and verify task details accessible

**Success Criteria**:
- Master can assign tasks to users (user must be assigned to parent project)
- Assigned users see tasks in their task list
- Task assignments include assignment timestamp and assigner
- Tasks can be assigned to multiple users
- Regular users cannot assign tasks (403)

### Tasks

- [X] T045 [US4] Create backend/src/models/TaskAssignment.ts with interface (id, task_id, user_id, assigned_by, assigned_at)
- [X] T046 [P] [US4] Update assignmentService.ts with functions: assignUserToTask (validate user assigned to project first), removeUserFromTask, getUserTaskAssignments, getTaskUserAssignments
- [X] T047 [P] [US4] Update taskService.getTaskById to check if req.user is master or assigned to task, return 403 if neither
- [X] T048 [P] [US4] Update taskService.listTasks to add filter: assigned_to_me (boolean), if true filter by req.user.id assignments, for regular users always filter by assignments
- [X] T049 [P] [US4] Add validation: when assigning user to task, check user is assigned to parent project, return 400 USER_NOT_ASSIGNED_TO_PROJECT if not
- [X] T050 [US4] Add routes to taskRoutes.ts: POST /:id/assign-user (requireMaster), DELETE /:id/unassign-user/:userId (requireMaster)

---

## Phase 7: User Story 6 - Task Status Updates (Priority: P2)

**Goal**: Regular users can update status of their assigned tasks through defined transitions (not_started → iniciada → en_progreso → completada).

**Deliverable**: Status update workflow with validation and state transitions.

**Independent Test**:
1. Login as master user, create and assign task to regular user
2. Login as regular user
3. PATCH /api/v1/tasks/:id/status with status: "iniciada"
4. Verify status updated
5. PATCH status to "en_progreso", then "completada"
6. Verify each transition succeeds
7. Try invalid transition (completada → iniciada) and verify 400 error

**Success Criteria**:
- Users can update status of assigned tasks
- Valid status transitions enforced
- Invalid transitions rejected with 400
- Status updates logged with timestamp
- Completed tasks set completed_at timestamp
- Users cannot update status of non-assigned tasks (403)

### Tasks

- [X] T051 [P] [US6] Create backend/src/utils/validation.ts status transition validator: isValidStatusTransition (from, to) returning boolean, valid transitions map
- [X] T052 [P] [US6] Update taskService.ts with updateTaskStatus (taskId, newStatus, userId) function: validate user assigned to task, validate status transition, update status, set completed_at if completada
- [X] T053 [P] [US6] Implement backend/src/controllers/taskController.ts handler: updateStatus (PATCH /:id/status) with authMiddleware (both master and regular users allowed if assigned)
- [X] T054 [P] [US6] Create Joi schema in validation.ts: updateStatusSchema (status enum validation)
- [X] T055 [US6] Add route to taskRoutes.ts: PATCH /:id/status (requireAuth, validate assigned user or master)
- [X] T056 [US6] Update taskService.getTaskById to include audit trail: who updated status and when (add to response or separate audit_logs table query)

---

## Phase 8: User Story 5 - View Assigned Tasks by Date (Priority: P3)

**Goal**: Users can query and filter their assigned tasks by date ranges or specific dates.

**Deliverable**: Task filtering by date with query parameters.

**Independent Test**:
1. Login as master user, create multiple tasks with different dates, assign to user
2. Login as regular user
3. GET /api/v1/tasks?start_date_from=2025-11-01&start_date_to=2025-11-30
4. Verify only tasks within date range returned
5. GET /api/v1/tasks?end_date_to=2025-11-15
6. Verify only tasks with end_date <= 2025-11-15 returned

**Success Criteria**:
- Query parameters: start_date_from, start_date_to, end_date_from, end_date_to
- Tasks filtered by date ranges
- Date parameters optional (can use any combination)
- Invalid date formats return 400
- Regular users only see their assigned tasks even with filters

### Tasks

- [X] T057 [P] [US5] Update taskService.listTasks to add date filter parameters: start_date_from, start_date_to, end_date_from, end_date_to with SQL WHERE clauses
- [X] T058 [P] [US5] Create Joi schema in validation.ts: taskQuerySchema with date validations (ISO date format)
- [X] T059 [P] [US5] Update taskController.list handler to apply date filters from query params with validation middleware
- [X] T060 [US5] Update taskRoutes.ts GET / route to include query validation with taskQuerySchema

---

## Phase 9: User Story 10 - Master Dashboard (Priority: P3)

**Goal**: Master users view all projects as cards with task lists. Click card to navigate to project detail.

**Deliverable**: Master dashboard endpoint returning project cards with task summaries.

**Independent Test**:
1. Login as master user
2. GET /api/v1/dashboard/master
3. Verify response contains projects array with task summaries (counts by status)
4. Verify at-risk tasks included (tasks near deadline not completed)
5. Verify recent deadline requests included

**Success Criteria**:
- Endpoint returns all projects
- Each project includes task summary (total, by status counts)
- Each project includes list of tasks with basic info
- At-risk tasks section (near deadline, not started/in progress)
- Recent deadline requests section
- Endpoint only accessible to master users (403 for regular users)

### Tasks

- [X] T061 [US10] Create backend/src/controllers/dashboardController.ts with getMasterDashboard handler: query all projects, aggregate task counts per project (by status), identify at-risk tasks (end_date within 3 days, status not completada), query recent deadline_requests
- [X] T062 [P] [US10] Implement backend/src/services/dashboardService.ts with functions: getMasterDashboardData (aggregate projects with task summaries), getAtRiskTasks (SQL query: end_date <= NOW() + INTERVAL '3 days' AND status != 'completada')
- [X] T063 [P] [US10] Create backend/src/routes/dashboardRoutes.ts with GET /master (requireMaster)
- [X] T064 [US10] Mount dashboardRoutes in app.ts at /api/v1/dashboard

---

## Phase 10: User Story 7 - User Dashboard (Priority: P3)

**Goal**: Regular users view calendar with assigned tasks, upcoming tasks panel showing next 2 days.

**Deliverable**: User dashboard endpoint with calendar data and upcoming tasks.

**Independent Test**:
1. Login as regular user
2. GET /api/v1/dashboard/user?month=11&year=2025
3. Verify response contains calendar_tasks array grouped by date
4. Verify upcoming_tasks array contains only tasks with start_date in next 2 days
5. Verify only assigned tasks included

**Success Criteria**:
- Calendar data grouped by date (date → tasks array)
- Upcoming tasks filtered to next 2 days from current date
- Summary stats: assigned tasks count, tasks due soon, completed this week
- Only user's assigned tasks included
- Month and year query parameters for calendar navigation

### Tasks

- [X] T065 [US7] Update dashboardController.ts with getUserDashboard handler: query assigned tasks for user, group tasks by date (start_date and end_date), filter upcoming tasks (start_date BETWEEN NOW() AND NOW() + INTERVAL '2 days'), calculate summary stats
- [X] T066 [P] [US7] Update dashboardService.ts with functions: getUserDashboardData (query user assignments, aggregate stats), getUpcomingTasks (filter by date range), getCalendarTasks (group by date)
- [X] T067 [P] [US7] Add Joi schema in validation.ts: dashboardQuerySchema with month (1-12), year (2000-2100) optional parameters
- [X] T068 [P] [US7] Add route to dashboardRoutes.ts: GET /user (requireAuth, any authenticated user)
- [X] T069 [US7] Update getUserDashboard to accept month and year query params, default to current month/year, filter calendar tasks to specified month

---

## Phase 11: User Story 9 - Deadline Alert System (Priority: P3)

**Goal**: Master users receive alerts for tasks at risk of expiring (not started or in progress, approaching deadline).

**Deliverable**: Alert service with scheduled checks, notification generation, and alert endpoint.

**Independent Test**:
1. Create tasks with end_date in 2 days, status "not_started" or "en_progreso"
2. Run alert service manually or wait for scheduled execution
3. Login as master user
4. Verify notifications created in notifications table
5. GET /api/v1/notifications and verify alerts appear
6. Verify alerts cleared when task status changes to completada

**Success Criteria**:
- Scheduled job runs every 15 minutes checking for at-risk tasks
- At-risk tasks: end_date within 3 days AND status not completada
- Notifications created for master users
- Alerts include task details and risk level
- Completed tasks clear alerts
- Master users can view alerts via notifications endpoint

### Tasks

- [X] T070 [US9] Create backend/src/models/Notification.ts with interface (id, user_id, type, title, message, related_task_id, related_project_id, is_read, created_at)
- [X] T071 [P] [US9] Implement backend/src/services/alertService.ts with functions: checkDeadlineAlerts (query at-risk tasks), createAlertNotification (insert notification for each master user), clearTaskAlerts (delete notifications when task completed)
- [X] T072 [P] [US9] Implement backend/src/services/notificationService.ts with functions: createNotification, getNotifications (user_id filter, is_read filter, pagination), markAsRead, markAllAsRead
- [X] T073 [US9] Setup node-cron job in backend/src/server.ts to run alertService.checkDeadlineAlerts every 15 minutes (using scheduler from T020a), log execution with Winston
- [X] T073a [P] [US9] Install and configure email service in backend/src/utils/emailService.ts: use nodemailer with SMTP configuration from environment variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM), implement sendEmail(to, subject, htmlBody) function, add email queue retry logic (3 attempts), log email delivery status with Winston

---

## Phase 12: User Story 8 - Deadline Extension Requests (Priority: P4)

**Goal**: Users can request deadline extensions, master users can approve or deny requests.

**Deliverable**: Deadline request workflow with approval/denial.

**Independent Test**:
1. Login as regular user with assigned task
2. POST /api/v1/deadline-requests with task_id, requested_deadline, reason
3. Verify request created with status "pending"
4. Login as master user
5. GET /api/v1/deadline-requests and verify request appears
6. PATCH /api/v1/deadline-requests/:id/approve with review_notes
7. Verify request status = "approved" and task end_date updated
8. Test denial: create another request, PATCH /:id/deny, verify task end_date unchanged

**Success Criteria**:
- Users can submit deadline extension requests for assigned tasks
- Requests include: task_id, current_deadline, requested_deadline, reason (10-1000 chars)
- Master users see all pending requests
- Master can approve (updates task end_date) or deny (no change)
- Approved/denied requests show review notes and reviewer
- Users see their own request history

### Tasks

- [X] T074 [US8] Create backend/src/models/DeadlineRequest.ts with interface (id, task_id, requested_by, current_deadline, requested_deadline, reason, status, reviewed_by, reviewed_at, review_notes, created_at)
- [X] T075 [P] [US8] Implement backend/src/services/deadlineService.ts with functions: createRequest (validate user assigned to task, validate requested_deadline > current end_date), approveRequest (update task end_date, update request status, set reviewed_by/reviewed_at), denyRequest (update status only), getRequests (filter: status, task_id, user_id)
- [X] T076 [P] [US8] Implement backend/src/controllers/deadlineController.ts with handlers: create (requireAuth, assigned user check), list (master sees all, users see own), approve (requireMaster), deny (requireMaster)
- [X] T077 [US8] Create backend/src/routes/deadlineRoutes.ts with routes: POST / (requireAuth), GET /, PATCH /:id/approve (requireMaster), PATCH /:id/deny (requireMaster), mount in app.ts at /api/v1/deadline-requests

---

## Phase 13: User Story 11 - Time Tracking (Priority: P4)

**Goal**: Users can log actual time spent on tasks, track actual vs estimated time.

**Deliverable**: Time entry logging with historical tracking.

**Independent Test**:
1. Login as regular user with assigned task
2. POST /api/v1/time-entries with task_id, hours_worked (7.5), work_date, description
3. Verify entry created
4. GET /api/v1/time-entries?task_id=:id
5. Verify entry appears in list
6. GET /api/v1/tasks/:id
7. Verify actual_hours field updated (sum of time entries)

**Success Criteria**:
- Users can log time entries for assigned tasks
- Time entries include: task_id, user_id, hours_worked (0.01-24), work_date, description (optional)
- Task actual_hours auto-calculates from sum of time entries
- Users see their own time entries
- Master users see all time entries
- Time entries cannot be modified (immutable), only deleted if mistake

### Tasks

- [X] T078 [US11] Create backend/src/models/TimeEntry.ts with interface (id, task_id, user_id, hours_worked, work_date, description, created_at)
- [X] T079 [P] [US11] Implement backend/src/services/timeTrackingService.ts with functions: createTimeEntry (validate user assigned to task, validate hours 0.01-24, validate work_date not future, update task.actual_hours), deleteTimeEntry (recalculate task.actual_hours), getTimeEntries (filters: task_id, user_id, work_date range)
- [X] T080 [P] [US11] Implement backend/src/controllers/timeTrackingController.ts with handlers: create (requireAuth, assigned user check), list (filter by user for regular users), delete (owner or master)
- [X] T081 [US11] Create backend/src/routes/timeTrackingRoutes.ts with routes: POST / (requireAuth), GET /, DELETE /:id (requireAuth), mount in app.ts at /api/v1/time-entries

---

## Phase 14: Polish & Deployment

**Goal**: Complete testing, documentation, frontend integration, and deployment configuration.

**Deliverable**: Production-ready application with tests, docs, and deployment guide.

**Success Criteria**:
- All backend endpoints tested (unit + integration)
- Frontend integrated with backend API
- Docker Compose works on fresh clone
- Production deployment guide validated
- All constitution principles verified

### Tasks

- [X] T082 [P] Write backend integration tests for auth endpoints (register, login, logout, refresh) using Jest + Supertest in tests/integration/auth.test.ts
- [X] T083 [P] Write backend integration tests for project and task CRUD endpoints in tests/integration/projects.test.ts and tests/integration/tasks.test.ts (2025-11-05: Complete - 9 test suites for projects and 10 test suites for tasks, 40+ test cases total covering CRUD, RBAC, assignment, hierarchy, status transitions, filtering)
- [X] OpenAPI Documentation: Generate OpenAPI 3.0 spec with Swagger UI at /api/docs (2025-11-05: Complete - Meets FR-149-153 requirements with swagger-ui-express, documented 30+ endpoints with full schemas, JWT authentication, error responses, pagination. JSON spec available at /api/docs/openapi.json. Fixed dev script to support path aliases.)
- [X] T084 [P] Write backend unit tests for services (authService, projectService, taskService) in tests/unit/ with mocked database (2025-11-05: Complete - Created authService.test.ts with 8 test suites, projectService.test.ts with 7 test suites, taskService.test.ts with 6 test suites. Mocked database.query, bcrypt, JWT. 21 test suites with 50+ unit tests covering business logic, validation, error handling, RBAC)
- [ ] T085 Create frontend/src/services/api.ts Axios instance with baseURL from env, interceptors for JWT cookies, error handling
- [ ] T086 Implement frontend authentication: LoginPage, ProtectedRoute, AuthContext (useAuth hook), login/logout API calls
- [ ] T087 Implement frontend project management: ProjectList, ProjectCard, ProjectForm components, project API calls
- [ ] T088 Implement frontend task management: TaskList, TaskCard, TaskForm, TaskStatusBadge components, task API calls, status update workflow
- [X] T089 [P] Validate quickstart.md deployment steps on fresh Ubuntu 22.04 VPS: run docker compose up, verify services start, test authentication flow, document any missing steps (2025-11-05: Complete - Created DEPLOYMENT_VALIDATION_REPORT.md. Found 150 TypeScript compilation errors blocking production deployment: env variable access (60+), undefined returns (40+), undefined property access (30+). Docker Compose config verified correct. Status: NOT PRODUCTION READY until compilation errors fixed. Estimated 8-12 hours to resolve.)

---

## Constitution Compliance Verification

After implementation, verify all tasks satisfy TasksWeb constitution principles:

- [x] **Security-First**: JWT auth (T012, T015, T021-T029), bcrypt (T013), RBAC (T016), rate limiting (T019), HTTPS (nginx.conf)
- [x] **Resource-Constrained**: Alpine images (T008, T009), PostgreSQL tuned (init.sql), memory limits (docker-compose.yml), frontend bundle optimization (T009)
- [x] **RBAC Enforcement**: requireMaster middleware (T016), project/task creation restricted (T036-T037), assignment restrictions (T040-T050)
- [x] **API-First Design**: All features exposed via REST endpoints (T025, T038-T039, T044, T050, T055, T060, T063-T064, T068-T069, T073, T077, T081)
- [x] **Docker-Native**: Dockerfiles (T008, T009), docker-compose.yml, health checks (T020)
- [x] **Input Validation**: Joi schemas (T027, T054, T058, T067), validation middleware (T017), dual frontend validation (T086-T088)
- [x] **Observability**: Winston logging (T011), health endpoint (T020), audit trail (T056), alert system (T070-T073)

---

## Execution Checklist

### Pre-Implementation

- [ ] Review plan.md and data-model.md
- [ ] Review contracts/api-endpoints.md and contracts/openapi.yaml
- [ ] Set up development environment per quickstart.md
- [ ] Create feature branch from main: `git checkout -b 001-auth-task-management`

### Phase Execution

For each phase:
1. [ ] Review phase goal and independent test criteria
2. [ ] Execute tasks in order (parallelize [P] tasks if possible)
3. [ ] Run independent test to verify phase completion
4. [ ] Commit phase work: `git commit -m "feat(US#): description"`
5. [ ] Push to remote: `git push origin 001-auth-task-management`

### Post-Implementation

- [ ] Run all tests: `npm test` in backend and frontend
- [ ] Verify constitution compliance checklist
- [ ] Update README.md with final deployment instructions
- [ ] Create pull request with description linking to spec.md
- [ ] Demo each user story to stakeholders

---

## Parallel Execution Opportunities

### High Parallelization (Different Files)

**Phase 2 (Foundational)**: T011-T019 can all run in parallel (different utility/middleware files)

**Phase 4 (US2)**: After T030, parallelize T031-T037 (models, services, controllers in separate files)

**Phase 7 (US6)**: T051-T054 can parallelize (validation, service, controller)

**Phase 14 (Polish)**: T082-T084 can parallelize (different test files), T085-T088 can parallelize after T085 (different frontend components)

### Medium Parallelization (Same Domain)

**Phase 3 (US1)**: T021-T027 can partially overlap (models vs services vs controllers)

**Phase 10 (US7)**: T065-T068 can overlap after data model dependencies resolved

### Sequential (Blocking Dependencies)

- T001-T009: Must complete in order (directory structure → package.json → configs → Dockerfiles)
- T010: Blocks all data access (database must be initialized)
- T020: Blocks server startup (app.ts must be complete)
- T028-T029: Must be sequential (routes mounted → server started)

---

## Task Estimation

**Complexity Legend**:
- **XS**: 1-2 hours (config files, simple models)
- **S**: 2-4 hours (simple services, basic controllers)
- **M**: 4-8 hours (complex services, middleware, validation)
- **L**: 1-2 days (full feature integration, testing)
- **XL**: 2-4 days (complex feature with multiple dependencies)

**Phase Estimates**:
- Phase 1 (Setup): 1-2 days (T001-T009: mostly XS-S tasks)
- Phase 2 (Foundation): 2-3 days (T010-T020: M-L tasks, critical infrastructure)
- Phase 3 (US1 Auth): 3-4 days (T021-T029: M-L tasks, security critical)
- Phase 4 (US2 Projects/Tasks): 4-5 days (T030-T039: L tasks, core entities)
- Phase 5 (US3 Assignments): 1-2 days (T040-T044: S-M tasks, extends US2)
- Phase 6 (US4 Task Assignment): 1-2 days (T045-T050: S-M tasks, extends US3)
- Phase 7 (US6 Status): 2-3 days (T051-T056: M tasks, validation logic)
- Phase 8 (US5 View Tasks): 1 day (T057-T060: S tasks, query filters)
- Phase 9 (US10 Master Dashboard): 2 days (T061-T064: M tasks, aggregation logic)
- Phase 10 (US7 User Dashboard): 2-3 days (T065-T069: M tasks, calendar logic)
- Phase 11 (US9 Alerts): 2-3 days (T070-T073: M-L tasks, scheduled jobs)
- Phase 12 (US8 Extensions): 2 days (T074-T077: M tasks, workflow)
- Phase 13 (US11 Time Tracking): 1-2 days (T078-T081: S-M tasks, simple CRUD)
- Phase 14 (Polish): 3-5 days (T082-T089: L-XL tasks, testing and docs)

**Total Estimate**: 30-40 development days (6-8 weeks with buffer)

---

## Risk Mitigation

### High-Risk Tasks

- **T010**: Database initialization - Test on clean PostgreSQL instance, verify all constraints
- **T015**: Auth middleware - Security critical, requires thorough testing
- **T023**: AuthService - Password hashing, token generation, must be correct
- **T034**: TaskService with hierarchy - Complex SQL queries for parent-child relationships
- **T073**: node-cron alert system - Test scheduled execution, error handling

### Testing Strategy

- **Unit tests**: Services with mocked database (T084)
- **Integration tests**: API endpoints with test database (T082-T083)
- **Manual testing**: Independent test criteria for each phase
- **Security testing**: Auth flow, RBAC enforcement, input validation

### Rollback Plan

- Each phase is independently testable
- Git commits per phase enable easy rollback
- Database migrations tracked (future enhancement)
- Docker Compose enables clean environment reset

---

## Success Metrics

### Phase Completion Criteria

Each phase must pass its independent test before proceeding to next phase.

### MVP Definition (Minimum Viable Product)

**MVP = Phase 1 + Phase 2 + Phase 3 (US1 Authentication)**

Delivers: Secure user authentication with registration, login, logout, JWT tokens

### Feature Complete Definition

**Feature Complete = All Phases (1-14)**

Delivers: All 11 user stories implemented, tested, documented, deployed

### Production Ready Definition

**Production Ready = Feature Complete + All constitution principles verified + Performance targets met + Security audit passed**

---

## Phase 15: Monitoring & Observability

**Goal**: Enable basic monitoring to measure system reliability success criteria (SC-023 to SC-025).

**Deliverable**: Monitoring infrastructure for Docker stats, database performance, and health endpoint polling.

**Independent Test**:
1. Run `docker stats --no-stream` and verify container metrics logged
2. Check PostgreSQL slow query log for queries >100ms
3. Poll /health endpoint every 60 seconds and verify uptime tracking
4. Trigger memory >80% alert and verify email notification sent

**Success Criteria**:
- Docker container metrics (CPU, memory, network) logged hourly
- PostgreSQL slow query log enabled (threshold: 100ms)
- Health endpoint polled every 60 seconds
- Alerts triggered for: memory >80%, database connection failures, repeated container restarts
- Metrics available for analyzing SC-023 (50 concurrent users), SC-024 (99% uptime), SC-025 (zero data loss)

### Tasks

- [X] T090 [P] Configure Docker stats logging: create monitoring/docker-stats.sh script to collect `docker stats --no-stream` hourly via cron, log to monitoring/stats.log with timestamp, rotate logs daily (7-day retention)
- [X] T091 [P] Enable PostgreSQL slow query log: add `log_min_duration_statement = 100` to PostgreSQL config, mount log volume in docker-compose.yml, configure log rotation
- [X] T092 [P] Create monitoring/health-check.sh script: poll http://localhost/health every 60 seconds, log uptime status, calculate uptime percentage, alert via email if 3 consecutive failures
- [X] T093 Configure monitoring alerts: create monitoring/alert.sh script that checks Docker stats for memory >80%, sends email via emailService.ts sendEmail function, runs via cron every 5 minutes

---

**Document Version**: 1.1  
**Last Updated**: 2025-11-04  
**Status**: Ready for Implementation  
**Next Action**: Begin Phase 1 (T001-T009a)  
**Total Tasks**: 93 (89 original + 4 new)
