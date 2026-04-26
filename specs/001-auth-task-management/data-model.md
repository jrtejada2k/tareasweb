# Data Model

**Feature**: Authentication and Task Management System  
**Branch**: 001-auth-task-management  
**Date**: 2025-11-04

## Overview

This document defines the data entities, relationships, validation rules, and state transitions for the task management system. The model is designed for PostgreSQL 16.x with normalized relational structure optimized for query performance and referential integrity.

---

## Entity Relationship Diagram (Conceptual)

```
┌──────────┐
│  User    │──────┐
└──────────┘      │ created_by
      │           │
      │ assigned  │
      ↓           ↓
┌─────────────────────┐         ┌──────────────┐
│ Project Assignment  │────────▶│   Project    │
└─────────────────────┘         └──────────────┘
                                       │
                                       │ contains
                                       ↓
                                ┌──────────────┐
                                │     Task     │──┐ parent_task_id
                                └──────────────┘  │ (self-reference)
                                       │          │
                                       │          ↓
                                       │    Sub-task
                    ┌──────────────────┼───────────────────┐
                    │                  │                   │
                    ↓                  ↓                   ↓
            ┌───────────────┐   ┌─────────────┐   ┌──────────────┐
            │ Task          │   │ Time Entry  │   │ Deadline     │
            │ Assignment    │   │             │   │ Request      │
            └───────────────┘   └─────────────┘   └──────────────┘
                    │
                    ↓
            ┌─────────────┐
            │    User     │
            └─────────────┘

┌──────────────┐         ┌───────────────┐
│ Notification │────────▶│     User      │
└──────────────┘         └───────────────┘

┌───────────────┐        ┌───────────────┐
│ Refresh Token │───────▶│     User      │
└───────────────┘        └───────────────┘

┌─────────────┐
│  Audit Log  │ (references all entities)
└─────────────┘
```

---

## Core Entities

### 1. User

Represents an authenticated person using the system with role-based access.

**Table**: `users`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email (login credential) |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hashed password |
| full_name | VARCHAR(255) | NOT NULL | User's display name |
| role | VARCHAR(50) | NOT NULL, CHECK (role IN ('master', 'user')) | User role (master or user) |
| is_active | BOOLEAN | DEFAULT TRUE | Account status |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| last_login_at | TIMESTAMP WITH TIME ZONE | NULL | Last successful login |

**Indexes**:
- PRIMARY KEY: `id`
- UNIQUE: `email`
- INDEX: `role`
- INDEX: `is_active`

**Validation Rules**:
- `email`: Must match RFC 5322 email format
- `password_hash`: bcrypt hash with cost factor 10-12
- `full_name`: 2-255 characters, no special characters except spaces, hyphens, apostrophes
- `role`: Enum ('master', 'user'), immutable after creation (require admin intervention to change)
- `is_active`: Soft delete mechanism (false = deactivated account)

**Business Rules**:
- Email must be unique across all users (case-insensitive)
- Password must meet complexity requirements: min 8 characters, uppercase, lowercase, number
- Master users cannot be deactivated if they are the sole master user
- Deleted users should have tasks reassigned before deactivation

---

### 2. Project

Top-level container for organizing tasks.

**Table**: `projects`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique project identifier |
| name | VARCHAR(255) | NOT NULL | Project name |
| description | TEXT | NULL | Project description |
| status | VARCHAR(50) | DEFAULT 'active', CHECK (status IN ('active', 'archived', 'completed')) | Project status |
| created_by | UUID | NOT NULL, FOREIGN KEY → users(id) | Master user who created project |
| start_date | DATE | NULL | Project start date |
| end_date | DATE | NULL | Project end date |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes**:
- PRIMARY KEY: `id`
- INDEX: `status`
- INDEX: `created_by`
- INDEX: `start_date`, `end_date`

**Validation Rules**:
- `name`: 3-255 characters, required
- `description`: 0-5000 characters, optional
- `status`: Enum ('active', 'archived', 'completed')
- `start_date` <= `end_date` (if both provided)

**Business Rules**:
- Only master users can create projects
- Project name must be unique per master user (not globally unique)
- Cannot delete project with active tasks (must archive or reassign tasks first)
- Archived projects are read-only

