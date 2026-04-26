# Feature Specification: Authentication and Task Management System

**Feature Branch**: `001-auth-task-management`  
**Created**: 2025-11-04  
**Status**: Draft  
**Input**: User description: "Complete authentication and task management system with JWT, role-based access control, project/task/subtask hierarchy, user assignments, dashboard views, status tracking, and deadline alerts"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure User Authentication (Priority: P1)

Users need to log in to the application using secure token-based authentication. The system must protect user credentials and maintain session security through tokens rather than simple password storage.

**Why this priority**: Authentication is the foundation of the entire system. Without secure login, no other features can function. This is the absolute prerequisite for all role-based features.

**Independent Test**: Can be fully tested by creating a user account, logging in with correct credentials (receiving a token), attempting login with incorrect credentials (rejected), and verifying token-based session persistence across requests. Delivers secure access to the application.

**Acceptance Scenarios**:

1. **Given** a registered user with valid credentials, **When** the user submits email and password through the login form, **Then** the system validates credentials and returns an authentication token
2. **Given** an authenticated user with a valid token, **When** the user makes subsequent requests with the token, **Then** the system recognizes the authenticated session without re-login
3. **Given** a user with invalid credentials, **When** the user attempts to login, **Then** the system rejects access and displays an appropriate error message
4. **Given** an authenticated user, **When** the user logs out, **Then** the system invalidates the token and requires re-authentication for future requests

---

### User Story 2 - Master User: Project and Task Creation (Priority: P2)

Master users can create projects, assign tasks to those projects, and create sub-tasks within tasks. This establishes the hierarchical structure of work organization.

**Why this priority**: After authentication, the core value proposition is organizing work. Master users need the ability to structure projects before team members can interact with tasks.

**Independent Test**: Can be tested by logging in as a master user, creating a project with a name and description, adding tasks to that project with details (title, description, dates), and creating sub-tasks under tasks. Delivers complete project hierarchy management.

**Acceptance Scenarios**:

1. **Given** an authenticated master user, **When** they create a new project with name and description, **Then** the project is saved and appears in their project list
2. **Given** an existing project, **When** a master user adds a task with title, description, start date, and end date, **Then** the task is associated with the project
3. **Given** an existing task, **When** a master user creates a sub-task under it, **Then** the sub-task is linked to the parent task and inherits the project association
4. **Given** a master user viewing their projects, **When** they select a project, **Then** all associated tasks and sub-tasks are displayed in hierarchical structure

---

### User Story 3 - Master User: User Assignment to Projects (Priority: P3)

Master users can assign authenticated regular users to specific projects, granting them visibility to project tasks. Only assigned users can see and interact with project tasks.

**Why this priority**: After establishing projects and tasks, collaboration requires assigning team members. This enables delegation and team-based work.

**Independent Test**: Can be tested by creating a project with tasks, assigning a regular user to the project, logging in as that user to verify they can see the project and its tasks, and verifying that non-assigned users cannot see the project. Delivers controlled access and team collaboration.

**Acceptance Scenarios**:

1. **Given** a master user viewing a project, **When** they assign a regular user to the project, **Then** that user gains access to view all tasks within the project
2. **Given** a regular user assigned to a project, **When** they view their available projects, **Then** only assigned projects appear in their list
3. **Given** a master user, **When** they remove a user from a project, **Then** that user loses access to the project and its tasks
4. **Given** a regular user not assigned to a project, **When** they attempt to access project tasks, **Then** the system denies access

---

### User Story 4 - Master User: Task Assignment and Status Management (Priority: P2)

Master users can assign tasks to specific users with start and end dates, setting the initial status. This defines who is responsible for which work and when it should be completed.

**Why this priority**: Task assignment is critical for operational workflow. Without it, tasks are created but not actionable. This priority is equal to project creation as both are needed for a functional system.

**Independent Test**: Can be tested by creating a task, assigning it to a specific user with dates, verifying the assigned user can see it in their task list, and confirming the task shows the correct status and dates. Delivers work assignment and scheduling.

**Acceptance Scenarios**:

1. **Given** a master user with an existing task, **When** they assign the task to a user with start date, end date, and initial status, **Then** the assignment is saved and the user receives the task in their workload
2. **Given** an assigned task, **When** the assigned user logs in, **Then** they can view the task details including dates and current status
3. **Given** a master user, **When** they reassign a task from one user to another, **Then** the task moves from the first user's list to the second user's list
4. **Given** a task with multiple sub-tasks, **When** a master user assigns the parent task, **Then** all sub-tasks inherit the assignment unless specifically assigned differently

---

### User Story 5 - Regular User: View Assigned Tasks by Date (Priority: P3)

Authenticated users can query and view their assigned tasks filtered by date ranges or specific dates, helping them plan their work schedule.

**Why this priority**: After tasks are assigned, users need to view their workload. While important, this is lower priority than the assignment mechanism itself.

**Independent Test**: Can be tested by assigning tasks with different dates to a user, logging in as that user, and filtering tasks by specific dates or date ranges to verify only matching tasks appear. Delivers personal task planning capability.

**Acceptance Scenarios**:

1. **Given** a user with multiple assigned tasks, **When** they filter tasks by a specific date, **Then** only tasks with start or end dates matching that date are displayed
2. **Given** a user viewing their task list, **When** they select a date range, **Then** tasks falling within that range are shown
3. **Given** a user with tasks assigned, **When** they view today's tasks, **Then** tasks with start date of today or end date of today appear prominently

---

### User Story 6 - Regular User: Update Task and Sub-Task Status (Priority: P2)

Authenticated users can change the status of their assigned tasks and sub-tasks through defined status transitions: Not Started → Iniciada (Started) → En Progreso (In Progress) → Completada (Completed). Users can also accept or modify the end date.

