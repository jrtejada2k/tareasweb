/**
 * Time Tracking Controller
 * 
 * HTTP handlers for time entry endpoints
 */

import { Request, Response, NextFunction } from 'express';
import * as timeTrackingService from '@services/timeTrackingService';
import logger from '@utils/logger';

/**
 * Create a new time entry
 * POST /api/v1/time-entries
 */
export const createTimeEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { task_id, hours_worked, work_date, description } = req.body;
    const userId = req.user?.userId!;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const timeEntry = await timeTrackingService.createTimeEntry({
      task_id,
      user_id: userId,
      hours_worked: parseFloat(hours_worked),
      work_date: new Date(work_date),
      description,
    });

    logger.info('Time entry created via API', {
      timeEntryId: timeEntry.id,
      userId,
      taskId: task_id,
    });

    res.status(201).json({
      message: 'Time entry created successfully',
      data: timeEntry,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get time entries
 * GET /api/v1/time-entries
 */
export const getTimeEntries = async (
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
    const limit = parseInt(req.query['limit'] as string) || 50;
    const taskId = req.query['task_id'] as string | undefined;
    const filterUserId = req.query['user_id'] as string | undefined;
    const projectId = req.query['project_id'] as string | undefined;
    const workDateFrom = req.query['work_date_from']
      ? new Date(req.query['work_date_from'] as string)
      : undefined;
    const workDateTo = req.query['work_date_to']
      ? new Date(req.query['work_date_to'] as string)
      : undefined;

    const result = await timeTrackingService.getTimeEntries(
      userId,
      userRole,
      {
        task_id: taskId,
        user_id: filterUserId,
        project_id: projectId,
        work_date_from: workDateFrom,
        work_date_to: workDateTo,
      },
      { page, limit }
    );

    res.json({
      message: 'Time entries retrieved successfully',
      data: result.entries,
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
 * Get single time entry by ID
 * GET /api/v1/time-entries/:id
 */
export const getTimeEntryById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Time entry ID is required' });
      return;
    }
    
    const userId = req.user?.userId!;
    const userRole = req.user?.role!;

    if (!userId || !userRole) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const entry = await timeTrackingService.getTimeEntryById(
      id,
      userId,
      userRole
    );

    res.json({
      message: 'Time entry retrieved successfully',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a time entry
 * DELETE /api/v1/time-entries/:id
 */
export const deleteTimeEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Time entry ID is required' });
      return;
    }
    
    const userId = req.user?.userId!;
    const userRole = req.user?.role!;

    if (!userId || !userRole) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await timeTrackingService.deleteTimeEntry(id, userId, userRole);

    logger.info('Time entry deleted via API', {
      timeEntryId: id,
      userId,
    });

    res.json({
      message: 'Time entry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get total hours for a task
 * GET /api/v1/time-entries/task/:taskId/total
 */
export const getTaskTotalHours = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { taskId } = req.params;
    if (!taskId) {
      res.status(400).json({ error: 'Task ID is required' });
      return;
    }

    const totalHours = await timeTrackingService.getTaskTotalHours(taskId);

    res.json({
      message: 'Task total hours retrieved successfully',
      data: {
        task_id: taskId,
        total_hours: totalHours,
      },
    });
  } catch (error) {
    next(error);
  }
};
