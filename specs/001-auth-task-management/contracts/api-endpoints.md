# API Contracts - OpenAPI 3.0 Specification

**Feature**: Authentication and Task Management System  
**Branch**: 001-auth-task-management  
**Date**: 2025-11-04  
**API Version**: v1  
**Base URL**: `/api/v1`

This document defines all REST API endpoints, request/response schemas, authentication requirements, and error codes for the task management system.

---

## Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [User Endpoints](#user-endpoints)
3. [Project Endpoints](#project-endpoints)
4. [Task Endpoints](#task-endpoints)
5. [Dashboard Endpoints](#dashboard-endpoints)
6. [Deadline Request Endpoints](#deadline-request-endpoints)
7. [Time Tracking Endpoints](#time-tracking-endpoints)
8. [Notification Endpoints](#notification-endpoints)
9. [Common Schemas](#common-schemas)
10. [Error Codes](#error-codes)

---

## Authentication Endpoints

### POST /api/v1/auth/register

Create a new user account.

**Authentication**: None (public endpoint)

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "role": "user"
}
```

**Request Schema**:
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| email | string | Yes | Valid email format, unique |
| password | string | Yes | Min 8 chars, uppercase, lowercase, number |
| full_name | string | Yes | 2-255 chars |
| role | enum | Yes | "master" or "user" |

**Response 201 Created**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user",
    "created_at": "2025-11-04T10:30:00.000Z"
  },
  "message": "User registered successfully"
}
```

**Response 400 Bad Request**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email already exists"
      }
    ]
  }
}
```

---

### POST /api/v1/auth/login

Authenticate user and receive JWT tokens.

**Authentication**: None (public endpoint)

**Rate Limiting**: 5 attempts per 15 minutes per IP

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "user"
    },
    "access_token": "eyJhbGci...",
    "refresh_token": "eyJhbGci...",
    "expires_in": 900
  },
  "message": "Login successful"
}
```

**Response 401 Unauthorized**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

**Response 429 Too Many Requests**:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many login attempts. Please try again in 15 minutes."
  }
}
```

**Cookies Set**:
- `access_token`: HttpOnly, Secure, SameSite=Strict, Max-Age=900 (15 minutes)
- `refresh_token`: HttpOnly, Secure, SameSite=Strict, Max-Age=604800 (7 days)

---

### POST /api/v1/auth/refresh

Refresh access token using refresh token.

**Authentication**: Refresh token in cookie or header

**Request Body**: Empty (token from cookie)

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGci...",
    "expires_in": 900
  },
  "message": "Token refreshed successfully"
}
```

**Response 401 Unauthorized**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REFRESH_TOKEN",
    "message": "Refresh token is invalid or expired"
  }
}
```

---

### POST /api/v1/auth/logout

Invalidate user tokens and end session.

**Authentication**: Required (JWT in cookie or header)

**Request Body**: Empty

**Response 200 OK**:
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Cookies Cleared**:
- `access_token`: Removed
- `refresh_token`: Removed and blacklisted

---

### GET /api/v1/auth/me

Get current authenticated user profile.

**Authentication**: Required

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user",
    "is_active": true,
    "created_at": "2025-11-04T10:30:00.000Z",
    "last_login_at": "2025-11-04T15:45:00.000Z"
  }
}
```

---

## Project Endpoints

### GET /api/v1/projects

List all projects accessible to the user.

**Authentication**: Required

**Authorization**: 
- Master users: See all projects
- Regular users: See only assigned projects

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 50 | Items per page (max 50) |
| status | enum | all | Filter by status: active, archived, completed |
| sort | string | created_at | Sort field |
| order | enum | desc | Sort order: asc, desc |

