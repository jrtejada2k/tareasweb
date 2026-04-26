/**
 * Deadline Request Routes
 * 
 * Defines API routes for deadline extension requests
 */

import { Router } from 'express';
import * as deadlineController from '@controllers/deadlineController';
import { requireAuth } from '@middleware/authMiddleware';
import { requireMaster } from '@middleware/rbacMiddleware';
import { validateRequest } from '@middleware/validationMiddleware';
import {
  createDeadlineRequestSchema,
  reviewDeadlineRequestSchema,
  getDeadlineRequestsSchema,
} from '@utils/validation';

const router = Router();

/**
 * POST /api/v1/deadline-requests
 * Create a new deadline extension request
 * Access: Authenticated users (must be assigned to task)
 */
router.post(
  '/',
  requireAuth,
  validateRequest({ body: createDeadlineRequestSchema }),
  deadlineController.createRequest
);

/**
 * GET /api/v1/deadline-requests
 * Get deadline requests (filtered by role)
 * Access: Authenticated users (masters see all, users see own)
 */
router.get(
  '/',
  requireAuth,
  validateRequest({ query: getDeadlineRequestsSchema }),
  deadlineController.getRequests
);

/**
 * GET /api/v1/deadline-requests/:id
 * Get a single deadline request by ID
 * Access: Authenticated users (masters see all, users see own)
 */
router.get(
  '/:id',
  requireAuth,
  deadlineController.getRequestById
);

/**
 * PATCH /api/v1/deadline-requests/:id/approve
 * Approve a deadline extension request
 * Access: Master users only
 */
router.patch(
  '/:id/approve',
  requireAuth,
  requireMaster,
  validateRequest({ body: reviewDeadlineRequestSchema }),
  deadlineController.approveRequest
);

/**
 * PATCH /api/v1/deadline-requests/:id/deny
 * Deny a deadline extension request
 * Access: Master users only
 */
router.patch(
  '/:id/deny',
  requireAuth,
  requireMaster,
  validateRequest({ body: reviewDeadlineRequestSchema }),
  deadlineController.denyRequest
);

export default router;
