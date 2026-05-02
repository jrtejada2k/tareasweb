/**
 * Task Routes
 * 
 * Defines all task-related endpoints
 */

import { Router } from 'express';
import {
  create,
  update,
  remove,
  getById,
  list,
  updateStatus,
  assignUser,
  unassignUser,
  getAssignedUsers,
} from '@controllers/taskController';
import { requireAuth } from '@middleware/authMiddleware';
import { requireMaster } from '@middleware/rbacMiddleware';
import { validateBody, validateParams, validateQuery } from '@middleware/validationMiddleware';
import { taskQuerySchema } from '@utils/validation';
import Joi from 'joi';

const router = Router();

// Validation schemas
const createTaskSchema = Joi.object({
  project_id: Joi.string().uuid().required(),
  parent_task_id: Joi.string().uuid().allow(null).optional(),
  title: Joi.string().trim().min(3).max(255).required(),
  description: Joi.string().allow('', null).max(5000).optional(),
  status: Joi.string().valid('not_started', 'iniciada', 'en_progreso', 'completada', 'blocked', 'cancelled').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).optional(),
  estimated_hours: Joi.number().min(0).max(10000).optional(),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().trim().min(3).max(255).optional(),
  description: Joi.string().allow('', null).max(5000).optional(),
  status: Joi.string().valid('not_started', 'iniciada', 'en_progreso', 'completada', 'blocked', 'cancelled').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  start_date: Joi.date().iso().allow(null).optional(),
  end_date: Joi.date().iso().allow(null).optional(),
  estimated_hours: Joi.number().min(0).max(10000).allow(null).optional(),
  actual_hours: Joi.number().min(0).max(10000).allow(null).optional(),
  completion_percentage: Joi.number().min(0).max(100).optional(),
});

const taskIdSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('not_started', 'iniciada', 'en_progreso', 'completada', 'blocked', 'cancelled')
    .required(),
});

const assignUserSchema = Joi.object({
  userId: Joi.string().uuid().required(),
});

const unassignUserParamsSchema = Joi.object({
  id: Joi.string().uuid().required(),
  userId: Joi.string().uuid().required(),
});

/**
 * POST /api/v1/tasks
 * Create a new task
 * Requires: master role
 */
router.post('/', requireAuth, requireMaster, validateBody(createTaskSchema), create);

/**
 * GET /api/v1/tasks
 * List all tasks (filtered by assignments for regular users)
 * Query params: project_id, status, priority, assigned_user_id, assigned_to_me,
 *               start_date_from, start_date_to, end_date_from, end_date_to, search, page, limit
 * Requires: authentication
 */
router.get('/', requireAuth, validateQuery(taskQuerySchema), list);

/**
 * GET /api/v1/tasks/:id
 * Get task by ID
 * Requires: RBAC check (master or assigned user)
 */
router.get('/:id', requireAuth, validateParams(taskIdSchema), getById);

/**
 * PUT /api/v1/tasks/:id
 * Update a task
 * Requires: master role
 */
router.put(
  '/:id',
  requireAuth,
  requireMaster,
  validateParams(taskIdSchema),
  validateBody(updateTaskSchema),
  update
);

/**
 * PATCH /api/v1/tasks/:id/status
 * Update task status
 * Requires: master or assigned user
 */
router.patch(
  '/:id/status',
  requireAuth,
  validateParams(taskIdSchema),
  validateBody(updateStatusSchema),
  updateStatus
);

/**
 * DELETE /api/v1/tasks/:id
 * Delete a task
 * Requires: master role
 */
router.delete('/:id', requireAuth, requireMaster, validateParams(taskIdSchema), remove);

/**
 * POST /api/v1/tasks/:id/assign-user
 * Assign a user to a task
 * Requires: master role
 */
router.post(
  '/:id/assign-user',
  requireAuth,
  requireMaster,
  validateParams(taskIdSchema),
  validateBody(assignUserSchema),
  assignUser
);

/**
 * DELETE /api/v1/tasks/:id/unassign-user/:userId
 * Remove a user from a task
 * Requires: master role
 */
router.delete(
  '/:id/unassign-user/:userId',
  requireAuth,
  requireMaster,
  validateParams(unassignUserParamsSchema),
  unassignUser
);

/**
 * GET /api/v1/tasks/:id/users
 * Get all users assigned to a task
 * Requires: master or assigned user
 */
router.get(
  '/:id/users',
  requireAuth,
  validateParams(taskIdSchema),
  getAssignedUsers
);

export default router;