**Response 200 OK**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Website Redesign",
      "description": "Redesign company website",
      "status": "active",
      "created_by": {
        "id": "uuid",
        "full_name": "Jane Master"
      },
      "start_date": "2025-11-01",
      "end_date": "2025-12-31",
      "task_count": 15,
      "assigned_user_count": 5,
      "created_at": "2025-11-01T10:00:00.000Z",
      "updated_at": "2025-11-04T15:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 125,
    "total_pages": 3
  }
}
```

---

### POST /api/v1/projects

Create a new project.

**Authentication**: Required  
**Authorization**: Master role only

**Request Body**:
```json
{
  "name": "Mobile App Development",
  "description": "Develop iOS and Android apps",
  "start_date": "2025-11-15",
  "end_date": "2026-06-30"
}
```

**Request Schema**:
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | string | Yes | 3-255 chars |
| description | string | No | 0-5000 chars |
| start_date | string (ISO date) | No | Valid date, <= end_date |
| end_date | string (ISO date) | No | Valid date, >= start_date |

**Response 201 Created**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Mobile App Development",
    "description": "Develop iOS and Android apps",
    "status": "active",
    "created_by": {
      "id": "uuid",
      "full_name": "Jane Master"
    },
    "start_date": "2025-11-15",
    "end_date": "2026-06-30",
    "created_at": "2025-11-04T16:00:00.000Z"
  },
  "message": "Project created successfully"
}
```

**Response 403 Forbidden**:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Only master users can create projects"
  }
}
```

---

### GET /api/v1/projects/:id

Get project details by ID.

**Authentication**: Required  
**Authorization**: Master users or users assigned to project

**Path Parameters**:
- `id` (UUID): Project ID

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Website Redesign",
    "description": "Redesign company website",
    "status": "active",
    "created_by": {
      "id": "uuid",
      "full_name": "Jane Master",
      "email": "jane@example.com"
    },
    "start_date": "2025-11-01",
    "end_date": "2025-12-31",
    "assigned_users": [
      {
        "id": "uuid",
        "full_name": "John Doe",
        "email": "john@example.com",
        "assigned_at": "2025-11-02T10:00:00.000Z"
      }
    ],
    "tasks": [
      {
        "id": "uuid",
        "title": "Design homepage mockup",
        "status": "en_progreso",
        "priority": "high",
        "assigned_users": ["John Doe"],
        "start_date": "2025-11-05",
        "end_date": "2025-11-12"
      }
    ],
    "created_at": "2025-11-01T10:00:00.000Z",
    "updated_at": "2025-11-04T15:30:00.000Z"
  }
}
```

**Response 403 Forbidden**:
```json
{
  "success": false,
  "error": {
    "code": "ACCESS_DENIED",
    "message": "You do not have access to this project"
  }
}
```

**Response 404 Not Found**:
```json
{
  "success": false,
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "Project not found"
  }
}
```

---

### PUT /api/v1/projects/:id

Update project details.

**Authentication**: Required  
**Authorization**: Master role only

**Request Body** (all fields optional):
```json
{
  "name": "Website Redesign - Phase 2",
  "description": "Updated description",
  "status": "active",
  "start_date": "2025-11-01",
  "end_date": "2026-01-31"
}
```

**Response 200 OK**: (Same as GET /api/v1/projects/:id)

---

### DELETE /api/v1/projects/:id

Delete a project.

**Authentication**: Required  
**Authorization**: Master role only

**Business Rule**: Cannot delete project with active tasks

**Response 204 No Content**: (Empty body)

**Response 400 Bad Request**:
```json
{
  "success": false,
  "error": {
    "code": "PROJECT_HAS_ACTIVE_TASKS",
    "message": "Cannot delete project with active tasks. Archive or delete tasks first."
  }
}
```

---

### POST /api/v1/projects/:id/assign-user

Assign a user to a project.

**Authentication**: Required  
**Authorization**: Master role only