**State Transitions**:
```
active ──▶ archived ──▶ completed
  │                       ▲
  └───────────────────────┘ (direct completion allowed)
```

---

### 3. Task

Unit of work within a project. Supports hierarchical structure for sub-tasks.

**Table**: `tasks`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique task identifier |
| project_id | UUID | NOT NULL, FOREIGN KEY → projects(id) ON DELETE CASCADE | Parent project |
| parent_task_id | UUID | NULL, FOREIGN KEY → tasks(id) ON DELETE CASCADE | Parent task (NULL for top-level tasks) |
| title | VARCHAR(255) | NOT NULL | Task title |
| description | TEXT | NULL | Task description |
| status | VARCHAR(50) | DEFAULT 'not_started', CHECK (status IN ('not_started', 'iniciada', 'en_progreso', 'completada', 'blocked', 'cancelled')) | Task status |
| priority | VARCHAR(50) | DEFAULT 'medium', CHECK (priority IN ('low', 'medium', 'high', 'critical')) | Task priority |
| start_date | DATE | NULL | Task start date |
| end_date | DATE | NULL | Task end date (deadline) |
| estimated_hours | DECIMAL(10,2) | DEFAULT 0, CHECK (estimated_hours >= 0) | Estimated time to complete |
| actual_hours | DECIMAL(10,2) | DEFAULT 0, CHECK (actual_hours >= 0) | Actual time spent (auto-calculated from time_entries) |
| completion_percentage | INTEGER | DEFAULT 0, CHECK (completion_percentage >= 0 AND completion_percentage <= 100) | Manual completion percentage |
| created_by | UUID | NOT NULL, FOREIGN KEY → users(id) | Master user who created task |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| completed_at | TIMESTAMP WITH TIME ZONE | NULL | Completion timestamp |

**Indexes**:
- PRIMARY KEY: `id`
- INDEX: `project_id`
- INDEX: `parent_task_id`
- INDEX: `status`
- INDEX: `priority`
- INDEX: `start_date`, `end_date`
- INDEX: `created_by`

**Validation Rules**:
- `title`: 3-255 characters, required
- `description`: 0-5000 characters, optional
- `status`: Enum ('not_started', 'iniciada', 'en_progreso', 'completada', 'blocked', 'cancelled')
- `priority`: Enum ('low', 'medium', 'high', 'critical')
- `start_date` <= `end_date` (if both provided)
- `estimated_hours` >= 0
- `actual_hours` >= 0 (auto-calculated, read-only from application perspective)
- `completion_percentage`: 0-100

**Business Rules**:
- Only master users can create/edit tasks
- Sub-tasks inherit project_id from parent task (denormalized for query performance)
- Tasks cannot be deleted if they have sub-tasks (must delete sub-tasks first or cascade)
- Completed tasks are read-only except for time tracking
- Parent task status can be auto-calculated based on sub-task statuses (optional business logic)

**State Transitions**:
```
not_started ──▶ iniciada ──▶ en_progreso ──▶ completada
     │            │              │               ▲
     │            │              │               │
     └────────────┴──────────────┴──▶ blocked ───┘
     │            │              │               │
     └────────────┴──────────────┴──▶ cancelled  │
```

**Trigger**: Auto-update `actual_hours` when `time_entries` change:
```sql
CREATE TRIGGER update_task_actual_hours
AFTER INSERT OR UPDATE OR DELETE ON time_entries
FOR EACH ROW EXECUTE FUNCTION update_task_hours();
```

---

### 4. Task Assignment

Many-to-many relationship between tasks and users (who is assigned to work on the task).

**Table**: `task_assignments`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique assignment identifier |
| task_id | UUID | NOT NULL, FOREIGN KEY → tasks(id) ON DELETE CASCADE | Assigned task |
| user_id | UUID | NOT NULL, FOREIGN KEY → users(id) ON DELETE CASCADE | Assigned user |
| assigned_by | UUID | NOT NULL, FOREIGN KEY → users(id) | Master user who made assignment |
| assigned_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | Assignment timestamp |