**Why this priority**: Status updates are the primary interaction mechanism for regular users. This is how work progress is tracked and communicated. Essential for operational visibility.

**Independent Test**: Can be tested by assigning a task to a user, logging in as that user, changing the task status through the valid transitions, and verifying the status updates are saved and reflected correctly. For tasks with sub-tasks, verify that sub-task statuses influence parent task status logic. Delivers progress tracking.

**Acceptance Scenarios**:

1. **Given** a user with an assigned task in "Not Started" status, **When** they change the status to "Iniciada", **Then** the status updates and is visible to both the user and master users
2. **Given** a task in "Iniciada" status, **When** the user changes it to "En Progreso", **Then** the status transition is saved
3. **Given** a task in "En Progreso" status, **When** the user changes it to "Completada", **Then** the task is marked complete with completion timestamp
4. **Given** a task with sub-tasks, **When** the user updates sub-task statuses, **Then** each sub-task status changes independently
5. **Given** a user viewing task details, **When** they accept the end date, **Then** the date is confirmed as agreed upon

---

### User Story 7 - Regular User: Dashboard with Calendar View (Priority: P3)

Authenticated users can view their assigned tasks in a dashboard with a calendar visualization showing tasks by date, and a separate list showing upcoming tasks for the next 2 days.

**Why this priority**: The dashboard provides enhanced user experience and planning capability. While valuable, it's lower priority than core task assignment and status tracking functionality.

**Independent Test**: Can be tested by assigning multiple tasks with varying dates, logging in as a user, viewing the dashboard to see tasks plotted on a calendar, and verifying the "next 2 days" panel shows only relevant upcoming tasks. Delivers visual task planning.

**Acceptance Scenarios**:

1. **Given** a user with assigned tasks, **When** they view their dashboard, **Then** tasks are displayed on a calendar view according to their start and end dates
2. **Given** a user viewing the dashboard, **When** they look at the upcoming tasks panel, **Then** only tasks with start dates in the next 2 days are shown
3. **Given** a user with a task due soon, **When** the task appears in the next 2 days list, **Then** it is highlighted or marked as urgent
4. **Given** a user selecting a date on the calendar, **When** they click on it, **Then** all tasks for that date are displayed in detail

---

### User Story 8 - Regular User: Request Deadline Extension (Priority: P4)

Authenticated users can submit requests to master users to reassign a task to a different end date. Master users receive these requests and can approve or deny them.

**Why this priority**: Deadline negotiation is important for realistic project management but is not essential for MVP functionality. Can be added after core features are working.

**Independent Test**: Can be tested by assigning a task with an end date, logging in as the assigned user, submitting a deadline extension request with justification, logging in as a master user to view pending requests, and approving/denying the request. Delivers flexible deadline management.

**Acceptance Scenarios**:

1. **Given** a user with an assigned task, **When** they request a deadline extension with a new date and reason, **Then** the request is submitted to the master user
2. **Given** a master user, **When** they view pending deadline requests, **Then** all requests are listed with user name, task details, current date, requested date, and reason
3. **Given** a master user reviewing a request, **When** they approve it, **Then** the task's end date is updated to the requested date
4. **Given** a master user reviewing a request, **When** they deny it, **Then** the original end date remains and the user is notified of the denial

---

### User Story 9 - Master User: Deadline Alert System (Priority: P3)

Master users receive alerts (in-app notifications and/or email) for tasks at risk of expiring that are not yet started or still in progress. Alerts are triggered based on deadline proximity and task status.

**Why this priority**: Proactive alerting helps prevent missed deadlines. Important for project oversight but lower priority than core task management functionality.

**Independent Test**: Can be tested by creating tasks with near-future deadlines in "Not Started" or "In Progress" status, advancing the system time or waiting for the alert threshold to be reached, and verifying master users receive notifications via in-app alerts or email. Delivers proactive project monitoring.

**Acceptance Scenarios**:

1. **Given** a task approaching its end date that is "Not Started", **When** the alert threshold is reached (e.g., 50% of time elapsed), **Then** the master user receives an alert notification
2. **Given** a task in "En Progreso" with 20% or less time remaining, **When** the system checks for at-risk tasks, **Then** the master user receives an alert
3. **Given** a master user with multiple at-risk tasks, **When** they view the alert dashboard, **Then** all at-risk tasks are listed with severity indicators
4. **Given** a task that was at-risk but is now completed, **When** the status changes, **Then** the alert is cleared and no longer shown

---

### User Story 10 - Master User: Dashboard with Project Cards (Priority: P3)

Master users can view all projects as cards in a dashboard layout. Each project card displays a list of its tasks. Master users can click on a project card to navigate to detailed project view.

**Why this priority**: Visual dashboard enhances master user experience but is less critical than core CRUD operations on projects and tasks. Can be implemented after basic list views work.

**Independent Test**: Can be tested by creating multiple projects with tasks, logging in as a master user, viewing the dashboard to see project cards with task lists, and clicking a card to verify navigation to detailed project view. Delivers efficient project overview.

**Acceptance Scenarios**:

1. **Given** a master user with multiple projects, **When** they view their dashboard, **Then** each project is displayed as a card with project name and description
2. **Given** a project card, **When** the master user views it, **Then** a list of tasks (with task names and statuses) is visible within the card
3. **Given** a master user viewing a project card, **When** they click on the card or "view details" button, **Then** they navigate to a detailed project page showing all tasks, sub-tasks, and assignments
4. **Given** a project with no tasks, **When** displayed as a card, **Then** it shows an empty state with option to add tasks

---

### User Story 11 - Regular User: Time Tracking (Priority: P4)

Authenticated users can record actual time spent on each task independently from the estimated or planned time. This allows tracking of actual effort versus planned effort.

**Why this priority**: Time tracking provides valuable project metrics but is not essential for core task management workflow. This is an enhancement feature for more mature usage.