**Request Body**:
```json
{
  "user_id": "uuid"
}
```

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "project_id": "uuid",
    "user_id": "uuid",
    "assigned_by": "uuid",
    "assigned_at": "2025-11-04T16:30:00.000Z"
  },
  "message": "User assigned to project successfully"
}
```

---

### DELETE /api/v1/projects/:id/unassign-user/:userId

Remove a user from a project.

**Authentication**: Required  
**Authorization**: Master role only

**Response 204 No Content**: (Empty body)

---

## Task Endpoints

### GET /api/v1/tasks

List tasks accessible to the user.

**Authentication**: Required

**Authorization**:
- Master users: See all tasks
- Regular users: See only assigned tasks

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 50 | Items per page (max 50) |
| project_id | UUID | null | Filter by project |
| status | enum | all | Filter by status |
| priority | enum | all | Filter by priority |
| assigned_to_me | boolean | false | Filter to current user's tasks |
| start_date_from | string | null | Filter tasks starting after date |
| start_date_to | string | null | Filter tasks starting before date |
| end_date_from | string | null | Filter tasks ending after date |
| end_date_to | string | null | Filter tasks ending before date |
| sort | string | created_at | Sort field |
| order | enum | desc | Sort order: asc, desc |

**Response 200 OK**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "project": {
        "id": "uuid",
        "name": "Website Redesign"
      },
      "parent_task_id": null,
      "title": "Design homepage mockup",
      "description": "Create high-fidelity mockup for homepage",
      "status": "en_progreso",
      "priority": "high",
      "start_date": "2025-11-05",
      "end_date": "2025-11-12",
      "estimated_hours": 40,
      "actual_hours": 25.5,
      "completion_percentage": 60,
      "assigned_users": [
        {
          "id": "uuid",
          "full_name": "John Doe"
        }
      ],
      "sub_task_count": 3,
      "created_by": {
        "id": "uuid",
        "full_name": "Jane Master"
      },
      "created_at": "2025-11-02T10:00:00.000Z",
      "updated_at": "2025-11-04T14:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 250,
    "total_pages": 5
  }
}
```

---

### POST /api/v1/tasks

Create a new task.

**Authentication**: Required  
**Authorization**: Master role only

**Request Body**:
```json
{
  "project_id": "uuid",
  "parent_task_id": null,
  "title": "Implement user authentication",
  "description": "Implement JWT-based authentication system",
  "priority": "critical",
  "start_date": "2025-11-10",
  "end_date": "2025-11-20",
  "estimated_hours": 60,
  "assigned_user_ids": ["uuid1", "uuid2"]
}
```

**Request Schema**:
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| project_id | UUID | Yes | Must exist |
| parent_task_id | UUID | No | Must exist (for sub-tasks) |
| title | string | Yes | 3-255 chars |
| description | string | No | 0-5000 chars |
| priority | enum | No | low, medium, high, critical (default: medium) |
| start_date | string | No | ISO date |
| end_date | string | No | ISO date, >= start_date |
| estimated_hours | number | No | Positive decimal |
| assigned_user_ids | array[UUID] | No | Users must be assigned to project |

**Response 201 Created**: (Similar to GET /api/v1/tasks/:id)

---

### GET /api/v1/tasks/:id

Get task details by ID.

**Authentication**: Required  
**Authorization**: Master users or users assigned to task

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "project": {
      "id": "uuid",
      "name": "Website Redesign"
    },
    "parent_task_id": null,
    "title": "Design homepage mockup",
    "description": "Create high-fidelity mockup for homepage with all sections",
    "status": "en_progreso",
    "priority": "high",
    "start_date": "2025-11-05",
    "end_date": "2025-11-12",
    "estimated_hours": 40,
    "actual_hours": 25.5,
    "completion_percentage": 60,
    "assigned_users": [
      {
        "id": "uuid",
        "full_name": "John Doe",
        "email": "john@example.com",
        "assigned_at": "2025-11-02T12:00:00.000Z"
      }
    ],
    "sub_tasks": [
      {
        "id": "uuid",
        "title": "Design header section",
        "status": "completada",
        "assigned_users": ["John Doe"]
      }
    ],
    "time_entries": [
      {
        "id": "uuid",
        "user": "John Doe",
        "hours_worked": 8.5,
        "work_date": "2025-11-05",
        "description": "Worked on header and hero section"
      }
    ],
    "created_by": {
      "id": "uuid",
      "full_name": "Jane Master"
    },
    "created_at": "2025-11-02T10:00:00.000Z",
    "updated_at": "2025-11-04T14:30:00.000Z",
    "completed_at": null
  }
}
```

---

### PATCH /api/v1/tasks/:id/status

Update task status.

**Authentication**: Required  
**Authorization**: 
- Master users: Can update any task
- Regular users: Can update only assigned tasks

**Request Body**:
```json
{
  "status": "en_progreso"
}
```

**Valid Status Transitions**:
- not_started → iniciada
- iniciada → en_progreso
- en_progreso → completada
- Any → blocked
- Any → cancelled

**Response 200 OK**: (Same as GET /api/v1/tasks/:id)

**Response 400 Bad Request**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "message": "Cannot transition from 'completada' to 'iniciada'"
  }
}
```

