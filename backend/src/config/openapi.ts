/**
 * OpenAPI 3.0 Specification
 * 
 * Auto-generated API documentation for TareasWeb REST API
 * Accessible via Swagger UI at /api/docs
 * 
 * Requirements:
 * - FR-149: Complete OpenAPI 3.0 specification
 * - FR-150: Swagger UI interface
 * - FR-151: Request/response schemas
 * - FR-152: Authentication documentation
 * - FR-153: Error response examples
 */

import { OpenAPIV3 } from 'openapi-types';

export const openApiSpec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'TareasWeb API',
    version: '1.0.0',
    description: `
# TareasWeb Authentication & Task Management System

RESTful API for authentication, project management, task tracking, and team collaboration.

## Features
- JWT-based authentication with HttpOnly cookies
- Role-based access control (Master and User roles)
- Project and task management with hierarchy
- Status updates, deadline requests, and time tracking
- Dashboard analytics and real-time notifications
- Email alerts and monitoring

## Authentication
All protected endpoints require a valid JWT access token sent as an HttpOnly cookie.
Use the \`/api/v1/auth/login\` endpoint to obtain tokens.

## Error Handling
All errors follow a consistent format with \`success: false\` and \`error\` object containing:
- \`code\`: Machine-readable error code
- \`message\`: Human-readable error description
- \`details\`: Optional additional error context
    `,
    contact: {
      name: 'TareasWeb Team',
      email: 'support@tareasweb.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
    {
      url: 'https://api.tareasweb.com',
      description: 'Production server',
    },
  ],
  tags: [
    { name: 'Authentication', description: 'User authentication and session management' },
    { name: 'Projects', description: 'Project creation and management' },
    { name: 'Tasks', description: 'Task CRUD operations and hierarchy' },
    { name: 'Assignments', description: 'User-to-project and user-to-task assignments' },
    { name: 'Status Updates', description: 'Task status change tracking' },
    { name: 'Deadline Requests', description: 'Deadline extension requests and approvals' },
    { name: 'Time Tracking', description: 'Time entry logging and reporting' },
    { name: 'Dashboard', description: 'Analytics and reporting endpoints' },
    { name: 'Alerts', description: 'System notifications and email alerts' },
    { name: 'Health', description: 'Service health checks' },
  ],
  paths: {
    '/api/health': {
      get: {
        summary: 'Health check endpoint',
        description: 'Check if the API and database are operational',
        tags: ['Health'],
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                    uptime: { type: 'number', example: 3600 },
                    database: { type: 'string', example: 'connected' },
                  },
                },
              },
            },
          },
          '503': {
            description: 'Service unavailable',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/register': {
      post: {
        summary: 'Register new user',
        description: 'Create a new user account with email and password',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  success: false,
                  error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: { email: 'Invalid email format' },
                  },
                },
              },
            },
          },
          '409': {
            description: 'Email already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        summary: 'User login',
        description: 'Authenticate user and receive JWT tokens in HttpOnly cookies',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            headers: {
              'Set-Cookie': {
                description: 'JWT access and refresh tokens',
                schema: {
                  type: 'string',
                  example: 'accessToken=eyJhbGc...; HttpOnly; Secure; SameSite=Strict',
                },
              },
            },
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/logout': {
      post: {
        summary: 'User logout',
        description: 'Invalidate refresh token and clear cookies',
        tags: ['Authentication'],
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Logout successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Logged out successfully' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/refresh': {
      post: {
        summary: 'Refresh access token',
        description: 'Use refresh token to obtain new access token',
        tags: ['Authentication'],
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Token refreshed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Token refreshed' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Invalid or expired refresh token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/projects': {
      get: {
        summary: 'List projects',
        description: 'Get all projects (master) or assigned projects (user)',
        tags: ['Projects'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['active', 'completed', 'on_hold', 'cancelled'] },
            description: 'Filter by project status',
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
        ],
        responses: {
          '200': {
            description: 'Projects retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    projects: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Project' },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create project',
        description: 'Create a new project (master only)',
        tags: ['Projects'],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateProjectRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Project created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    project: { $ref: '#/components/schemas/Project' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/projects/{id}': {
      get: {
        summary: 'Get project by ID',
        tags: ['Projects'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Project details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    project: { $ref: '#/components/schemas/Project' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        summary: 'Update project',
        description: 'Update project details (master only)',
        tags: ['Projects'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProjectRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Project updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    project: { $ref: '#/components/schemas/Project' },
                  },
                },
              },
            },
          },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        summary: 'Delete project',
        description: 'Delete project (master only)',
        tags: ['Projects'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Project deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Project deleted successfully' },
                  },
                },
              },
            },
          },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/v1/projects/{id}/assign': {
      post: {
        summary: 'Assign user to project',
        description: 'Assign a user to a project (master only)',
        tags: ['Assignments'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['user_id'],
                properties: {
                  user_id: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'User assigned to project',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User assigned successfully' },
                  },
                },
              },
            },
          },
          '409': {
            description: 'User already assigned',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/tasks': {
      get: {
        summary: 'List tasks',
        description: 'Get all tasks (master) or assigned tasks (user) with filtering',
        tags: ['Tasks'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'project_id',
            in: 'query',
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled'] },
          },
          {
            name: 'priority',
            in: 'query',
            schema: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          },
          {
            name: 'assigned_to',
            in: 'query',
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'start_date_from',
            in: 'query',
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'start_date_to',
            in: 'query',
            schema: { type: 'string', format: 'date' },
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
        ],
        responses: {
          '200': {
            description: 'Tasks retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    tasks: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Task' },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create task',
        description: 'Create a new task (master only)',
        tags: ['Tasks'],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateTaskRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Task created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    task: { $ref: '#/components/schemas/Task' },
                  },
                },
              },
            },
          },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/tasks/{id}': {
      get: {
        summary: 'Get task by ID',
        tags: ['Tasks'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Task details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    task: { $ref: '#/components/schemas/Task' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        summary: 'Update task',
        description: 'Update task details (master only)',
        tags: ['Tasks'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateTaskRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Task updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    task: { $ref: '#/components/schemas/Task' },
                  },
                },
              },
            },
          },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      delete: {
        summary: 'Delete task',
        tags: ['Tasks'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Task deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Task deleted successfully' },
                  },
                },
              },
            },
          },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/v1/tasks/{id}/status': {
      patch: {
        summary: 'Update task status',
        description: 'Update task status (assigned users only)',
        tags: ['Status Updates'],
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
                  },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Status updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    task: { $ref: '#/components/schemas/Task' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid status transition',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/dashboard/summary': {
      get: {
        summary: 'Dashboard summary',
        description: 'Get dashboard statistics and metrics',
        tags: ['Dashboard'],
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'Dashboard data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    summary: {
                      type: 'object',
                      properties: {
                        total_projects: { type: 'integer' },
                        active_projects: { type: 'integer' },
                        total_tasks: { type: 'integer' },
                        pending_tasks: { type: 'integer' },
                        in_progress_tasks: { type: 'integer' },
                        completed_tasks: { type: 'integer' },
                        overdue_tasks: { type: 'integer' },
                        my_tasks: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'accessToken',
        description: 'JWT access token stored in HttpOnly cookie',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          full_name: { type: 'string' },
          role: { type: 'string', enum: ['master', 'user'] },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['active', 'completed', 'on_hold', 'cancelled'] },
          created_by: { type: 'string', format: 'uuid' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          project_id: { type: 'string', format: 'uuid' },
          parent_id: { type: 'string', format: 'uuid', nullable: true },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          start_date: { type: 'string', format: 'date', nullable: true },
          end_date: { type: 'string', format: 'date', nullable: true },
          created_by: { type: 'string', format: 'uuid' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'full_name'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', minLength: 8, example: 'SecurePass123!' },
          full_name: { type: 'string', example: 'John Doe' },
          role: { type: 'string', enum: ['master', 'user'], default: 'user' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', example: 'SecurePass123!' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          user: { $ref: '#/components/schemas/User' },
          message: { type: 'string', example: 'Login successful' },
        },
      },
      CreateProjectRequest: {
        type: 'object',
        required: ['name', 'status'],
        properties: {
          name: { type: 'string', example: 'New Marketing Campaign' },
          description: { type: 'string', example: 'Q1 2025 marketing initiatives' },
          status: { type: 'string', enum: ['active', 'on_hold'], default: 'active' },
        },
      },
      UpdateProjectRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['active', 'completed', 'on_hold', 'cancelled'] },
        },
      },
      CreateTaskRequest: {
        type: 'object',
        required: ['project_id', 'title', 'status'],
        properties: {
          project_id: { type: 'string', format: 'uuid' },
          parent_id: { type: 'string', format: 'uuid', nullable: true },
          title: { type: 'string', example: 'Design landing page' },
          description: { type: 'string', example: 'Create wireframes and mockups' },
          status: { type: 'string', enum: ['pending', 'in_progress'], default: 'pending' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
          start_date: { type: 'string', format: 'date' },
          end_date: { type: 'string', format: 'date' },
        },
      },
      UpdateTaskRequest: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          start_date: { type: 'string', format: 'date' },
          end_date: { type: 'string', format: 'date' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Invalid input data' },
              details: { type: 'object' },
            },
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 150 },
          total_pages: { type: 'integer', example: 8 },
        },
      },
    },
    responses: {
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      Forbidden: {
        description: 'Forbidden - Insufficient permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'You do not have permission to perform this action',
              },
            },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              error: {
                code: 'NOT_FOUND',
                message: 'Resource not found',
              },
            },
          },
        },
      },
    },
  },
};