**Indexes**:
- PRIMARY KEY: `id`
- UNIQUE: `(task_id, user_id)` (prevent duplicate assignments)
- INDEX: `task_id`
- INDEX: `user_id`
- INDEX: `assigned_at`

**Validation Rules**:
- `task_id`: Must exist in tasks table
- `user_id`: Must exist in users table and be active
- `assigned_by`: Must be master user

**Business Rules**:
- Only master users can assign tasks
- User must be assigned to parent project before task assignment
- Multiple users can be assigned to same task
- Assignment is immutable once created (delete to unassign)

---

### 5. Project Assignment

Many-to-many relationship between projects and users (who has access to the project).

**Table**: `project_assignments`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique assignment identifier |
| project_id | UUID | NOT NULL, FOREIGN KEY → projects(id) ON DELETE CASCADE | Assigned project |
| user_id | UUID | NOT NULL, FOREIGN KEY → users(id) ON DELETE CASCADE | Assigned user |
| assigned_by | UUID | NOT NULL, FOREIGN KEY → users(id) | Master user who made assignment |
| assigned_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | Assignment timestamp |

**Indexes**:
- PRIMARY KEY: `id`
- UNIQUE: `(project_id, user_id)`
- INDEX: `project_id`
- INDEX: `user_id`
- INDEX: `assigned_at`

**Validation Rules**:
- `project_id`: Must exist in projects table
- `user_id`: Must exist in users table and be active
- `assigned_by`: Must be master user

**Business Rules**:
- Only master users can assign users to projects
- Assignment grants access to all tasks within the project
- Master users have implicit access to all projects (no assignment record needed)

---

### 6. Deadline Request

User requests to extend task deadlines, requiring master approval.

**Table**: `deadline_requests`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique request identifier |
| task_id | UUID | NOT NULL, FOREIGN KEY → tasks(id) ON DELETE CASCADE | Task for deadline extension |
| requested_by | UUID | NOT NULL, FOREIGN KEY → users(id) | User requesting extension |
| current_deadline | DATE | NOT NULL | Current task end_date |
| requested_deadline | DATE | NOT NULL, CHECK (requested_deadline > current_deadline) | Requested new end_date |
| reason | TEXT | NOT NULL | Justification for extension |
| status | VARCHAR(50) | DEFAULT 'pending', CHECK (status IN ('pending', 'approved', 'denied')) | Request status |
| reviewed_by | UUID | NULL, FOREIGN KEY → users(id) | Master user who reviewed |
| reviewed_at | TIMESTAMP WITH TIME ZONE | NULL | Review timestamp |
| review_notes | TEXT | NULL | Master's notes on decision |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | Request creation timestamp |

**Indexes**:
- PRIMARY KEY: `id`
- INDEX: `task_id`
- INDEX: `requested_by`
- INDEX: `status`
- INDEX: `created_at`

**Validation Rules**:
- `task_id`: Must exist and be assigned to requesting user
- `requested_deadline` > `current_deadline` (enforced by CHECK constraint)
- `reason`: 10-1000 characters, required
- `status`: Enum ('pending', 'approved', 'denied')
- `review_notes`: 0-1000 characters, optional

**Business Rules**:
- Only assigned users can request deadline extensions
- User can submit multiple requests for same task (each as separate record)
- Approved request updates task.end_date automatically
- Denied request leaves task.end_date unchanged
- Only master users can approve/deny requests

**State Transitions**:
```
pending ──▶ approved
   │
   └───────▶ denied
```

---

### 7. Time Entry

Log of actual time spent on tasks by users.

**Table**: `time_entries`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique time entry identifier |
| task_id | UUID | NOT NULL, FOREIGN KEY → tasks(id) ON DELETE CASCADE | Task worked on |
| user_id | UUID | NOT NULL, FOREIGN KEY → users(id) | User who worked |
| hours_worked | DECIMAL(10,2) | NOT NULL, CHECK (hours_worked > 0 AND hours_worked <= 24) | Hours worked (0.01 to 24) |
| work_date | DATE | NOT NULL | Date of work |
| description | TEXT | NULL | Work description/notes |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | Entry creation timestamp |