**Independent Test**: Can be tested by assigning a task with an estimated time, logging in as a user, logging actual time spent (e.g., "2 hours worked today"), and verifying the actual time is recorded separately from estimated time. Delivers project analytics capability.

**Acceptance Scenarios**:

1. **Given** a user working on a task, **When** they log actual time spent (e.g., 2.5 hours), **Then** the time entry is saved and associated with the task
2. **Given** a task with multiple time entries, **When** viewing task details, **Then** total actual time is displayed and compared to estimated time
3. **Given** a user viewing their tasks, **When** they access time tracking, **Then** they can see historical time entries per task with dates
4. **Given** a master user viewing project metrics, **When** they review time tracking data, **Then** they can see actual vs. estimated time across all tasks

---

### Edge Cases

- What happens when a user tries to access a project they are not assigned to? System must deny access with appropriate error message.
- What happens when a master user deletes a project that has tasks assigned to users? System should either prevent deletion (require unassignment first) or cascade delete with warning confirmation.
- What happens when a task end date is in the past and status is not completed? System should flag as overdue and include in alert system.
- What happens when a user tries to change task status in an invalid sequence (e.g., Completada back to Iniciada)? System should either prevent the invalid transition or allow it with audit log entry.
- What happens when multiple master users try to update the same task simultaneously? System should implement optimistic locking or last-write-wins with timestamp tracking.
- What happens when an authentication token expires while a user is working? System should gracefully prompt for re-authentication without losing unsaved work.
- What happens when a master user assigns a task to a user who is not assigned to the parent project? System should either auto-assign the user to the project or prevent the task assignment with a validation message.
- What happens when a user submits multiple deadline extension requests for the same task? System should track all requests and allow master to review them chronologically or replace pending requests with the latest.
- What happens when network connectivity is lost while updating task status? System should queue the update and retry when connection is restored, or display offline mode indicator.
- What happens when a task has sub-tasks with conflicting statuses (some completed, some not started)? System should display parent task status based on aggregation logic (e.g., "In Progress" if any sub-task is started).

## Requirements *(mandatory)*

### Functional Requirements

**Authentication & Authorization**:
- **FR-001**: System MUST authenticate users using token-based authentication (JWT or similar secure token mechanism)
- **FR-002**: System MUST support two user roles: Master (administrator with full privileges) and User (regular team member with limited privileges)
- **FR-003**: System MUST hash and securely store user passwords using industry-standard encryption (bcrypt or similar)
- **FR-004**: System MUST maintain secure session state through tokens without storing sensitive credentials client-side
- **FR-005**: System MUST validate authentication tokens on every protected request
- **FR-006**: System MUST provide logout functionality that invalidates user tokens

**Project Management (Master Only)**:
- **FR-007**: Master users MUST be able to create projects with name and description
- **FR-008**: Master users MUST be able to edit project details
- **FR-009**: Master users MUST be able to delete projects
- **FR-010**: Master users MUST be able to view all projects in the system
- **FR-011**: System MUST display projects as cards in master user dashboard
- **FR-012**: Project cards MUST show a list of associated tasks within the card view

**Task Management**:
- **FR-013**: Master users MUST be able to create tasks within projects
- **FR-014**: Master users MUST be able to create sub-tasks within tasks (hierarchical relationship)
- **FR-015**: System MUST support task attributes: title, description, start date, end date, status, assigned user(s)
- **FR-016**: System MUST support task statuses: Not Started, Iniciada (Started), En Progreso (In Progress), Completada (Completed)
- **FR-017**: System MUST allow master users to assign tasks to specific authenticated users
- **FR-018**: System MUST associate tasks with their parent project
- **FR-019**: System MUST link sub-tasks to their parent tasks
- **FR-020**: Regular users MUST be able to update status of their assigned tasks
- **FR-021**: Regular users MUST be able to update status of sub-tasks within their assigned tasks
- **FR-022**: System MUST allow users to accept or confirm task end dates

**User Assignment & Access Control**:
- **FR-023**: Master users MUST be able to assign regular users to projects
- **FR-024**: Regular users MUST only see projects they are assigned to
- **FR-025**: Regular users MUST only see tasks from their assigned projects
- **FR-026**: System MUST enforce access control: users cannot access projects/tasks they are not assigned to
- **FR-027**: System MUST allow master users to remove users from project assignments

**Task Querying & Filtering**:
- **FR-028**: Regular users MUST be able to query their assigned tasks by date
- **FR-029**: Regular users MUST be able to filter tasks by date ranges
- **FR-030**: System MUST provide a calendar view of tasks organized by dates
- **FR-031**: System MUST display upcoming tasks for the next 2 days in a separate prominent list

**Deadline Management**:
- **FR-032**: Regular users MUST be able to submit deadline extension requests for assigned tasks
- **FR-033**: Deadline extension requests MUST include: task reference, current end date, requested end date, and reason/justification
- **FR-034**: Master users MUST be able to view all pending deadline extension requests
- **FR-035**: Master users MUST be able to approve deadline extension requests (updating task end date)
- **FR-036**: Master users MUST be able to deny deadline extension requests (maintaining original end date)
- **FR-037**: System MUST notify users of approval or denial of their deadline requests

**Alert System**:
- **FR-038**: System MUST generate alerts for tasks at risk of missing deadlines
- **FR-039**: System MUST alert on tasks not started when approaching deadline (configurable threshold, default 50% of time elapsed)
- **FR-040**: System MUST alert on tasks in progress with less than 20% time remaining until deadline
- **FR-041**: Master users MUST receive alerts for at-risk tasks in their projects
- **FR-042**: System MUST support alert delivery via in-app notifications and email
- **FR-043**: System MUST clear alerts when task status changes to Completada or risk conditions no longer apply

