/**
 * Deadline Request Controller
 * 
 * HTTP handlers for deadline extension request endpoints
 */

import { Request, Response, NextFunction } from 'express';
import * as deadlineService from '@services/deadlineService';
import logger from '@utils/logger';

/**
 * Create a new deadline extension request
 * POST /api/v1/deadline-requests
 */
export const createRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { task_id, requested_deadline, reason } = req.body;
    const userId = req.user?.userId!;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get current task deadline
    const { query } = require('@utils/database');
    const taskResult = await query(
      'SELECT end_date FROM tasks WHERE id = $1',
      [task_id]
    );

    if (taskResult.rows.length === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const currentDeadline = taskResult.rows[0]?.end_date;

    if (!currentDeadline) {
      res.status(400).json({ 
        error: 'Task does not have a deadline set',
        code: 'NO_DEADLINE' 
      });
      return;
    }

    const request = await deadlineService.createRequest({
      task_id,
      requested_by: userId,
      current_deadline: currentDeadline,
      requested_deadline: new Date(requested_deadline),
      reason,
    });

    logger.info('Deadline request created via API', {
      requestId: request.id,
      userId,
      taskId: task_id,
    });

    res.status(201).json({
      message: 'Deadline extension request created successfully',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get deadline requests
 * GET /api/v1/deadline-requests
 */
export const getRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId!;
    const userRole = req.user?.role!;

    if (!userId || !userRole) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 20;
    const status = req.query['status'] as 'pending' | 'approved' | 'denied' | undefined;
    const taskId = req.query['task_id'] as string | undefined;
    const projectId = req.query['project_id'] as string | undefined;

    const result = await deadlineService.getRequests(
      userId,
      userRole,
      { status, task_id: taskId, project_id: projectId },
      { page, limit }
    );

    res.json({
      message: 'Deadline requests retrieved successfully',
      data: result.requests,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single deadline request by ID
 * GET /api/v1/deadline-requests/:id
 */
export const getRequestById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params; if (!id) { res.status(400).json({ error: 'Invalid ID' }); return; }
    const userId = req.user?.userId!;
    const userRole = req.user?.role!;

    if (!userId || !userRole) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const request = await deadlineService.getRequestById(id, userId, userRole);

    res.json({
      message: 'Deadline request retrieved successfully',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a deadline extension request
 * PATCH /api/v1/deadline-requests/:id/approve
 */
export const approveRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params; if (!id) { res.status(400).json({ error: 'Invalid ID' }); return; }
    const { review_notes } = req.body;
    const userId = req.user?.userId!;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const request = await deadlineService.approveRequest(id, {
      reviewed_by: userId,
      review_notes,
    });

    logger.info('Deadline request approved via API', {
      requestId: id,
      reviewedBy: userId,
    });

    res.json({
      message: 'Deadline extension request approved successfully',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deny a deadline extension request
 * PATCH /api/v1/deadline-requests/:id/deny
 */
export const denyRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params; if (!id) { res.status(400).json({ error: 'Invalid ID' }); return; }
    const { review_notes } = req.body;
    const userId = req.user?.userId!;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const request = await deadlineService.denyRequest(id, {
      reviewed_by: userId,
      review_notes,
    });

    logger.info('Deadline request denied via API', {
      requestId: id,
      reviewedBy: userId,
    });

    res.json({
      message: 'Deadline extension request denied',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};