---

### PUT /api/v1/tasks/:id

Update task details (master only).

**Authentication**: Required  
**Authorization**: Master role only

**Request Body** (all fields optional):
```json
{
  "title": "Updated task title",
  "description": "Updated description",
  "priority": "critical",
  "start_date": "2025-11-10",
  "end_date": "2025-11-20",
  "estimated_hours": 50
}
```

**Response 200 OK**: (Same as GET /api/v1/tasks/:id)

---

### DELETE /api/v1/tasks/:id

Delete a task.

**Authentication**: Required  
**Authorization**: Master role only

**Business Rule**: Cannot delete task with sub-tasks (delete sub-tasks first)

**Response 204 No Content**: (Empty body)

---

### POST /api/v1/tasks/:id/assign-user

Assign a user to a task.

**Authentication**: Required  
**Authorization**: Master role only

**Request Body**:
```json
{
  "user_id": "uuid"
}
```

**Validation**: User must be assigned to parent project

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "task_id": "uuid",
    "user_id": "uuid",
    "assigned_by": "uuid",
    "assigned_at": "2025-11-04T17:00:00.000Z"
  },
  "message": "User assigned to task successfully"
}
```

---

## Dashboard Endpoints

### GET /api/v1/dashboard/master

Get master user dashboard data (all projects overview).

**Authentication**: Required  
**Authorization**: Master role only

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_projects": 25,
      "active_projects": 18,
      "total_tasks": 350,
      "tasks_at_risk": 12,
      "tasks_overdue": 5
    },
    "projects": [
      {
        "id": "uuid",
        "name": "Website Redesign",
        "status": "active",
        "task_summary": {
          "total": 15,
          "not_started": 2,
          "iniciada": 3,
          "en_progreso": 7,
          "completada": 3
        },
        "tasks": [
          {
            "id": "uuid",
            "title": "Design homepage",
            "status": "en_progreso",
            "priority": "high",
            "end_date": "2025-11-12",
            "assigned_users": ["John Doe"]
          }
        ]
      }
    ],
    "at_risk_tasks": [
      {
        "id": "uuid",
        "title": "Implement API endpoints",
        "project_name": "Mobile App",
        "status": "not_started",
        "end_date": "2025-11-15",
        "days_remaining": 3,
        "risk_level": "high"
      }
    ],
    "recent_deadline_requests": [
      {
        "id": "uuid",
        "task_title": "Database migration",
        "requested_by": "John Doe",
        "current_deadline": "2025-11-10",
        "requested_deadline": "2025-11-17",
        "status": "pending",
        "created_at": "2025-11-04T10:00:00.000Z"
      }
    ]
  }
}
```

---

### GET /api/v1/dashboard/user

Get regular user dashboard data (assigned tasks with calendar view).