**Time Tracking**:
- **FR-044**: Regular users MUST be able to log actual time spent on tasks
- **FR-045**: System MUST store time entries with date, hours worked, and associated task
- **FR-046**: System MUST display total actual time spent per task
- **FR-047**: System MUST display actual time separately from estimated/planned time
- **FR-048**: System MUST allow multiple time entries per task (time log history)

**Dashboard Requirements**:
- **FR-049**: Master users MUST have a dashboard showing all projects as cards with task lists
- **FR-050**: Master users MUST be able to navigate from project card to detailed project view
- **FR-051**: Regular users MUST have a dashboard showing assigned tasks with calendar visualization
- **FR-052**: Regular users MUST have a quick-access panel showing next 2 days' tasks
- **FR-053**: System MUST update dashboards within 10 seconds when task/project changes occur (via polling every 5 seconds or WebSocket push notifications)

**Data Persistence**:
- **FR-054**: System MUST persist all user data (credentials, profile information)
- **FR-055**: System MUST persist all project data (name, description, associated tasks)
- **FR-056**: System MUST persist all task data (details, status, assignments, dates)
- **FR-057**: System MUST persist task-user assignments
- **FR-058**: System MUST persist project-user assignments
- **FR-059**: System MUST persist deadline extension request history
- **FR-060**: System MUST persist time tracking entries
- **FR-061**: System MUST maintain audit trail of status changes and assignments

### Key Entities

- **User**: Represents an authenticated person using the system. Attributes include email, password (hashed), full name, and role (Master or User). Users can be assigned to projects and tasks.

- **Project**: Top-level container for organizing work. Attributes include project name, description, creation date, and associated master user who created it. Projects contain multiple tasks and have multiple assigned users.

- **Task**: Unit of work within a project. Attributes include title, description, status (Not Started/Iniciada/En Progreso/Completada), start date, end date, estimated time, actual time, and hierarchical relationship (can have parent task for sub-tasks). Tasks are assigned to specific users.

- **Sub-Task**: A task that is a child of another task, inheriting project association but having independent status and attributes. Sub-tasks have a parent_task_id linking them to their parent task.

- **Project Assignment**: Many-to-many relationship between users and projects. Represents which users have access to which projects. Attributes include assignment date and assigning master user.

- **Task Assignment**: Many-to-many relationship between users and tasks. Represents which users are responsible for which tasks. Attributes include assignment date, assigning master user, and status of acceptance.

- **Deadline Request**: Request submitted by a user to extend a task deadline. Attributes include requesting user, task reference, current deadline, requested deadline, reason, status (pending/approved/denied), reviewing master user, review date, and review notes.

- **Time Entry**: Log of actual time spent on a task. Attributes include user, task, date worked, hours worked, and optional description/notes. Multiple time entries can exist per task per user.

- **Notification/Alert**: Alert generated by the system for at-risk tasks. Attributes include alert type, task reference, recipient (master user), severity level, creation timestamp, and read/dismissed status.

### Security Requirements *(mandatory for features with authentication/authorization)*

- **SEC-001**: Authentication method: JWT (JSON Web Tokens) with secure token generation and validation. Access tokens stored in HttpOnly cookies, refresh tokens for session management.

- **SEC-002**: Authorization: 
  - **Master role access**: Create/edit/delete projects, create/edit tasks and sub-tasks, assign users to projects/tasks, view all projects/tasks, approve/deny deadline requests, receive alerts, view all dashboards
  - **User role access**: View assigned projects/tasks only, update status of assigned tasks, submit deadline extension requests, log time entries, view personal dashboard with assigned tasks
  - **Both roles**: Authenticate, logout, view personal profile, update own password

- **SEC-003**: Input validation required for:
  - Login form: email format, password strength rules
  - Project creation/edit: project name (max length, no special characters), description (max length, XSS prevention)
  - Task creation/edit: title (max length), description (XSS prevention), dates (valid date format, logical date ranges), status (enum validation), time values (numeric, positive)
  - User assignment: user ID validation (must exist, must have User role)
  - Deadline requests: reason text (max length, XSS prevention), dates (valid format, logical ranges)
  - Time tracking: hours worked (numeric, positive, reasonable range 0-24), date (valid format, not in future)
  - All API inputs: SQL injection prevention, command injection prevention, path traversal prevention

- **SEC-004**: Sensitive data handling:
  - **Passwords**: MUST be hashed using bcrypt with minimum cost factor of 10-12. Plain text passwords NEVER stored. Transmitted only over HTTPS.
  - **Tokens**: JWT access tokens with 15-minute expiration. Refresh tokens with 7-day expiration, stored securely server-side. Token blacklist maintained for logout/revocation.
  - **Personal Identifiable Information (PII)**: User emails, full names stored encrypted at rest. Access logged in audit trail.
  - **Session data**: Tokens stored in HttpOnly, Secure, SameSite cookies to prevent XSS and CSRF attacks.
  - **Audit logging**: All authentication attempts, authorization failures, data modifications logged with user ID, timestamp, IP address.

- **SEC-005**: Rate limiting:
  - **Yes**, rate limiting required on:
    - Login endpoint: Maximum 5 attempts per 15 minutes per IP address (brute force protection)
    - Password reset: Maximum 3 requests per hour per email
    - API endpoints (general): Maximum 100 requests per 15 minutes per authenticated user
    - Task creation/update: Maximum 50 operations per minute per master user
    - Alert generation: Throttled to prevent notification spam (max 1 alert per task per hour)

### Resource Constraints *(mandatory for features with performance impact)*

