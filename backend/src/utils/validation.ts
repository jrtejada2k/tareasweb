/**
 * Validation Schemas
 * 
 * Joi schemas for request validation
 */

import Joi from 'joi';

// Email validation
// Allow .local TLD for development/testing (admin@tareasweb.local)
const emailSchema = Joi.string()
  .email({ tlds: { allow: false } }) // Disable TLD validation to allow .local and other custom TLDs
  .trim()
  .lowercase()
  .max(255)
  .required()
  .messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email is required',
    'any.required': 'Email is required',
  });

// Password validation (min 8 chars, must include uppercase, lowercase, number, special char)
const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password must be less than 128 characters',
    'string.pattern.base':
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'string.empty': 'Password is required',
    'any.required': 'Password is required',
  });

// Full name validation
const fullNameSchema = Joi.string()
  .trim()
  .min(2)
  .max(255)
  .required()
  .messages({
    'string.min': 'Full name must be at least 2 characters long',
    'string.max': 'Full name must be less than 255 characters',
    'string.empty': 'Full name is required',
    'any.required': 'Full name is required',
  });

// Role validation (optional, defaults to "user")
const roleSchema = Joi.string()
  .valid('master', 'user')
  .default('user')
  .messages({
    'any.only': 'Role must be either "master" or "user"',
  });

/**
 * Register schema
 */
export const registerSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
  full_name: fullNameSchema,
  role: roleSchema, // optional; defaults to 'user'
});

/**
 * Login schema
 */
export const loginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
    'any.required': 'Password is required',
  }),
});

/**
 * Refresh token schema
 */
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().optional(), // Can come from cookie or body
});

/**
 * Update profile schema
 */
export const updateProfileSchema = Joi.object({
  full_name: Joi.string().trim().min(2).max(255).optional(),
  email: Joi.string().email().trim().lowercase().max(255).optional(),
});

/**
 * Change password schema
 */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Current password is required',
    'any.required': 'Current password is required',
  }),
  newPassword: passwordSchema,
});

/**
 * UUID validation schema
 */
export const uuidSchema = Joi.string()
  .uuid()
  .required()
  .messages({
    'string.guid': 'Invalid ID format',
    'any.required': 'ID is required',
  });

/**
 * Pagination schema
 */
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string()
    .valid('created_at', 'updated_at', 'email', 'full_name')
    .default('created_at'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
});

/**
 * Task status update schema
 */
export const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('not_started', 'iniciada', 'en_progreso', 'completada')
    .required()
    .messages({
      'any.required': 'Status is required',
      'any.only': 'Status must be one of: not_started, iniciada, en_progreso, completada',
    }),
});

/**
 * Valid task status transitions
 * Maps current status to array of allowed next statuses
 */
const STATUS_TRANSITIONS: Record<string, string[]> = {
  not_started: ['iniciada', 'completada'], // Can start or mark complete directly
  iniciada: ['en_progreso', 'completada', 'not_started'], // Can progress, complete, or reset
  en_progreso: ['completada', 'iniciada'], // Can complete or go back to iniciada
  completada: [], // Terminal state - no transitions allowed from completed
};

/**
 * Validates if a status transition is allowed
 * @param fromStatus Current status
 * @param toStatus Desired new status
 * @returns true if transition is valid, false otherwise
 */
export const isValidStatusTransition = (fromStatus: string, toStatus: string): boolean => {
  // Same status is always valid (no-op)
  if (fromStatus === toStatus) {
    return true;
  }

  // Check if transition is in the allowed list
  const allowedTransitions = STATUS_TRANSITIONS[fromStatus];
  
  if (!allowedTransitions) {
    return false;
  }

  return allowedTransitions.includes(toStatus);
};

/**
 * Get all valid next statuses for a given current status
 * @param currentStatus Current status
 * @returns Array of valid next statuses
 */
export const getValidNextStatuses = (currentStatus: string): string[] => {
  return STATUS_TRANSITIONS[currentStatus] || [];
};

/**
 * Task query parameters schema
 * For filtering tasks by dates, status, priority, etc.
 */
