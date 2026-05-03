/**
 * Deadline Service
 * 
 * Business logic for deadline extension requests
 */

import { query } from '@utils/database';
import logger from '@utils/logger';
import {
  DeadlineRequest,
  CreateDeadlineRequestData,
  ReviewDeadlineRequestData,
  DeadlineRequestWithDetails,
} from '@models/DeadlineRequest';
import { NotFoundError, ForbiddenError, ValidationError } from '@middleware/errorMiddleware';

/**
 * Create a new deadline extension request
 */
export const createRequest = async (
  data: CreateDeadlineRequestData
): Promise<DeadlineRequest> => {
  try {
    // Validate that the requested deadline is after the current deadline
    if (new Date(data.requested_deadline) <= new Date(data.current_deadline)) {
      throw new ValidationError(
        'Requested deadline must be after the current deadline',
        'INVALID_DEADLINE'
      );
    }

    // Validate that the requested deadline is not in the past
    if (new Date(data.requested_deadline) < new Date()) {
      throw new ValidationError(
        'Requested deadline cannot be in the past',
        'PAST_DEADLINE'
      );
    }

    // Check if user is assigned to the task
    const assignmentResult = await query(
      `SELECT ta.id 
       FROM task_assignments ta
       WHERE ta.task_id = $1 AND ta.user_id = $2`,
      [data.task_id, data.requested_by]
    );

    if (assignmentResult.rows.length === 0) {
      throw new ForbiddenError(
        'You are not assigned to this task',
        'TASK_NOT_ASSIGNED'
      );
    }

    // Check if task exists and get its current end_date
    const taskResult = await query(
      `SELECT id, end_date, status FROM tasks WHERE id = $1`,
      [data.task_id]
    );

    if (taskResult.rows.length === 0) {
      throw new NotFoundError('Task not found');
    }

    const task = taskResult.rows[0];

    // Don't allow extension requests for completed tasks
    if (task?.status === 'completada') {
      throw new ValidationError(
        'Cannot request extension for completed tasks',
        'TASK_COMPLETED'
      );
    }

    // Check if there's already a pending request for this task by this user
    const pendingRequestResult = await query(
      `SELECT id FROM deadline_requests 
       WHERE task_id = $1 
         AND requested_by = $2 
         AND status = 'pending'`,
      [data.task_id, data.requested_by]
    );

    if (pendingRequestResult.rows.length > 0) {
      throw new ValidationError(
        'You already have a pending extension request for this task',
        'PENDING_REQUEST_EXISTS'
      );
    }

    // Create the deadline request
    const result = await query<DeadlineRequest>(
      `INSERT INTO deadline_requests 
       (task_id, requested_by, current_deadline, requested_deadline, reason, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
       RETURNING *`,
      [
        data.task_id,
        data.requested_by,
        data.current_deadline,
        data.requested_deadline,
        data.reason,
      ]
    );

    const request = result.rows[0];
    
    if (!request) {
      throw new Error('Failed to create deadline request');
    }

    logger.info('Deadline extension request created', {
      requestId: request.id,
      taskId: data.task_id,
      requestedBy: data.requested_by,
      currentDeadline: data.current_deadline,
      requestedDeadline: data.requested_deadline,
    });

    return request;
  } catch (error) {
    logger.error('Create deadline request failed', { error, data });
    throw error;
  }
};

/**
 * Approve a deadline extension request
 */
