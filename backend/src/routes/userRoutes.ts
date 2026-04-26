/**
 * User Routes
 * 
 * Routes for user management
 */

import { Router } from 'express';
import * as userController from '@controllers/userController';
import { requireAuth } from '@middleware/authMiddleware';
import { requireMaster } from '@middleware/rbacMiddleware';

const router = Router();

/**
 * @route   GET /api/v1/users
 * @desc    Get all users (master only, for assignments)
 * @access  Master
 */
router.get('/', requireAuth, requireMaster, userController.getAllUsers);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Master
 */
router.get('/:id', requireAuth, requireMaster, userController.getUserById);

export default router;