**Authentication**: Required  
**Authorization**: User role (or master viewing as user)

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| month | integer | current | Month for calendar (1-12) |
| year | integer | current | Year for calendar |

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "assigned_tasks": 8,
      "tasks_due_soon": 2,
      "completed_this_week": 3,
      "total_hours_logged": 42.5
    },
    "calendar_tasks": [
      {
        "date": "2025-11-05",
        "tasks": [
          {
            "id": "uuid",
            "title": "Design homepage",
            "project_name": "Website Redesign",
            "status": "en_progreso",
            "priority": "high",
            "is_start_date": true,
            "is_end_date": false
          }
        ]
      }
    ],
    "upcoming_tasks": [
      {
        "id": "uuid",
        "title": "Review UI components",
        "project_name": "Mobile App",
        "status": "not_started",
        "priority": "medium",
        "end_date": "2025-11-06",
        "days_remaining": 2
      }
    ],
    "my_projects": [
      {
        "id": "uuid",
        "name": "Website Redesign",
        "task_count": 5
      }
    ]
  }
}
```

---

## Deadline Request Endpoints

### POST /api/v1/deadline-requests

Submit a deadline extension request.

**Authentication**: Required  
**Authorization**: User role (assigned to task) or Master

**Request Body**:
```json
{
  "task_id": "uuid",
  "requested_deadline": "2025-11-25",
  "reason": "Additional requirements discovered during implementation. Need 5 more days for thorough testing."
}
```

**Request Schema**:
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| task_id | UUID | Yes | Must exist, user must be assigned |
| requested_deadline | string | Yes | ISO date, > current end_date |
| reason | string | Yes | 10-1000 chars |

**Response 201 Created**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "task": {
      "id": "uuid",
      "title": "Implement authentication",
      "current_deadline": "2025-11-20"
    },
    "requested_by": {
      "id": "uuid",
      "full_name": "John Doe"
    },
    "requested_deadline": "2025-11-25",
    "reason": "Additional requirements discovered...",
    "status": "pending",
    "created_at": "2025-11-04T17:30:00.000Z"
  },
  "message": "Deadline extension request submitted successfully"
}
```

---

### GET /api/v1/deadline-requests

List deadline extension requests.

**Authentication**: Required

**Authorization**:
- Master users: See all pending requests
- Regular users: See only their own requests

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | enum | pending | Filter: pending, approved, denied, all |
| task_id | UUID | null | Filter by specific task |

**Response 200 OK**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "task": {
        "id": "uuid",
        "title": "Implement authentication",
        "project_name": "Website Redesign"
      },
      "requested_by": {
        "id": "uuid",
        "full_name": "John Doe",
        "email": "john@example.com"
      },
      "current_deadline": "2025-11-20",
      "requested_deadline": "2025-11-25",
      "reason": "Additional requirements discovered...",
      "status": "pending",
      "reviewed_by": null,
      "reviewed_at": null,
      "review_notes": null,
      "created_at": "2025-11-04T17:30:00.000Z"
    }
  ]
}
```

---

### PATCH /api/v1/deadline-requests/:id/approve

Approve a deadline extension request.

**Authentication**: Required  
**Authorization**: Master role only

**Request Body**:
```json
{
  "review_notes": "Approved due to scope change. Make sure to update project timeline."
}
```

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "approved",
    "reviewed_by": {
      "id": "uuid",
      "full_name": "Jane Master"
    },
    "reviewed_at": "2025-11-04T18:00:00.000Z",
    "review_notes": "Approved due to scope change...",
    "task_updated": true,
    "new_task_deadline": "2025-11-25"
  },
  "message": "Deadline extension approved. Task deadline updated."
}
```

---

### PATCH /api/v1/deadline-requests/:id/deny

Deny a deadline extension request.

**Authentication**: Required  
**Authorization**: Master role only

**Request Body**:
```json
{
  "review_notes": "Cannot extend deadline. Client demo scheduled on original date."
}
```

**Response 200 OK**: (Similar structure to approve response)

---

## Time Tracking Endpoints

### POST /api/v1/time-entries

Log time spent on a task.

**Authentication**: Required  
**Authorization**: User must be assigned to task

**Request Body**:
```json
{
  "task_id": "uuid",
  "hours_worked": 7.5,
  "work_date": "2025-11-04",
  "description": "Implemented login form and validation"
}
```

**Request Schema**:
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| task_id | UUID | Yes | Must exist, user must be assigned |
| hours_worked | number | Yes | 0.01 to 24 |
| work_date | string | Yes | ISO date, not in future |
| description | string | No | 0-500 chars |

