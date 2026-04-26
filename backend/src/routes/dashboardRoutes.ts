/**
 * Dashboard Routes
 * 
 * Defines all dashboard-related endpoints
 */

import { Router } from 'express';
import { getMasterDashboard, getUserDashboard } from '@controllers/dashboardController';
import { requireAuth } from '@middleware/authMiddleware';
import { requireMaster } from '@middleware/rbacMiddleware';
import { validateQuery } from '@middleware/validationMiddleware';
import { dashboardQuerySchema } from '@utils/validation';

const router = Router();

/**
 * GET /api/v1/dashboard/master
 * Get master dashboard with all projects and statistics
 * Requires: master role
 */
router.get('/master', requireAuth, requireMaster, getMasterDashboard);

/**
 * GET /api/v1/dashboard/user
 * Get user dashboard with calendar tasks and upcoming tasks
 * Query params: month (1-12), year (2000-2100)
 * Requires: authentication (any user)
 */
router.get('/user', requireAuth, validateQuery(dashboardQuerySchema), getUserDashboard);

export default router;