export const taskQuerySchema = Joi.object({
  project_id: Joi.string().uuid().optional(),
  parent_task_id: Joi.string().uuid().allow(null, '').optional(),
  status: Joi.string()
    .valid('not_started', 'iniciada', 'en_progreso', 'completada')
    .optional(),
  priority: Joi.string()
    .valid('low', 'medium', 'high', 'urgent')
    .optional(),
  assigned_user_id: Joi.string().uuid().optional(),
  assigned_to_me: Joi.string().valid('true', 'false').optional(),
  start_date_from: Joi.date().iso().optional()
    .messages({
      'date.format': 'start_date_from must be a valid ISO date',
      'date.base': 'start_date_from must be a valid date',
    }),
  start_date_to: Joi.date().iso().optional()
    .messages({
      'date.format': 'start_date_to must be a valid ISO date',
      'date.base': 'start_date_to must be a valid date',
    }),
  end_date_from: Joi.date().iso().optional()
    .messages({
      'date.format': 'end_date_from must be a valid ISO date',
      'date.base': 'end_date_from must be a valid date',
    }),
  end_date_to: Joi.date().iso().optional()
    .messages({
      'date.format': 'end_date_to must be a valid ISO date',
      'date.base': 'end_date_to must be a valid date',
    }),
  search: Joi.string().max(255).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

/**
 * Dashboard query parameters schema
 * For user dashboard calendar navigation
 */
export const dashboardQuerySchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).optional()
    .messages({
      'number.min': 'Month must be between 1 and 12',
      'number.max': 'Month must be between 1 and 12',
      'number.base': 'Month must be a valid number',
    }),
  year: Joi.number().integer().min(2000).max(2100).optional()
    .messages({
      'number.min': 'Year must be between 2000 and 2100',
      'number.max': 'Year must be between 2000 and 2100',
      'number.base': 'Year must be a valid number',
    }),
});

/**
 * Create deadline request schema
 */
export const createDeadlineRequestSchema = Joi.object({
  task_id: Joi.string().uuid().required()
    .messages({
      'string.guid': 'Task ID must be a valid UUID',
      'string.empty': 'Task ID is required',
      'any.required': 'Task ID is required',
    }),
  requested_deadline: Joi.date().iso().required()
    .messages({
      'date.format': 'Requested deadline must be a valid ISO date',
      'date.base': 'Requested deadline must be a valid date',
      'any.required': 'Requested deadline is required',
    }),
  reason: Joi.string().min(10).max(1000).required()
    .messages({
      'string.min': 'Reason must be at least 10 characters long',
      'string.max': 'Reason must be less than 1000 characters',
      'string.empty': 'Reason is required',
      'any.required': 'Reason is required',
    }),
});

/**
 * Review deadline request schema
 */
export const reviewDeadlineRequestSchema = Joi.object({
  review_notes: Joi.string().max(1000).optional().allow('', null)
    .messages({
      'string.max': 'Review notes must be less than 1000 characters',
    }),
});

/**
 * Get deadline requests query schema
 */
export const getDeadlineRequestsSchema = Joi.object({
  status: Joi.string().valid('pending', 'approved', 'denied').optional()
    .messages({
      'any.only': 'Status must be one of: pending, approved, denied',
    }),
  task_id: Joi.string().uuid().optional()
    .messages({
      'string.guid': 'Task ID must be a valid UUID',
    }),
  project_id: Joi.string().uuid().optional()
    .messages({
      'string.guid': 'Project ID must be a valid UUID',
    }),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

/**
 * Create time entry schema
 */
export const createTimeEntrySchema = Joi.object({
  task_id: Joi.string().uuid().required()
    .messages({
      'string.guid': 'Task ID must be a valid UUID',
      'string.empty': 'Task ID is required',
      'any.required': 'Task ID is required',
    }),
  hours_worked: Joi.number().min(0.01).max(24).required()
    .messages({
      'number.min': 'Hours worked must be at least 0.01',
      'number.max': 'Hours worked cannot exceed 24',
      'number.base': 'Hours worked must be a valid number',
      'any.required': 'Hours worked is required',
    }),
  work_date: Joi.date().iso().required()
    .messages({
      'date.format': 'Work date must be a valid ISO date',
      'date.base': 'Work date must be a valid date',
      'any.required': 'Work date is required',
    }),
  description: Joi.string().max(1000).optional().allow('', null)
    .messages({
      'string.max': 'Description must be less than 1000 characters',
    }),
});

/**
 * Get time entries query schema
 */
export const getTimeEntriesSchema = Joi.object({
  task_id: Joi.string().uuid().optional()
    .messages({
      'string.guid': 'Task ID must be a valid UUID',
    }),
  user_id: Joi.string().uuid().optional()
    .messages({
      'string.guid': 'User ID must be a valid UUID',
    }),
  project_id: Joi.string().uuid().optional()
    .messages({
      'string.guid': 'Project ID must be a valid UUID',
    }),
  work_date_from: Joi.date().iso().optional()
    .messages({
      'date.format': 'work_date_from must be a valid ISO date',
      'date.base': 'work_date_from must be a valid date',
    }),
  work_date_to: Joi.date().iso().optional()
    .messages({
      'date.format': 'work_date_to must be a valid ISO date',
      'date.base': 'work_date_to must be a valid date',
    }),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});