- **RES-001**: Database queries:
  - **Read operations**: Simple indexed queries for user login (1-2 table joins), task list retrieval (2-3 table joins for assignments). Expected 100-500 queries per minute during peak usage.
  - **Write operations**: Task status updates (single row), time entry logging (insert), deadline requests (insert). Expected 50-100 writes per minute.
  - **Complex queries**: Dashboard aggregations (project cards with task counts, upcoming tasks calculation) may involve 3-4 table joins with date filtering. Optimize with database views or materialized queries.
  - **Alert generation**: Background job running every 15 minutes, querying all tasks with date calculations and status checks. Should complete within 30 seconds.
  - **Indexing requirements**: Indexes on user_id, project_id, task_id, status, start_date, end_date, assigned_user fields for optimal query performance.

- **RES-002**: Memory usage:
  - **Backend API**: Estimated 200-250MB for application logic, session management, and connection pooling. Stateless design minimizes per-user memory overhead.
  - **Database**: Estimated 250-300MB for PostgreSQL with optimized shared_buffers (128MB), connection pool (20 connections max).
  - **Frontend**: React application with code splitting and lazy loading. Estimated bundle size <2MB, runtime memory <100MB per user session.
  - **Total system**: Should operate within 750MB total allocation on 1GB RAM VPS with 250MB reserved for OS.

- **RES-003**: API response time:
  - **Read operations** (task lists, project views, dashboard): <150ms p95 latency
  - **Write operations** (task creation, status updates): <200ms p95 latency
  - **Authentication** (login): <500ms p95 (includes bcrypt hashing overhead)
  - **Complex aggregations** (calendar view with multiple tasks): <300ms p95 with pagination (50 items per page)
  - **Alert generation**: Background job, no user-facing latency requirement but must complete within 30 seconds

- **RES-004**: Concurrent users:
  - **Expected simultaneous usage**: 10-50 concurrent authenticated users during typical operation
  - **Peak usage**: Up to 100 concurrent users during project deadline periods
  - **Master users**: Typically 2-5 concurrent master users performing administrative tasks
  - **Regular users**: Majority of concurrent sessions (80-95 of 100 users) viewing/updating tasks
  - **Connection pooling**: 20 database connections shared across concurrent requests sufficient for this scale

- **RES-005**: Storage:
  - **User data**: ~1KB per user record (email, hashed password, profile). Estimated 100-1000 users = 100KB-1MB.
  - **Project data**: ~2KB per project (name, description, metadata). Estimated 50-500 projects = 100KB-1MB.
  - **Task data**: ~5KB per task (details, dates, status, relationships). Estimated 500-10,000 tasks = 2.5MB-50MB.
  - **Time entries**: ~500 bytes per entry. Estimated 10,000-100,000 entries = 5MB-50MB.
  - **Audit logs**: ~1KB per log entry, 7-day retention. Estimated 1000 entries per day = 7MB.
  - **Total estimated growth**: 20MB-150MB over first year of operation. Database storage requirement: 500MB-1GB with indexes and growth buffer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

**Authentication & Usability**:
- **SC-001**: Users can complete login process in under 10 seconds from entering credentials to viewing their dashboard
- **SC-002**: Failed login attempts due to incorrect credentials display clear error messages within 2 seconds
- **SC-003**: 95% of authenticated sessions remain active for entire work session without requiring re-authentication (token expiration not reached)

**Task Management Efficiency**:
- **SC-004**: Master users can create a new project with 5 tasks in under 3 minutes
- **SC-005**: Master users can assign a task to a user in under 30 seconds from opening the task details
- **SC-006**: Regular users can update the status of a task in under 15 seconds from viewing the task list
- **SC-007**: 90% of task status changes are successfully saved on first attempt without errors

**Dashboard Performance**:
- **SC-008**: Master user dashboard displays all project cards with task lists within 2 seconds of page load for up to 50 projects
- **SC-009**: Regular user dashboard displays calendar view and upcoming tasks list within 2 seconds for up to 100 assigned tasks
- **SC-010**: Calendar view updates within 1 second when user navigates to different month or filters by date

**Access Control & Security**:
- **SC-011**: 100% of attempts by regular users to access non-assigned projects are blocked with appropriate error message
- **SC-012**: System successfully prevents brute force attacks by blocking login attempts after 5 failures within 15 minutes
- **SC-013**: Zero unauthorized access incidents (users accessing projects/tasks outside their assignments)

**Alert System Effectiveness**:
- **SC-014**: Master users receive alerts for at-risk tasks within 15 minutes of task reaching alert threshold
- **SC-015**: 90% of alerted tasks are addressed (status changed or deadline extended) within 24 hours of alert generation
- **SC-016**: False positive alert rate is below 10% (alerts for tasks that actually complete on time)

**Deadline Management**:
- **SC-017**: Regular users can submit deadline extension request in under 2 minutes including justification
- **SC-018**: Master users can review and approve/deny deadline requests in under 1 minute per request
- **SC-019**: Users receive notification of deadline request approval/denial within 5 minutes of master user action

**Time Tracking Accuracy**:
- **SC-020**: Users can log time entry for a task in under 30 seconds
- **SC-021**: 85% of users log time entries at least once per day for active tasks
- **SC-022**: Time tracking data is available for reporting within 5 minutes of entry

**System Reliability**:
- **SC-023**: System handles 50 concurrent users with no performance degradation (response times remain under 200ms p95)
- **SC-024**: System maintains 99% uptime during business hours (8 AM - 6 PM)
- **SC-025**: Zero data loss incidents (all task updates, status changes, time entries persisted successfully)

**User Adoption & Satisfaction**:
- **SC-026**: 80% of assigned users log in and interact with the system at least once per day
- **SC-027**: 90% of users successfully complete their primary workflow (view tasks, update status) without needing support
- **SC-028**: Average time from task assignment to first status update is less than 4 hours during business hours
- **SC-029**: Master users reduce time spent on manual task tracking by 50% compared to previous methods (email, spreadsheets)
- **SC-030**: 85% user satisfaction score on ease of use survey (4+ out of 5 rating)

