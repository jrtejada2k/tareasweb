/**
 * Task Service
 * 
 * Business logic for task management
 */

import { query } from '@utils/database';
import logger from '@utils/logger';
import { Task, CreateTaskData, UpdateTaskData, TaskWithSubtasks } from '@models/Task';
import { CreateTaskDTO, UpdateTaskDTO, TaskStatus, TaskPriority, TaskFilters } from '../types/task.types';
import { NotFoundError, ConflictError, ForbiddenError } from '@middleware/errorMiddleware';

/**
 * Create a new task
 */
export const createTask = async (
  data: CreateTaskDTO,
  userId: string
): Promise<Task> => {
  try {
    // Validate project exists
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1',
      [data.project_id]
    );

    if (projectResult.rows.length === 0) {
      throw new NotFoundError('Project not found');
    }

    let projectId = data.project_id;

    // If parent_task_id provided, validate and inherit project_id
    if (data.parent_task_id) {
      const parentResult = await query<Task>(
        'SELECT id, project_id FROM tasks WHERE id = $1',
        [data.parent_task_id]
      );

      if (parentResult.rows.length === 0) {
        throw new NotFoundError('Parent task not found');
      }

      const parentTask = parentResult.rows[0];
      
      // Inherit project_id from parent
      if (parentTask) {
        projectId = parentTask.project_id;
      }

      // Ensure parent task belongs to the same project
      if (projectId !== data.project_id) {
        throw new ConflictError(
          'Parent task must belong to the same project',
          'PARENT_PROJECT_MISMATCH'
        );
      }
    }

    const taskData: CreateTaskData = {
      project_id: data.project_id,
      parent_task_id: data.parent_task_id || null,
      title: data.title,
      description: data.description || null,
      status: data.status || TaskStatus.NOT_STARTED,
      priority: data.priority || TaskPriority.MEDIUM,
      start_date: data.start_date ? new Date(data.start_date) : null,
      end_date: data.end_date ? new Date(data.end_date) : null,
      estimated_hours: data.estimated_hours || null,
      actual_hours: null,
      completion_percentage: 0,
      created_by: userId,
    };

    // Validate dates
    if (taskData.start_date && taskData.end_date) {
      if (taskData.end_date < taskData.start_date) {
        throw new ConflictError('End date must be after start date', 'INVALID_DATES');
      }
    }

    const result = await query<Task>(
      `INSERT INTO tasks (
        project_id, parent_task_id, title, description, status, priority,
        start_date, end_date, estimated_hours, actual_hours, 
        completion_percentage, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        taskData.project_id,
        taskData.parent_task_id,
        taskData.title,
        taskData.description,
        taskData.status,
        taskData.priority,
        taskData.start_date,
        taskData.end_date,
        taskData.estimated_hours,
        taskData.actual_hours,
        taskData.completion_percentage,
        taskData.created_by,
      ]
    );

    const task = result.rows[0];
    
    if (!task) {
      throw new Error('Failed to create task');
    }

    logger.info('Task created', {
      taskId: task.id,
      projectId: data.project_id,
      createdBy: userId,
    });

    return task;
  } catch (error) {
    logger.error('Task creation failed', { error, userId });
    throw error;
  }
};

/**
 * Update a task
 */
export const updateTask = async (
  taskId: string,
  data: UpdateTaskDTO,
  userId: string
): Promise<Task> => {
  try {
    // Check if task exists
    const existingTask = await getTaskById(taskId, userId);

    const updateData: UpdateTaskData = {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.start_date !== undefined && {
        start_date: data.start_date ? new Date(data.start_date) : null,
      }),
      ...(data.end_date !== undefined && {
        end_date: data.end_date ? new Date(data.end_date) : null,
      }),
      ...(data.estimated_hours !== undefined && { estimated_hours: data.estimated_hours }),
      ...(data.actual_hours !== undefined && { actual_hours: data.actual_hours }),
      ...(data.completion_percentage !== undefined && {
        completion_percentage: data.completion_percentage,
      }),
    };

    // If status changed to completed, set completed_at
    if (data.status === TaskStatus.COMPLETADA && existingTask.status !== 'completada') {
      updateData.completed_at = new Date();
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    Object.entries(updateData).forEach(([key, value]) => {
      updateFields.push(`${key} = $${paramIndex++}`);
      updateValues.push(value);
    });

    if (updateFields.length === 0) {
      return existingTask;
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(taskId);

    const result = await query<Task>(
      `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      updateValues
    );

    const task = result.rows[0];
    
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    logger.info('Task updated', {
      taskId: task.id,
      updatedBy: userId,
    });

    return task;
  } catch (error) {
    logger.error('Task update failed', { error, taskId, userId });
    throw error;
  }
};