**Indexes**:
- PRIMARY KEY: `id`
- INDEX: `task_id`
- INDEX: `user_id`
- INDEX: `work_date`
- INDEX: `created_at`

**Validation Rules**:
- `task_id`: Must exist and user must be assigned to task
- `hours_worked`: 0.01 to 24 hours per entry
- `work_date`: Cannot be in the future
- `description`: 0-500 characters, optional

**Business Rules**:
- Users can only log time for tasks assigned to them
- Multiple time entries allowed per task per user per day
- Total actual_hours for task is SUM of all time_entries for that task
- Time entries are immutable once created (delete to remove, no updates)

---

### 8. Notification

System-generated or user-triggered notifications for alerts and updates.

**Table**: `notifications`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique notification identifier |
| user_id | UUID | NOT NULL, FOREIGN KEY → users(id) ON DELETE CASCADE | Recipient user |
| type | VARCHAR(50) | NOT NULL, CHECK (type IN ('task_assigned', 'task_due_soon', 'deadline_request', 'deadline_approved', 'deadline_denied', 'task_completed', 'task_overdue', 'status_change')) | Notification type |
| title | VARCHAR(255) | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification message |
| related_task_id | UUID | NULL, FOREIGN KEY → tasks(id) ON DELETE CASCADE | Related task (if applicable) |
| related_project_id | UUID | NULL, FOREIGN KEY → projects(id) ON DELETE CASCADE | Related project (if applicable) |
| is_read | BOOLEAN | DEFAULT FALSE | Read status |
| is_email_sent | BOOLEAN | DEFAULT FALSE | Email sent status |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Indexes**:
- PRIMARY KEY: `id`
- INDEX: `user_id`
- INDEX: `type`
- INDEX: `is_read`
- INDEX: `created_at`

**Validation Rules**:
- `type`: Enum (see CHECK constraint above)
- `title`: 5-255 characters
- `message`: 10-1000 characters

**Business Rules**:
- Notifications are created by alert system or API endpoints
- Users can mark notifications as read (is_read = TRUE)
- Email sending is asynchronous (is_email_sent tracks delivery)
- Notifications older than 30 days can be archived/deleted

---

### 9. Refresh Token

Stores JWT refresh tokens for session management.

**Table**: `refresh_tokens`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique token identifier |
| user_id | UUID | NOT NULL, FOREIGN KEY → users(id) ON DELETE CASCADE | Token owner |
| token_hash | VARCHAR(255) | NOT NULL, UNIQUE | SHA-256 hash of refresh token |
| expires_at | TIMESTAMP WITH TIME ZONE | NOT NULL | Token expiration timestamp |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | Token creation timestamp |
| is_revoked | BOOLEAN | DEFAULT FALSE | Revocation status |

**Indexes**:
- PRIMARY KEY: `id`
- INDEX: `user_id`
- UNIQUE: `token_hash`
- INDEX: `expires_at`

**Validation Rules**:
- `token_hash`: SHA-256 hash (64 characters hex)
- `expires_at`: Must be in the future at creation
- Token cannot be reused after revocation

**Business Rules**:
- Refresh tokens expire after 7 days (configurable)
- Tokens are rotated on use (old token revoked, new token issued)
- All tokens for a user are revoked on logout
- Expired or revoked tokens cannot be used
- Cleanup job removes tokens expired >30 days

---

### 10. Audit Log

Comprehensive audit trail for security and compliance.

**Table**: `audit_logs`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique log entry identifier |
| user_id | UUID | NULL, FOREIGN KEY → users(id) ON DELETE SET NULL | User who performed action |
| action | VARCHAR(100) | NOT NULL | Action performed (e.g., 'CREATE_PROJECT', 'UPDATE_TASK_STATUS') |
| entity_type | VARCHAR(50) | NOT NULL | Entity affected (e.g., 'project', 'task', 'user') |
| entity_id | UUID | NULL | ID of affected entity |
| old_values | JSONB | NULL | Previous values (for updates) |
| new_values | JSONB | NULL | New values (for creates/updates) |
| ip_address | INET | NULL | Client IP address |
| user_agent | TEXT | NULL | Client user agent |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT CURRENT_TIMESTAMP | Log timestamp |