---

## Additional Requirements (Phase 14 Pre-Audit Updates)

### API Error Handling & Recovery Requirements

**Error Response Format**:
- **FR-062**: All API error responses MUST follow consistent JSON structure: `{ "error": "Human-readable message", "code": "MACHINE_READABLE_CODE", "details": {} }`
- **FR-063**: HTTP status codes MUST be used correctly:
  - 400 Bad Request: Invalid input/validation errors
  - 401 Unauthorized: Missing or invalid authentication token
  - 403 Forbidden: Valid token but insufficient permissions
  - 404 Not Found: Resource does not exist
  - 409 Conflict: Business logic conflict (duplicate, invalid state transition)
  - 429 Too Many Requests: Rate limit exceeded
  - 500 Internal Server Error: Unexpected server errors
  - 503 Service Unavailable: Database connection or external dependency failure

**Token Expiration & Refresh**:
- **FR-064**: System MUST return 401 with error code `TOKEN_EXPIRED` when access token expires
- **FR-065**: System MUST provide `/api/v1/auth/refresh` endpoint accepting refresh token and returning new access token
- **FR-066**: System MUST implement refresh token rotation (invalidate old refresh token, issue new one)
- **FR-067**: Frontend MUST automatically retry failed request with new access token after successful refresh
- **FR-068**: System MUST return 401 with error code `REFRESH_TOKEN_INVALID` when refresh token is expired/invalid, requiring re-login

**Database Error Handling**:
- **FR-069**: System MUST return 503 with error code `DATABASE_UNAVAILABLE` when database connection fails
- **FR-070**: System MUST retry database operations up to 3 times with exponential backoff (100ms, 200ms, 400ms) for transient errors
- **FR-071**: System MUST return 500 with error code `DATABASE_CONSTRAINT_VIOLATION` for foreign key or unique constraint violations
- **FR-072**: System MUST use database transactions for multi-step operations (approve deadline request, delete project with tasks)
- **FR-073**: System MUST rollback transactions on any step failure and return appropriate error response

**Concurrent Modification Handling**:
- **FR-074**: System MUST detect concurrent updates using `updated_at` timestamp comparison
- **FR-075**: System MUST return 409 with error code `CONCURRENT_MODIFICATION` when task/project updated by another user
- **FR-076**: System MUST include current entity state in error response to allow client to retry with fresh data

**External Dependency Failures**:
- **FR-077**: System MUST handle email service (SMTP) failures gracefully without blocking API responses
- **FR-078**: System MUST retry email delivery up to 3 times with delays (5s, 15s, 30s) before marking as failed
- **FR-079**: System MUST log email delivery failures and create in-app notification as fallback
- **FR-080**: System MUST return 200 (success) for operations even if email notification fails

**Validation Error Details**:
- **FR-081**: System MUST return detailed validation errors with field names: `{ "error": "Validation failed", "code": "VALIDATION_ERROR", "details": { "fieldName": "error message" } }`
- **FR-082**: System MUST validate all required fields before processing request
- **FR-083**: System MUST validate field lengths, formats, and ranges per SEC-003 specifications
- **FR-084**: System MUST sanitize all text inputs to prevent XSS attacks before storage

### Timezone & Date Handling Requirements

**Timezone Standards**:
- **FR-085**: System MUST store all timestamps in UTC in the database
- **FR-086**: System MUST accept dates in ISO 8601 format with timezone (e.g., `2025-11-05T10:30:00Z` or `2025-11-05T10:30:00-05:00`)
- **FR-087**: System MUST convert all incoming dates to UTC before storage
- **FR-088**: API responses MUST include dates in ISO 8601 UTC format (Z timezone)
- **FR-089**: Frontend MUST display dates in user's local timezone (browser timezone detection)

**Date Validation**:
- **FR-090**: System MUST validate start_date <= end_date for tasks
- **FR-091**: System MUST reject work_date values in the future for time entries
- **FR-092**: System MUST reject deadline requests where requested_deadline <= current_deadline
- **FR-093**: System MUST validate date ranges in queries (from_date <= to_date)

### Data Integrity & Cleanup Requirements

**Cascade Delete Behavior**:
- **FR-094**: System MUST prevent project deletion if tasks exist (require explicit cascade confirmation)
- **FR-095**: When project deletion confirmed, system MUST cascade delete: all tasks, all sub-tasks, all project assignments, all task assignments, all deadline requests
- **FR-096**: System MUST allow task deletion only by master users
- **FR-097**: When task deleted, system MUST cascade delete: all sub-tasks, all task assignments, all time entries, all deadline requests, all notifications
- **FR-098**: System MUST implement cascade deletes in database transaction (all-or-nothing)

**Data Retention & Cleanup**:
- **FR-099**: System MUST retain audit logs for 90 days before archiving
- **FR-100**: System MUST retain completed tasks indefinitely (soft delete if needed)
- **FR-101**: System MUST retain deadline request history even after task completion
- **FR-102**: System MUST implement soft delete for users (mark inactive rather than delete)
- **FR-103**: System MUST anonymize data for deleted users (replace with "Deleted User" in audit trails)

**Audit Trail Requirements**:
- **FR-104**: System MUST log all task status changes with: user_id, timestamp, old_status, new_status, task_id
- **FR-105**: System MUST log all project/task assignments with: assigner_id, assignee_id, timestamp, project_id/task_id
- **FR-106**: System MUST log all authentication events with: user_id, event_type, timestamp, IP address, success/failure
- **FR-107**: System MUST log all authorization failures with: user_id, attempted_resource, timestamp, reason
- **FR-108**: Audit logs MUST be tamper-proof (append-only, no updates or deletes)

### API Performance & Limits Requirements