**Response 201 Created**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "task": {
      "id": "uuid",
      "title": "Implement authentication",
      "actual_hours_total": 33.0
    },
    "user": {
      "id": "uuid",
      "full_name": "John Doe"
    },
    "hours_worked": 7.5,
    "work_date": "2025-11-04",
    "description": "Implemented login form and validation",
    "created_at": "2025-11-04T18:30:00.000Z"
  },
  "message": "Time entry logged successfully"
}
```

---

### GET /api/v1/time-entries

List time entries.

**Authentication**: Required

**Authorization**:
- Master users: See all time entries
- Regular users: See only their own entries

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|------------|
| task_id | UUID | null | Filter by task |
| user_id | UUID | null | Filter by user (master only) |
| work_date_from | string | null | Filter from date |
| work_date_to | string | null | Filter to date |
| limit | integer | 50 | Items per page |

**Response 200 OK**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "task": {
        "id": "uuid",
        "title": "Implement authentication",
        "project_name": "Website Redesign"
      },
      "user": {
        "id": "uuid",
        "full_name": "John Doe"
      },
      "hours_worked": 7.5,
      "work_date": "2025-11-04",
      "description": "Implemented login form and validation",
      "created_at": "2025-11-04T18:30:00.000Z"
    }
  ],
  "meta": {
    "total_hours": 42.5,
    "entry_count": 8
  }
}
```

---

### DELETE /api/v1/time-entries/:id

Delete a time entry (if mistakes were made).

**Authentication**: Required  
**Authorization**: Entry owner or Master

**Response 204 No Content**: (Empty body)

---

## Notification Endpoints

### GET /api/v1/notifications

List user notifications.

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|------------|
| is_read | boolean | null | Filter: true (read), false (unread), null (all) |
| type | enum | null | Filter by notification type |
| limit | integer | 50 | Items per page |

**Response 200 OK**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "task_assigned",
      "title": "New task assigned",
      "message": "You have been assigned to task 'Implement authentication'",
      "related_task": {
        "id": "uuid",
        "title": "Implement authentication"
      },
      "related_project": {
        "id": "uuid",
        "name": "Website Redesign"
      },
      "is_read": false,
      "created_at": "2025-11-04T12:00:00.000Z"
    }
  ],
  "meta": {
    "unread_count": 3,
    "total": 25
  }
}
```

---

### PATCH /api/v1/notifications/:id/read

Mark notification as read.

**Authentication**: Required  
**Authorization**: Notification owner only

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "is_read": true
  },
  "message": "Notification marked as read"
}
```

---

### POST /api/v1/notifications/mark-all-read

Mark all user notifications as read.

**Authentication**: Required

**Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "marked_read_count": 8
  },
  "message": "All notifications marked as read"
}
```

---

## Common Schemas

### Standard Response Envelope

All API responses follow this structure:

**Success Response**:
```json
{
  "success": true,
  "data": { /* Response data */ },
  "message": "Optional success message",
  "meta": { /* Optional metadata (pagination, counts) */ }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [ /* Optional array of field-specific errors */ ]
  }
}
```

### Pagination Metadata

```json
{
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 250,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## Error Codes

### Authentication Errors (401)
- `INVALID_CREDENTIALS`: Invalid email or password
- `INVALID_TOKEN`: Access token is invalid or malformed
- `TOKEN_EXPIRED`: Access token has expired
- `INVALID_REFRESH_TOKEN`: Refresh token is invalid, expired, or revoked

### Authorization Errors (403)
- `INSUFFICIENT_PERMISSIONS`: User role lacks required permissions
- `ACCESS_DENIED`: User does not have access to this resource

### Validation Errors (400)
- `VALIDATION_ERROR`: Input validation failed (see details array)
- `INVALID_STATUS_TRANSITION`: Status change not allowed
- `PROJECT_HAS_ACTIVE_TASKS`: Cannot delete project with active tasks
- `TASK_HAS_SUBTASKS`: Cannot delete task with sub-tasks
- `USER_NOT_ASSIGNED_TO_PROJECT`: User must be assigned to project first

### Not Found Errors (404)
- `PROJECT_NOT_FOUND`: Project does not exist
- `TASK_NOT_FOUND`: Task does not exist
- `USER_NOT_FOUND`: User does not exist
- `NOTIFICATION_NOT_FOUND`: Notification does not exist

### Rate Limiting (429)
- `RATE_LIMIT_EXCEEDED`: Too many requests

### Server Errors (500)
- `INTERNAL_SERVER_ERROR`: Unexpected server error
- `DATABASE_ERROR`: Database operation failed

---

## Authentication

All protected endpoints require JWT access token in one of:

1. **Cookie** (preferred): `access_token` HttpOnly cookie
2. **Header**: `Authorization: Bearer <token>`

Example:
```http
GET /api/v1/projects
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Or (automatic with cookie):
```http
GET /api/v1/projects
Cookie: access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Rate Limiting

- **Login endpoint**: 5 requests per 15 minutes per IP
- **All other endpoints**: 100 requests per 15 minutes per authenticated user

Rate limit headers included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1730729400
```

---

## CORS Policy

- **Allowed Origins**: Configured via `CORS_ORIGIN` environment variable
- **Allowed Methods**: GET, POST, PUT, PATCH, DELETE, OPTIONS
- **Allowed Headers**: Content-Type, Authorization
- **Credentials**: Allowed (for cookies)

---

## Endpoint Summary Table

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | /api/v1/auth/register | No | - | Register new user |
| POST | /api/v1/auth/login | No | - | Login and get tokens |
| POST | /api/v1/auth/refresh | Yes (Refresh) | - | Refresh access token |
| POST | /api/v1/auth/logout | Yes | - | Logout and invalidate tokens |
| GET | /api/v1/auth/me | Yes | - | Get current user profile |
| GET | /api/v1/projects | Yes | Both | List accessible projects |
| POST | /api/v1/projects | Yes | Master | Create project |
| GET | /api/v1/projects/:id | Yes | Both | Get project details |
| PUT | /api/v1/projects/:id | Yes | Master | Update project |
| DELETE | /api/v1/projects/:id | Yes | Master | Delete project |
| POST | /api/v1/projects/:id/assign-user | Yes | Master | Assign user to project |
| DELETE | /api/v1/projects/:id/unassign-user/:userId | Yes | Master | Remove user from project |
| GET | /api/v1/tasks | Yes | Both | List accessible tasks |
| POST | /api/v1/tasks | Yes | Master | Create task |
| GET | /api/v1/tasks/:id | Yes | Both | Get task details |
| PUT | /api/v1/tasks/:id | Yes | Master | Update task |
| DELETE | /api/v1/tasks/:id | Yes | Master | Delete task |
| PATCH | /api/v1/tasks/:id/status | Yes | Both | Update task status |
| POST | /api/v1/tasks/:id/assign-user | Yes | Master | Assign user to task |
| GET | /api/v1/dashboard/master | Yes | Master | Get master dashboard |
| GET | /api/v1/dashboard/user | Yes | Both | Get user dashboard |
| POST | /api/v1/deadline-requests | Yes | Both | Submit deadline request |
| GET | /api/v1/deadline-requests | Yes | Both | List deadline requests |
| PATCH | /api/v1/deadline-requests/:id/approve | Yes | Master | Approve deadline request |
| PATCH | /api/v1/deadline-requests/:id/deny | Yes | Master | Deny deadline request |
| POST | /api/v1/time-entries | Yes | Both | Log time entry |
| GET | /api/v1/time-entries | Yes | Both | List time entries |
| DELETE | /api/v1/time-entries/:id | Yes | Both | Delete time entry |
| GET | /api/v1/notifications | Yes | Both | List notifications |
| PATCH | /api/v1/notifications/:id/read | Yes | Both | Mark notification as read |
| POST | /api/v1/notifications/mark-all-read | Yes | Both | Mark all as read |

**Total Endpoints**: 32 REST endpoints

---

## Health Check Endpoints

### GET /health

System health check (no authentication required).

**Response 200 OK**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-04T19:00:00.000Z",
  "uptime": 86400,
  "services": {
    "database": "healthy",
    "api": "healthy"
  }
}
```

### GET /ready

Readiness check for container orchestration.

**Response 200 OK**: Service ready to accept traffic  
**Response 503 Service Unavailable**: Service not ready

---

**API Contract Version**: 1.0.0  
**Last Updated**: 2025-11-04  
**OpenAPI Spec**: Available at `/api/docs` (Swagger UI) when deployed