**Indexes**:
- PRIMARY KEY: `id`
- INDEX: `user_id`
- INDEX: `entity_type`, `entity_id`
- INDEX: `created_at`
- INDEX: `action`

**Validation Rules**:
- `action`: Uppercase snake_case (e.g., 'CREATE_PROJECT', 'DELETE_TASK')
- `entity_type`: Lowercase singular (e.g., 'project', 'task', 'user')
- JSONB fields for flexible schema

**Business Rules**:
- All mutations (CREATE, UPDATE, DELETE) must log to audit_logs
- Read operations are not logged (too verbose)
- Authentication attempts (success/failure) are logged
- Authorization failures are logged
- Logs are append-only (no updates or deletes)
- Retention: 1 year minimum, configurable

**Logged Actions** (examples):
- `LOGIN_SUCCESS`, `LOGIN_FAILURE`
- `CREATE_PROJECT`, `UPDATE_PROJECT`, `DELETE_PROJECT`
- `CREATE_TASK`, `UPDATE_TASK_STATUS`, `DELETE_TASK`
- `ASSIGN_USER_TO_PROJECT`, `REMOVE_USER_FROM_PROJECT`
- `ASSIGN_TASK_TO_USER`, `APPROVE_DEADLINE_REQUEST`, `DENY_DEADLINE_REQUEST`

---

## Relationships Summary

| Relationship | Type | Description |
|--------------|------|-------------|
| User → Project (created_by) | One-to-Many | User creates multiple projects |
| User ↔ Project (assignments) | Many-to-Many | Users assigned to multiple projects |
| Project → Task | One-to-Many | Project contains multiple tasks |
| Task → Task (parent-child) | One-to-Many (self-reference) | Task has multiple sub-tasks |
| User ↔ Task (assignments) | Many-to-Many | Users assigned to multiple tasks |
| Task → Deadline Request | One-to-Many | Task can have multiple extension requests |
| User → Deadline Request | One-to-Many | User can request multiple extensions |
| Task → Time Entry | One-to-Many | Task has multiple time entries |
| User → Time Entry | One-to-Many | User logs time for multiple tasks |
| User → Notification | One-to-Many | User receives multiple notifications |
| User → Refresh Token | One-to-Many | User can have multiple refresh tokens (multiple sessions) |
| User → Audit Log | One-to-Many | User actions generate multiple log entries |

---

## Database Views (Performance Optimization)

### View: task_details
Combines task, project, and assignment data for efficient querying.

```sql
CREATE VIEW task_details AS
SELECT 
    t.id,
    t.project_id,
    p.name AS project_name,
    t.parent_task_id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.start_date,
    t.end_date,
    t.estimated_hours,
    t.actual_hours,
    t.completion_percentage,
    t.created_by,
    creator.full_name AS created_by_name,
    t.created_at,
    t.updated_at,
    t.completed_at,
    ARRAY_AGG(DISTINCT u.full_name) FILTER (WHERE u.id IS NOT NULL) AS assigned_users,
    ARRAY_AGG(DISTINCT ta.user_id) FILTER (WHERE ta.user_id IS NOT NULL) AS assigned_user_ids,
    COUNT(DISTINCT te.id) AS time_log_count
FROM tasks t
JOIN projects p ON t.project_id = p.id
JOIN users creator ON t.created_by = creator.id
LEFT JOIN task_assignments ta ON t.id = ta.task_id
LEFT JOIN users u ON ta.user_id = u.id
LEFT JOIN time_entries te ON t.id = te.task_id
GROUP BY t.id, p.name, creator.full_name;
```

### View: user_workload
Summarizes user's active and completed task counts.