**Response Time Targets** (clarifying RES-003):
- **FR-109**: Authentication endpoints (`/auth/login`, `/auth/refresh`) MUST respond within 500ms p95
- **FR-110**: Simple read operations (GET single resource) MUST respond within 100ms p95
- **FR-111**: List operations (GET with pagination) MUST respond within 150ms p95
- **FR-112**: Write operations (POST/PUT/PATCH) MUST respond within 200ms p95
- **FR-113**: Complex aggregations (dashboards) MUST respond within 300ms p95
- **FR-114**: System MUST return 408 timeout error if operation exceeds 30 seconds

**Pagination Requirements** (clarifying SEC-005):
- **FR-115**: All list endpoints MUST support pagination with query parameters: `?page=1&limit=50`
- **FR-116**: Default page size MUST be 20 items if not specified
- **FR-117**: Maximum page size MUST be 100 items
- **FR-118**: Response MUST include pagination metadata: `{ "data": [], "pagination": { "page": 1, "limit": 20, "total": 150, "pages": 8 } }`
- **FR-119**: System MUST return 400 error if page or limit values are invalid (non-positive, non-numeric)

**Request Size Limits**:
- **FR-120**: System MUST reject requests with body size > 1MB (return 413 Payload Too Large)
- **FR-121**: System MUST limit text field lengths: title (200 chars), description (2000 chars), reason (1000 chars), notes (1000 chars)
- **FR-122**: System MUST limit file upload size to 5MB for future attachment features

**Connection & Resource Management**:
- **FR-123**: System MUST use connection pooling with max 20 database connections
- **FR-124**: System MUST implement connection timeout of 30 seconds
- **FR-125**: System MUST implement query timeout of 10 seconds for all database queries
- **FR-126**: System MUST gracefully handle connection pool exhaustion (return 503, queue requests with timeout)

### Email & Notification Requirements

**Email Delivery** (clarifying FR-042):
- **FR-127**: System MUST support SMTP email delivery configured via environment variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
- **FR-128**: System MUST send HTML emails with plain text fallback
- **FR-129**: System MUST include unsubscribe link in all notification emails
- **FR-130**: System MUST respect user email preferences (opt-out for non-critical notifications)
- **FR-131**: System MUST batch email notifications (max 1 email per user per 15 minutes for alerts)

**In-App Notifications**:
- **FR-132**: System MUST create in-app notifications for all events where email is sent
- **FR-133**: System MUST mark notifications as read when user views them
- **FR-134**: System MUST provide "mark all as read" functionality
- **FR-135**: System MUST show unread notification count in UI
- **FR-136**: System MUST auto-delete notifications older than 30 days

### Security Enhancements

**Password Requirements** (clarifying SEC-003):
- **FR-137**: System MUST enforce password minimum length of 8 characters
- **FR-138**: System MUST require at least one uppercase letter, one lowercase letter, one digit, one special character
- **FR-139**: System MUST reject common/weak passwords (compare against top 10,000 common passwords list)
- **FR-140**: System MUST implement bcrypt hashing with cost factor of 12
- **FR-141**: System MUST implement account lockout after 5 failed login attempts (unlock after 30 minutes or admin reset)

**CORS & CSRF Protection**:
- **FR-142**: System MUST configure CORS to allow only configured frontend origin(s)
- **FR-143**: System MUST use SameSite=Strict cookie attribute for CSRF protection
- **FR-144**: System MUST validate Origin/Referer headers for state-changing operations

**Input Sanitization** (clarifying SEC-003):
- **FR-145**: System MUST use parameterized queries for all database operations (prevent SQL injection)
- **FR-146**: System MUST HTML-escape all user input before rendering in frontend
- **FR-147**: System MUST validate all UUIDs match regex pattern before database queries
- **FR-148**: System MUST reject requests containing common attack patterns (script tags, SQL keywords in unexpected places)

### API Documentation & Contracts

**OpenAPI Specification**:
- **FR-149**: System MUST provide OpenAPI 3.0 specification document at `/api/docs/openapi.json`
- **FR-150**: System MUST serve Swagger UI at `/api/docs` for interactive API exploration
- **FR-151**: OpenAPI spec MUST include all endpoints with request/response schemas
- **FR-152**: OpenAPI spec MUST include authentication requirements per endpoint
- **FR-153**: OpenAPI spec MUST include error response examples

**API Versioning**:
- **FR-154**: All API endpoints MUST be versioned with `/api/v1/` prefix
- **FR-155**: System MUST support API version negotiation via Accept header: `Accept: application/vnd.tareasweb.v1+json`
- **FR-156**: System MUST maintain backwards compatibility within major versions
- **FR-157**: System MUST provide deprecation warnings 90 days before removing deprecated endpoints

### Non-Functional Requirements - Enhanced

**Performance Requirements** (clarifying RES-003, resolving CHK174 conflict):
- **NFR-001**: Simple read operations MUST complete within 100ms p95
- **NFR-002**: List operations with pagination MUST complete within 150ms p95
- **NFR-003**: Complex aggregations (dashboard queries) MUST complete within 300ms p95 (using database indexing and materialized views for optimization)
- **NFR-004**: Write operations MUST complete within 200ms p95
- **NFR-005**: System MUST use database indexes on: user_id, project_id, task_id, status, end_date, created_at columns
- **NFR-006**: System MUST use materialized views for dashboard aggregations that refresh every 5 minutes
- **NFR-007**: System performance targets assume 100 concurrent users, 500 projects, 5,000 tasks