/**
 * Delete a task (check no sub-tasks)
 */
export const deleteTask = async (taskId: string, userId: string): Promise<void> => {
  try {
    // Check if task exists
    await getTaskById(taskId, userId);

    // Check for sub-tasks
    const subtasksResult = await query(
      'SELECT COUNT(*) as count FROM tasks WHERE parent_task_id = $1',
      [taskId]
    );

    const subtaskCount = parseInt(subtasksResult.rows[0]?.count || '0', 10);

    if (subtaskCount > 0) {
      throw new ConflictError(
        `Cannot delete task with ${subtaskCount} sub-task(s). Delete sub-tasks first.`,
        'TASK_HAS_SUBTASKS'
      );
    }

    // Delete task
    await query('DELETE FROM tasks WHERE id = $1', [taskId]);

    logger.info('Task deleted', {
      taskId,
      deletedBy: userId,
    });
  } catch (error) {
    logger.error('Task deletion failed', { error, taskId, userId });
    throw error;
  }
};

/**
 * Get task by ID (with sub-tasks, time entries)
 */
export const getTaskById = async (
  taskId: string,
  userId: string,
  userRole?: string
): Promise<Task> => {
  try {
    const result = await query<Task>(
      'SELECT * FROM tasks WHERE id = $1',
      [taskId]
    );

    const task = result.rows[0];
    
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check access: masters have access to all, regular users must be assigned
    if (userRole && userRole !== 'master') {
      const assignmentResult = await query(
        'SELECT id FROM task_assignments WHERE task_id = $1 AND user_id = $2',
        [taskId, userId]
      );

      if (assignmentResult.rows.length === 0) {
        throw new ForbiddenError(
          'You do not have access to this task',
          'TASK_ACCESS_DENIED'
        );
      }
    }

    logger.debug('Task retrieved', { taskId });

    return task;
  } catch (error) {
    logger.error('Get task failed', { error, taskId });
    throw error;
  }
};

/**
 * Get task with subtasks
 */
export const getTaskWithSubtasks = async (
  taskId: string,
  userId: string,
  userRole?: string
): Promise<TaskWithSubtasks> => {
  try {
    const task = await getTaskById(taskId, userId, userRole);

    // Get subtasks
    const subtasksResult = await query<Task>(
      `SELECT * FROM tasks 
       WHERE parent_task_id = $1 
       ORDER BY created_at ASC`,
      [taskId]
    );

    return {
      ...task,
      subtasks: subtasksResult.rows,
    };
  } catch (error) {
    logger.error('Get task with subtasks failed', { error, taskId });
    throw error;
  }
};

/**
 * List tasks (with filters and pagination)
 */