```sql
CREATE VIEW user_workload AS
SELECT 
    u.id AS user_id,
    u.full_name,
    u.email,
    COUNT(DISTINCT ta.task_id) FILTER (WHERE t.status != 'completada') AS active_tasks_count,
    COUNT(DISTINCT ta.task_id) FILTER (WHERE t.status = 'completada') AS completed_tasks_count,
    COALESCE(SUM(t.estimated_hours) FILTER (WHERE t.status != 'completada'), 0) AS total_estimated_hours,
    COALESCE(SUM(t.actual_hours), 0) AS total_actual_hours
FROM users u
LEFT JOIN task_assignments ta ON u.id = ta.user_id
LEFT JOIN tasks t ON ta.task_id = t.id
WHERE u.role = 'user' AND u.is_active = TRUE
GROUP BY u.id, u.full_name, u.email;
```

---

## Data Integrity Constraints

### Foreign Key Cascade Rules
- `ON DELETE CASCADE`: task_assignments, project_assignments, time_entries, notifications (delete dependent records)
- `ON DELETE SET NULL`: audit_logs.user_id (preserve logs even if user deleted)
- `ON DELETE RESTRICT`: projects → tasks (prevent project deletion with active tasks)

### Check Constraints
- Date ranges: `start_date <= end_date`
- Numeric ranges: `hours_worked > 0 AND hours_worked <= 24`
- Enums: Status and role values restricted to defined sets
- Deadline requests: `requested_deadline > current_deadline`

### Unique Constraints
- User email (case-insensitive unique index)
- Task assignments: `(task_id, user_id)`
- Project assignments: `(project_id, user_id)`
- Refresh token hash

---

## Indexes for Query Performance

**Critical Indexes** (already defined above):
- All primary keys (UUID)
- All foreign keys
- `users.email` (UNIQUE, for login queries)
- `tasks.status`, `tasks.project_id`, `tasks.start_date`, `tasks.end_date` (for dashboard queries)
- `notifications.user_id`, `notifications.is_read`, `notifications.created_at` (for notification feed)
- `audit_logs.created_at`, `audit_logs.entity_type`, `audit_logs.entity_id` (for audit queries)

**Composite Indexes** (future optimization if needed):
- `tasks (user_id, status)` (user's active tasks query)
- `tasks (project_id, status)` (project's active tasks query)
- `time_entries (task_id, work_date)` (task time tracking query)

---

## Data Migration Strategy

### Initial Setup
1. Run `database/init.sql` to create tables, indexes, triggers, views
2. Seed with initial master user (via backend script or manual SQL)
3. Optionally seed with demo data for development

### Future Migrations
- Use migration tool (e.g., `node-pg-migrate`, `db-migrate`)
- Version migrations with timestamps
- Test migrations on staging before production
- Always create backup before migration
- Rollback plan for each migration

---

## Estimated Data Volumes

| Entity | Year 1 | Year 3 | Storage per Record |
|--------|--------|--------|-------------------|
| Users | 100-1000 | 1000-5000 | ~1 KB |
| Projects | 50-500 | 500-2000 | ~2 KB |
| Tasks | 500-10,000 | 10,000-50,000 | ~5 KB |
| Task Assignments | 1,000-20,000 | 20,000-100,000 | ~100 bytes |
| Time Entries | 10,000-100,000 | 100,000-1,000,000 | ~500 bytes |
| Notifications | 5,000-50,000 | 50,000-500,000 | ~500 bytes |
| Audit Logs | 50,000-500,000 | 500,000-5,000,000 | ~1 KB |

**Total Estimated Storage**: 
- Year 1: 50-150 MB (including indexes)
- Year 3: 500 MB - 1 GB (including indexes)

**Query Performance Expectations**:
- Single record retrieval: <5ms
- List queries (50 items): <50ms
- Dashboard aggregations: <100ms
- Complex reports: <500ms

---

## Conclusion

Data model designed for:
- ✅ **Normalized structure**: Prevents data duplication, ensures referential integrity
- ✅ **Optimized indexes**: Fast queries for common operations (dashboards, task lists)
- ✅ **RBAC support**: Foreign keys to users with role checks in application layer
- ✅ **Audit trail**: Comprehensive logging for security and compliance
- ✅ **Scalability**: UUID primary keys, indexed foreign keys, efficient JOINs
- ✅ **Data integrity**: Check constraints, cascading deletes, triggers

**Ready for Phase 1 Contract Generation** (API endpoints based on this model).
