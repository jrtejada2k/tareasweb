/**
 * Time Tracking Service
 * 
 * Business logic for time entry logging and tracking
 */

import { query } from '@utils/database';
import logger from '@utils/logger';
import {
  TimeEntry,
  CreateTimeEntryData,
  TimeEntryWithDetails,
} from '@models/TimeEntry';
import { NotFoundError, ForbiddenError, ValidationError } from '@middleware/errorMiddleware';

/**
 * Create a new time entry
 */
export const createTimeEntry = async (
  data: CreateTimeEntryData
): Promise<TimeEntry> => {
  try {
    // Validate hours_worked range (0.01 to 24)
    if (data.hours_worked < 0.01 || data.hours_worked > 24) {
      throw new ValidationError(
        'Hours worked must be between 0.01 and 24',
        'INVALID_HOURS'
      );
    }

    // Validate work_date is not in the future
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    if (new Date(data.work_date) > today) {
      throw new ValidationError(
        'Work date cannot be in the future',
        'FUTURE_WORK_DATE'
      );
    }

    // Check if user is assigned to the task
    const assignmentResult = await query(
      `SELECT ta.id 
       FROM task_assignments ta
       WHERE ta.task_id = $1 AND ta.user_id = $2`,
      [data.task_id, data.user_id]
    );

    if (assignmentResult.rows.length === 0) {
      throw new ForbiddenError(
        'You are not assigned to this task',
        'TASK_NOT_ASSIGNED'
      );
    }

    // Check if task exists
    const taskResult = await query(
      `SELECT id, title FROM tasks WHERE id = $1`,
      [data.task_id]
    );

    if (taskResult.rows.length === 0) {
      throw new NotFoundError('Task not found');
    }

    // Start transaction
    await query('BEGIN');

    try {
      // Insert time entry
      const insertResult = await query<TimeEntry>(
        `INSERT INTO time_entries 
         (task_id, user_id, hours_worked, work_date, description, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [
          data.task_id,
          data.user_id,
          data.hours_worked,
          data.work_date,
          data.description || null,
        ]
      );

      const timeEntry = insertResult.rows[0];
      
      if (!timeEntry) {
        throw new Error('Failed to create time entry');
      }

      // Update task's actual_hours (sum of all time entries)
      await query(
        `UPDATE tasks 
         SET actual_hours = (
           SELECT COALESCE(SUM(hours_worked), 0) 
           FROM time_entries 
           WHERE task_id = $1
         ),
         updated_at = NOW()
         WHERE id = $1`,
        [data.task_id]
      );

      await query('COMMIT');

      logger.info('Time entry created', {
        timeEntryId: timeEntry.id,
        taskId: data.task_id,
        userId: data.user_id,
        hoursWorked: data.hours_worked,
      });

      return timeEntry;
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    logger.error('Create time entry failed', { error, data });
    throw error;
  }
};

/**
 * Delete a time entry
 */
export const deleteTimeEntry = async (
  entryId: string,
  userId: string,
  userRole: string
): Promise<void> => {
  try {
    // Get the time entry
    const entryResult = await query<TimeEntry>(
      `SELECT * FROM time_entries WHERE id = $1`,
      [entryId]
    );

    if (entryResult.rows.length === 0) {
      throw new NotFoundError('Time entry not found');
    }

    const entry = entryResult.rows[0];

    // Check access: owner or master can delete
    if (userRole !== 'master' && entry?.user_id !== userId) {
      throw new ForbiddenError(
        'You can only delete your own time entries',
        'TIME_ENTRY_ACCESS_DENIED'
      );
    }

    const taskId = entry?.task_id;

    // Start transaction
    await query('BEGIN');

    try {
      // Delete time entry
      await query(`DELETE FROM time_entries WHERE id = $1`, [entryId]);

      // Recalculate task's actual_hours
      await query(
        `UPDATE tasks 
         SET actual_hours = (
           SELECT COALESCE(SUM(hours_worked), 0) 
           FROM time_entries 
           WHERE task_id = $1
         ),
         updated_at = NOW()
         WHERE id = $1`,
        [taskId]
      );

      await query('COMMIT');

      logger.info('Time entry deleted', {
        timeEntryId: entryId,
        taskId,
        userId,
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    logger.error('Delete time entry failed', { error, entryId, userId });
    throw error;
  }
};

/**
 * Get time entries with filters
 */
export const getTimeEntries = async (
  userId: string,
  userRole: string,
  filters?: {
    task_id?: string;
    user_id?: string;
    work_date_from?: Date;
    work_date_to?: Date;
    project_id?: string;
  },
  pagination?: { page: number; limit: number }
): Promise<{ entries: TimeEntryWithDetails[]; total: number }> => {
  try {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const offset = (page - 1) * limit;

    // Build WHERE clause based on filters and user role
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Role-based access control
    if (userRole !== 'master') {
      // Regular users only see their own entries
      conditions.push(`tl.user_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    // Task filter
    if (filters?.task_id) {
      conditions.push(`tl.task_id = $${paramIndex}`);
      params.push(filters.task_id);
      paramIndex++;
    }

    // User filter (only for masters)
    if (filters?.user_id && userRole === 'master') {
      conditions.push(`tl.user_id = $${paramIndex}`);
      params.push(filters.user_id);
      paramIndex++;
    }

    // Work date range filters
    if (filters?.work_date_from) {
      conditions.push(`tl.work_date >= $${paramIndex}`);
      params.push(filters.work_date_from);
      paramIndex++;
    }

    if (filters?.work_date_to) {
      conditions.push(`tl.work_date <= $${paramIndex}`);
      params.push(filters.work_date_to);
      paramIndex++;
    }

    // Project filter
    if (filters?.project_id) {
      conditions.push(`t.project_id = $${paramIndex}`);
      params.push(filters.project_id);
      paramIndex++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(DISTINCT tl.id) as count
       FROM time_entries tl
       JOIN tasks t ON t.id = tl.task_id
       ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    // Get time entries with details
    const entriesResult = await query<TimeEntryWithDetails>(
      `SELECT 
         tl.*,
         t.title as task_title,
         t.status as task_status,
         t.project_id,
         p.name as project_name,
         u.full_name as user_name
       FROM time_entries tl
       JOIN tasks t ON t.id = tl.task_id
       JOIN projects p ON p.id = t.project_id
       JOIN users u ON u.id = tl.user_id
       ${whereClause}
       ORDER BY tl.work_date DESC, tl.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    logger.info('Time entries retrieved', {
      userId,
      userRole,
      filters,
      total,
      returned: entriesResult.rows.length,
    });

    return {
      entries: entriesResult.rows,
      total,
    };
  } catch (error) {
    logger.error('Get time entries failed', { error, userId, filters });
    throw error;
  }
};

/**
 * Get total hours for a task
 */
export const getTaskTotalHours = async (taskId: string): Promise<number> => {
  try {
    const result = await query(
      `SELECT COALESCE(SUM(hours_worked), 0) as total_hours
       FROM time_entries
       WHERE task_id = $1`,
      [taskId]
    );

    const totalHours = parseFloat(result.rows[0]?.total_hours || '0');

    return totalHours;
  } catch (error) {
    logger.error('Get task total hours failed', { error, taskId });
    throw error;
  }
};

/**
 * Get time entry by ID
 */
export const getTimeEntryById = async (
  entryId: string,
  userId: string,
  userRole: string
): Promise<TimeEntryWithDetails> => {
  try {
    const result = await query<TimeEntryWithDetails>(
      `SELECT 
         tl.*,
         t.title as task_title,
         t.status as task_status,
         t.project_id,
         p.name as project_name,
         u.full_name as user_name
       FROM time_entries tl
       JOIN tasks t ON t.id = tl.task_id
       JOIN projects p ON p.id = t.project_id
       JOIN users u ON u.id = tl.user_id
       WHERE tl.id = $1`,
      [entryId]
    );

    const entry = result.rows[0];
    
    if (!entry) {
      throw new NotFoundError('Time entry not found');
    }

    // Check access: masters see all, users only see their own
    if (userRole !== 'master' && entry.user_id !== userId) {
      throw new ForbiddenError(
        'You do not have access to this time entry',
        'TIME_ENTRY_ACCESS_DENIED'
      );
    }

    return entry;
  } catch (error) {
    logger.error('Get time entry by ID failed', { error, entryId });
    throw error;
  }
};