export const listTasks = async (
  filters: TaskFilters & {
    userId?: string;
    userRole?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ tasks: Task[]; total: number }> => {
  try {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Filter by project_id
    if (filters.project_id) {
      conditions.push(`t.project_id = $${paramIndex++}`);
      values.push(filters.project_id);
    }

    // Filter by parent_task_id (null for root tasks, specific ID for subtasks)
    if (filters.parent_task_id !== undefined) {
      if (filters.parent_task_id === null) {
        conditions.push(`t.parent_task_id IS NULL`);
      } else {
        conditions.push(`t.parent_task_id = $${paramIndex++}`);
        values.push(filters.parent_task_id);
      }
    }

    // Filter by status
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        conditions.push(`t.status = ANY($${paramIndex++})`);
        values.push(filters.status);
      } else {
        conditions.push(`t.status = $${paramIndex++}`);
        values.push(filters.status);
      }
    }

    // Filter by priority
    if (filters.priority) {
      if (Array.isArray(filters.priority)) {
        conditions.push(`t.priority = ANY($${paramIndex++})`);
        values.push(filters.priority);
      } else {
        conditions.push(`t.priority = $${paramIndex++}`);
        values.push(filters.priority);
      }
    }

    // Filter by assigned user
    if (filters.assigned_user_id) {
      conditions.push(
        `EXISTS (
          SELECT 1 FROM task_assignments ta 
          WHERE ta.task_id = t.id AND ta.user_id = $${paramIndex++}
        )`
      );
      values.push(filters.assigned_user_id);
    }

    // Filter by assigned_to_me (tasks assigned to current user)
    if (filters.assigned_to_me && filters.userId) {
      conditions.push(
        `EXISTS (
          SELECT 1 FROM task_assignments ta 
          WHERE ta.task_id = t.id AND ta.user_id = $${paramIndex++}
        )`
      );
      values.push(filters.userId);
    }

    // Filter by date ranges
    if (filters.start_date_from) {
      conditions.push(`t.start_date >= $${paramIndex++}`);
      values.push(new Date(filters.start_date_from));
    }
    if (filters.start_date_to) {
      conditions.push(`t.start_date <= $${paramIndex++}`);
      values.push(new Date(filters.start_date_to));
    }
    if (filters.end_date_from) {
      conditions.push(`t.end_date >= $${paramIndex++}`);
      values.push(new Date(filters.end_date_from));
    }
    if (filters.end_date_to) {
      conditions.push(`t.end_date <= $${paramIndex++}`);
      values.push(new Date(filters.end_date_to));
    }

    // Search in title and description
    if (filters.search) {
      conditions.push(
        `(t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`
      );
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Filter by user assignments (for regular users)
    if (filters.userId && filters.userRole !== 'master') {
      conditions.push(
        `EXISTS (
          SELECT 1 FROM task_assignments ta 
          WHERE ta.task_id = t.id AND ta.user_id = $${paramIndex++}
        )`
      );
      values.push(filters.userId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get tasks
    const tasksResult = await query<Task>(
      `SELECT t.*
       FROM tasks t
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...values, limit, offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM tasks t
       ${whereClause}`,
      values
    );

    const total = parseInt(countResult.rows[0]?.total || '0', 10);

    logger.debug('Tasks listed', { count: tasksResult.rows.length, total });

    return {
      tasks: tasksResult.rows,
      total,
    };
  } catch (error) {
    logger.error('List tasks failed', { error });
    throw error;
  }
};

/**
 * Update task status with validation
 * Validates user assignment, status transition, and sets completed_at
 */
export const updateTaskStatus = async (
  taskId: string,
  newStatus: string,
  userId: string,
  userRole: string
): Promise<Task> => {
  try {
    // Import validation function
    const { isValidStatusTransition } = require('@utils/validation');

    // Get current task
    const taskResult = await query<Task>(
      'SELECT * FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      throw new NotFoundError('Task not found');
    }

    const task = taskResult.rows[0];
    const currentStatus = task?.status || 'not_started';

    // Check if user has access to this task (master or assigned)
    if (userRole !== 'master') {
      const assignmentResult = await query(
        'SELECT id FROM task_assignments WHERE task_id = $1 AND user_id = $2',
        [taskId, userId]
      );

      if (assignmentResult.rows.length === 0) {
        throw new ForbiddenError(
          'You do not have access to update this task',
          'TASK_ACCESS_DENIED'
        );
      }
    }

    // Validate status transition
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      throw new ConflictError(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'`,
        'INVALID_STATUS_TRANSITION'
      );
    }

    // Prepare update data
    const updateData: any = {
      status: newStatus,
      updated_at: new Date(),
    };

    // If status changed to completed, set completed_at
    if (newStatus === 'completada' && currentStatus !== 'completada') {
      updateData.completed_at = new Date();
    }

    // If status changed from completed to something else, clear completed_at
    if (currentStatus === 'completada' && newStatus !== 'completada') {
      updateData.completed_at = null;
    }

    // Update task
    const result = await query<Task>(
      `UPDATE tasks 
       SET status = $1, 
           completed_at = $2,
           updated_at = $3
       WHERE id = $4 
       RETURNING *`,
      [updateData.status, updateData.completed_at, updateData.updated_at, taskId]
    );

    const updatedTask = result.rows[0];
    
    if (!updatedTask) {
      throw new NotFoundError('Task not found');
    }

    // Clear deadline alerts if task is completed
    if (newStatus === 'completada') {
      try {
        const { clearTaskAlerts } = require('@services/alertService');
        await clearTaskAlerts(taskId);
      } catch (alertError) {
        // Log but don't fail the update
        logger.warn('Failed to clear task alerts', { taskId, error: alertError });
      }
    }

    logger.info('Task status updated', {
      taskId,
      userId,
      oldStatus: currentStatus,
      newStatus: newStatus,
      completedAt: updateData.completed_at,
    });

    return updatedTask;
  } catch (error) {
    logger.error('Update task status failed', { error, taskId, userId, newStatus });
    throw error;
  }
};