export const approveRequest = async (
  requestId: string,
  reviewData: ReviewDeadlineRequestData
): Promise<DeadlineRequest> => {
  try {
    // Get the request
    const requestResult = await query<DeadlineRequest>(
      `SELECT * FROM deadline_requests WHERE id = $1`,
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      throw new NotFoundError('Deadline request not found');
    }

    const request = requestResult.rows[0];

    // Check if request is already reviewed
    if (request?.status !== 'pending') {
      throw new ValidationError(
        `Request has already been ${request?.status}`,
        'REQUEST_ALREADY_REVIEWED'
      );
    }

    // Start transaction: update request and task
    await query('BEGIN');

    try {
      // Update the task's end_date
      await query(
        `UPDATE tasks 
         SET end_date = $1, updated_at = NOW()
         WHERE id = $2`,
        [request?.requested_deadline, request?.task_id]
      );

      // Update the deadline request
      const updateResult = await query<DeadlineRequest>(
        `UPDATE deadline_requests 
         SET status = 'approved',
             reviewed_by = $1,
             reviewed_at = NOW(),
             review_notes = $2
         WHERE id = $3
         RETURNING *`,
        [reviewData.reviewed_by, reviewData.review_notes || null, requestId]
      );

      await query('COMMIT');

      const updatedRequest = updateResult.rows[0];
      
      if (!updatedRequest) {
        throw new Error('Failed to update deadline request');
      }

      logger.info('Deadline extension request approved', {
        requestId,
        taskId: request?.task_id,
        reviewedBy: reviewData.reviewed_by,
        newDeadline: request?.requested_deadline,
      });

      return updatedRequest;
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    logger.error('Approve deadline request failed', { error, requestId });
    throw error;
  }
};

/**
 * Deny a deadline extension request
 */
export const denyRequest = async (
  requestId: string,
  reviewData: ReviewDeadlineRequestData
): Promise<DeadlineRequest> => {
  try {
    // Get the request
    const requestResult = await query<DeadlineRequest>(
      `SELECT * FROM deadline_requests WHERE id = $1`,
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      throw new NotFoundError('Deadline request not found');
    }

    const request = requestResult.rows[0];

    // Check if request is already reviewed
    if (request?.status !== 'pending') {
      throw new ValidationError(
        `Request has already been ${request?.status}`,
        'REQUEST_ALREADY_REVIEWED'
      );
    }

    // Update the deadline request (no task update for denial)
    const result = await query<DeadlineRequest>(
      `UPDATE deadline_requests 
       SET status = 'denied',
           reviewed_by = $1,
           reviewed_at = NOW(),
           review_notes = $2
       WHERE id = $3
       RETURNING *`,
      [reviewData.reviewed_by, reviewData.review_notes || null, requestId]
    );

    const updatedRequest = result.rows[0];
    
    if (!updatedRequest) {
      throw new NotFoundError('Deadline request not found');
    }

    logger.info('Deadline extension request denied', {
      requestId,
      taskId: request?.task_id,
      reviewedBy: reviewData.reviewed_by,
    });

    return updatedRequest;
  } catch (error) {
    logger.error('Deny deadline request failed', { error, requestId });
    throw error;
  }
};

/**
 * Get deadline requests with filters
 */
export const getRequests = async (
  userId: string,
  userRole: string,
  filters?: {
    status?: 'pending' | 'approved' | 'denied';
    task_id?: string;
    project_id?: string;
  },
  pagination?: { page: number; limit: number }
): Promise<{ requests: DeadlineRequestWithDetails[]; total: number }> => {
  try {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    // Build WHERE clause based on filters and user role
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Role-based access control
    if (userRole !== 'master') {
      // Regular users only see their own requests
      conditions.push(`dr.requested_by = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }

    // Status filter
    if (filters?.status) {
      conditions.push(`dr.status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    // Task filter
    if (filters?.task_id) {
      conditions.push(`dr.task_id = $${paramIndex}`);
      params.push(filters.task_id);
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
      `SELECT COUNT(DISTINCT dr.id) as count
       FROM deadline_requests dr
       JOIN tasks t ON t.id = dr.task_id
       ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    // Get requests with details
    const requestsResult = await query<DeadlineRequestWithDetails>(
      `SELECT 
         dr.*,
         t.title as task_title,
         t.status as task_status,
         t.project_id,
         p.name as project_name,
         u1.full_name as requester_name,
         u2.full_name as reviewer_name
       FROM deadline_requests dr
       JOIN tasks t ON t.id = dr.task_id
       JOIN projects p ON p.id = t.project_id
       JOIN users u1 ON u1.id = dr.requested_by
       LEFT JOIN users u2 ON u2.id = dr.reviewed_by
       ${whereClause}
       ORDER BY dr.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    logger.info('Deadline requests retrieved', {
      userId,
      userRole,
      filters,
      total,
      returned: requestsResult.rows.length,
    });

    return {
      requests: requestsResult.rows,
      total,
    };
  } catch (error) {
    logger.error('Get deadline requests failed', { error, userId, filters });
    throw error;
  }
};

/**
 * Get a single deadline request by ID
 */
export const getRequestById = async (
  requestId: string,
  userId: string,
  userRole: string
): Promise<DeadlineRequestWithDetails> => {
  try {
    const result = await query<DeadlineRequestWithDetails>(
      `SELECT 
         dr.*,
         t.title as task_title,
         t.status as task_status,
         t.project_id,
         p.name as project_name,
         u1.full_name as requester_name,
         u2.full_name as reviewer_name
       FROM deadline_requests dr
       JOIN tasks t ON t.id = dr.task_id
       JOIN projects p ON p.id = t.project_id
       JOIN users u1 ON u1.id = dr.requested_by
       LEFT JOIN users u2 ON u2.id = dr.reviewed_by
       WHERE dr.id = $1`,
      [requestId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Deadline request not found');
    }

    const request = result.rows[0];
    
    if (!request) {
      throw new NotFoundError('Deadline request not found');
    }

    // Check access: masters see all, users only see their own
    if (userRole !== 'master' && request.requested_by !== userId) {
      throw new ForbiddenError(
        'You do not have access to this request',
        'REQUEST_ACCESS_DENIED'
      );
    }

    return request;
  } catch (error) {
    logger.error('Get deadline request by ID failed', { error, requestId });
    throw error;
  }
};
