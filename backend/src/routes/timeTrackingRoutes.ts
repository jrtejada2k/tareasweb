/**
 * Time Tracking Routes
 * 
 * Defines API routes for time entry logging
 */

import { Router } from 'express';
import * as timeTrackingController from '@controllers/timeTrackingController';
import { requireAuth } from '@middleware/authMiddleware';
import { validateRequest } from '@middleware/validationMiddleware';
import {
  createTimeEntrySchema,
  getTimeEntriesSchema,
} from '@utils/validation';

const router = Router();

/**
 * POST /api/v1/time-entries
 * Create a new time entry
 * Access: Authenticated users (must be assigned to task)
 */
router.post(
  '/',
  requireAuth,
  validateRequest({ body: createTimeEntrySchema }),
  timeTrackingController.createTimeEntry
);

/**
 * GET /api/v1/time-entries
 * Get time entries (filtered by role)
 * Access: Authenticated users (masters see all, users see own)
 */
router.get(
  '/',
  requireAuth,
  validateRequest({ query: getTimeEntriesSchema }),
  timeTrackingController.getTimeEntries
);

/**
 * GET /api/v1/time-entries/:id
 * Get a single time entry by ID
 * Access: Authenticated users (masters see all, users see own)
 */
router.get(
  '/:id',
  requireAuth,
  timeTrackingController.getTimeEntryById
);

/**
 * DELETE /api/v1/time-entries/:id
 * Delete a time entry
 * Access: Entry owner or master users
 */
router.delete(
  '/:id',
  requireAuth,
  timeTrackingController.deleteTimeEntry
);

/**
 * GET /api/v1/time-entries/task/:taskId/total
 * Get total hours logged for a task
 * Access: Authenticated users
 */
router.get(
  '/task/:taskId/total',
  requireAuth,
  timeTrackingController.getTaskTotalHours
);

export default router;
