/**
 * Project Routes
 * 
 * Defines all project-related endpoints
 */

import { Router } from 'express';
import {
  create,
  update,
  remove,
  getById,
  list,
  assignUser,
  unassignUser,
  getAssignedUsers,
} from '@controllers/projectController';
import { requireAuth } from '@middleware/authMiddleware';
import { requireMaster } from '@middleware/rbacMiddleware';
import { validateBody, validateParams } from '@middleware/validationMiddleware';
import Joi from 'joi';

const router = Router();

// Validation schemas
const createProjectSchema = Joi.object({
  name: Joi.string().trim().min(3).max(255).required(),
  description: Joi.string().allow('', null).max(2000).optional(),
  status: Joi.string().valid('active', 'archived', 'completed').optional(),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().optional(),
}).custom((value, helpers) => {
  if (value.start_date && value.end_date && new Date(value.end_date) < new Date(value.start_date)) {
    return helpers.error('any.invalid', { message: 'end_date must be on or after start_date' });
  }
  return value;
});

const updateProjectSchema = Joi.object({
  name: Joi.string().trim().min(3).max(255).optional(),
  description: Joi.string().allow('', null).max(2000).optional(),
  status: Joi.string().valid('active', 'archived', 'completed').optional(),
  start_date: Joi.date().iso().allow(null).optional(),
  end_date: Joi.date().iso().allow(null).optional(),
});

const projectIdSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

const assignUserSchema = Joi.object({
  userId: Joi.string().uuid().required(),
});

const unassignUserParamsSchema = Joi.object({
  id: Joi.string().uuid().required(),
  userId: Joi.string().uuid().required(),
});

/**
 * POST /api/v1/projects
 * Create a new project
 * Requires: master role
 */
router.post('/', requireAuth, requireMaster, validateBody(createProjectSchema), create);

/**
 * GET /api/v1/projects
 * List all projects (filtered by user assignments for regular users)
 * Requires: authentication
 */
router.get('/', requireAuth, list);

/**
 * GET /api/v1/projects/:id
 * Get project by ID
 * Requires: master or assigned user
 */
router.get('/:id', requireAuth, validateParams(projectIdSchema), getById);

/**
 * PUT /api/v1/projects/:id
 * Update a project
 * Requires: master role
 */
router.put(
  '/:id',
  requireAuth,
  requireMaster,
  validateParams(projectIdSchema),
  validateBody(updateProjectSchema),
  update
);

/**
 * DELETE /api/v1/projects/:id
 * Delete a project
 * Requires: master role
 */
router.delete('/:id', requireAuth, requireMaster, validateParams(projectIdSchema), remove);

/**
 * POST /api/v1/projects/:id/assign-user
 * Assign a user to a project
 * Requires: master role
 */
router.post(
  '/:id/assign-user',
  requireAuth,
  requireMaster,
  validateParams(projectIdSchema),
  validateBody(assignUserSchema),
  assignUser
);

/**
 * DELETE /api/v1/projects/:id/unassign-user/:userId
 * Remove a user from a project
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
 * GET /api/v1/projects/:id/users
 * Get all users assigned to a project
 * Requires: master or assigned user
 */
router.get(
  '/:id/users',
  requireAuth,
  validateParams(projectIdSchema),
  getAssignedUsers
);

export default router;