**Memory & Resource Constraints** (clarifying RES-001, resolving CHK173 conflict):
- **NFR-008**: Docker container memory limit MUST NOT exceed 750MB under normal load
- **NFR-009**: System MUST support 100 concurrent users through stateless design (no session storage in memory)
- **NFR-010**: Per-user memory footprint MUST NOT exceed 2MB (authentication context only)
- **NFR-011**: Database connection pool limited to 20 connections (each ~5MB) = 100MB maximum
- **NFR-012**: System MUST use streaming for large result sets to avoid memory spikes
- **NFR-013**: System MUST implement request queuing when connection pool exhausted (503 response after 5s timeout)

**Dashboard Pagination** (clarifying FR-049-053, resolving CHK172 conflict):
- **NFR-014**: Master dashboard MUST paginate projects (50 per page) with "Load More" button
- **NFR-015**: User dashboard MUST paginate tasks (100 per page) with "Load More" button
- **NFR-016**: Calendar view MUST load only tasks within visible date range (7-day window)
- **NFR-017**: Upcoming tasks panel MUST limit to next 20 tasks by end_date
- **NFR-018**: System MUST NOT implement infinite scroll (memory constraints)

**Scalability Requirements**:
- **NFR-019**: System MUST support horizontal scaling through stateless design (session in JWT, not server memory)
- **NFR-020**: System MUST use external cache (Redis) if added in future, not in-memory cache
- **NFR-021**: System MUST support read replicas for database if traffic grows beyond 100 users
- **NFR-022**: System MUST gracefully degrade features under high load (return cached data, disable real-time updates)

**Security vs Usability Balance** (resolving CHK175 conflict):
- **NFR-023**: Security validation MUST provide clear, actionable error messages
- **NFR-024**: Failed authentication attempts MUST be logged but user receives helpful guidance ("Invalid email or password" not "Email not found")
- **NFR-025**: System MUST implement progressive account lockout (5 attempts = 30min lockout, 10 attempts = admin reset required)
- **NFR-026**: System MUST show password strength meter during registration (weak/medium/strong)
- **NFR-027**: Error messages MUST NOT leak sensitive information (existence of users, internal system details)

**Availability & Reliability**:
- **NFR-028**: System MUST achieve 99% uptime during business hours (8 AM - 6 PM local time)
- **NFR-029**: System MUST implement health check endpoint at `/api/health` returning database connectivity status
- **NFR-030**: System MUST gracefully handle database connection failures (retry 3 times, return 503 with retry-after header)
- **NFR-031**: System MUST implement circuit breaker for email service (open circuit after 5 consecutive failures, retry after 5 minutes)
- **NFR-032**: System MUST log all errors with correlation IDs for debugging

**Monitoring & Observability**:
- **NFR-033**: System MUST expose metrics endpoint at `/api/metrics` (request count, response times, error rates)
- **NFR-034**: System MUST log all requests with: timestamp, user_id, method, path, status_code, response_time
- **NFR-035**: System MUST log all errors with: timestamp, user_id, error_type, stack_trace, correlation_id
- **NFR-036**: System MUST implement structured logging (JSON format) for log aggregation
- **NFR-037**: System MUST retain logs for 30 days

**Email & Case Sensitivity** (clarifying SEC-003):
- **NFR-038**: System MUST treat email addresses as case-insensitive (normalize to lowercase before storage)
- **NFR-039**: System MUST validate email format using RFC 5322 compliant regex
- **NFR-040**: System MUST reject disposable email domains (optional enhancement)

### Recovery & Resilience Procedures

**Database Recovery**:
- **REC-001**: System MUST rollback multi-step transactions on any step failure
- **REC-002**: System MUST retry transient database errors (connection timeout, deadlock) up to 3 times with exponential backoff
- **REC-003**: System MUST log all transaction rollbacks with reason and affected entities
- **REC-004**: System MUST return 503 for persistent database failures (connection pool exhaustion, unrecoverable errors)

**External Service Recovery**:
- **REC-005**: System MUST not block API responses waiting for email delivery
- **REC-006**: System MUST create in-app notification as fallback when email fails
- **REC-007**: System MUST implement background job queue for failed email retries (process every 5 minutes)
- **REC-008**: System MUST mark emails as permanently failed after 3 retry attempts and log for admin review

**Token Refresh Recovery**:
- **REC-009**: Frontend MUST automatically retry failed API request after successful token refresh
- **REC-010**: Frontend MUST redirect to login page if refresh token expired
- **REC-011**: System MUST clear refresh token cookie on logout or refresh token expiration
- **REC-012**: System MUST support "remember me" option extending refresh token to 30 days

**Scheduled Job Failures**:
- **REC-013**: Alert generation job MUST log failures and retry on next scheduled run (15 minutes)
- **REC-014**: Alert generation job MUST track last successful run timestamp to avoid duplicate alerts
- **REC-015**: System MUST send admin notification if alert job fails 3 consecutive times

**Partial Data Loading**:
- **REC-016**: Dashboard MUST display partial data if some queries fail (show projects even if tasks fail to load)
- **REC-017**: System MUST show error banner for failed sections with "Retry" button
- **REC-018**: System MUST implement progressive enhancement (core features work even if non-critical features fail)

### Operational Requirements

**Deployment**:
- **OPS-001**: System MUST support Docker Compose deployment for development and small production deployments
- **OPS-002**: System MUST provide database migration scripts for schema updates
- **OPS-003**: System MUST support zero-downtime deployments (rolling restart, health checks)
- **OPS-004**: System MUST provide environment variable configuration (no hardcoded credentials)

**Backup & Disaster Recovery**:
- **OPS-005**: Database MUST be backed up daily with 30-day retention
- **OPS-006**: System MUST support point-in-time recovery within 30-day window
- **OPS-007**: Backup restoration MUST complete within 4 hours for disaster recovery

**Maintenance**:
- **OPS-008**: System MUST support maintenance mode (return 503 with custom message)
- **OPS-009**: System MUST provide admin commands for common tasks (create user, reset password, clear cache)
- **OPS-010**: System MUST document all environment variables in README.md
