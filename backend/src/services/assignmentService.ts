/**
 * Assignment Service
 * 
 * Business logic for user assignments to projects
 */

import { query } from '@utils/database';
import logger from '@utils/logger';
import {
  ProjectAssignment,
  CreateProjectAssignmentData,
  ProjectAssignmentWithUser,
  UserProjectAssignment,
} from '@models/ProjectAssignment';
import { NotFoundError, ConflictError } from '@middleware/errorMiddleware';

/**
 * Assign user to project
 */
export const assignUserToProject = async (
  projectId: string,
  userId: string,
  assignedBy: string
): Promise<ProjectAssignment> => {
  try {
    // Validate project exists
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      throw new NotFoundError('Project not found');
    }

    // Validate user exists
    const userResult = await query(
      'SELECT id, role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    const user = userResult.rows[0];

    // Don't allow assigning master users to projects (they have access to all)
    if (user?.role === 'master') {
      throw new ConflictError(
        'Master users have access to all projects and cannot be explicitly assigned',
        'CANNOT_ASSIGN_MASTER'
      );
    }

    // Check if user is already assigned
    const existingAssignment = await query(
      'SELECT id FROM project_assignments WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (existingAssignment.rows.length > 0) {
      throw new ConflictError('User is already assigned to this project', 'ALREADY_ASSIGNED');
    }

    // Create assignment
    const assignmentData: CreateProjectAssignmentData = {
      project_id: projectId,
      user_id: userId,
      assigned_by: assignedBy,
    };

    const result = await query<ProjectAssignment>(
      `INSERT INTO project_assignments (project_id, user_id, assigned_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [assignmentData.project_id, assignmentData.user_id, assignmentData.assigned_by]
    );

    const assignment = result.rows[0];
    
    if (!assignment) {
      throw new Error('Failed to create assignment');
    }

    logger.info('User assigned to project', {
      assignmentId: assignment.id,
      projectId,
      userId,
      assignedBy,
    });

    return assignment;
  } catch (error) {
    logger.error('User assignment to project failed', { error, projectId, userId });
    throw error;
  }
};

/**
 * Remove user from project
 */
export const removeUserFromProject = async (
  projectId: string,
  userId: string,
  removedBy: string
): Promise<void> => {
  try {
    // Check if assignment exists
    const result = await query(
      'SELECT id FROM project_assignments WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User assignment not found');
    }

    // Remove assignment
    await query(
      'DELETE FROM project_assignments WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );

    logger.info('User removed from project', {
      projectId,
      userId,
      removedBy,
    });
  } catch (error) {
    logger.error('User removal from project failed', { error, projectId, userId });
    throw error;
  }
};

/**
 * Get all project assignments for a user
 */
export const getUserProjectAssignments = async (
  userId: string
): Promise<UserProjectAssignment[]> => {
  try {
    const result = await query<UserProjectAssignment>(
      `SELECT 
        pa.id,
        pa.project_id,
        p.name as project_name,
        p.status as project_status,
        pa.assigned_at,
        pa.assigned_by,
        u.full_name as assigner_full_name
       FROM project_assignments pa
       JOIN projects p ON p.id = pa.project_id
       JOIN users u ON u.id = pa.assigned_by
       WHERE pa.user_id = $1
       ORDER BY pa.assigned_at DESC`,
      [userId]
    );

    logger.debug('User project assignments retrieved', {
      userId,
      count: result.rows.length,
    });

    return result.rows;
  } catch (error) {
    logger.error('Get user project assignments failed', { error, userId });
    throw error;
  }
};

/**
 * Get all user assignments for a project
 */
export const getProjectUserAssignments = async (
  projectId: string
): Promise<ProjectAssignmentWithUser[]> => {
  try {
    const result = await query<ProjectAssignmentWithUser>(
      `SELECT 
        pa.*,
        u.full_name as user_full_name,
        u.email as user_email,
        assigner.full_name as assigner_full_name
       FROM project_assignments pa
       JOIN users u ON u.id = pa.user_id
       JOIN users assigner ON assigner.id = pa.assigned_by
       WHERE pa.project_id = $1
       ORDER BY pa.assigned_at DESC`,
      [projectId]
    );

    logger.debug('Project user assignments retrieved', {
      projectId,
      count: result.rows.length,
    });

    return result.rows;
  } catch (error) {
    logger.error('Get project user assignments failed', { error, projectId });
    throw error;
  }
};

/**
 * Check if user is assigned to project
 */
export const isUserAssignedToProject = async (
  userId: string,
  projectId: string
): Promise<boolean> => {
  try {
    const result = await query(
      'SELECT id FROM project_assignments WHERE user_id = $1 AND project_id = $2',
      [userId, projectId]
    );

    return result.rows.length > 0;
  } catch (error) {
    logger.error('Check user project assignment failed', { error, userId, projectId });
    return false;
  }
};

/**
 * Check if user has access to project (is master or assigned)
 */
export const checkProjectAccess = async (
  userId: string,
  projectId: string,
  userRole: string
): Promise<boolean> => {
  try {
    // Masters have access to all projects
    if (userRole === 'master') {
      return true;
    }

    // Regular users need to be assigned
    return await isUserAssignedToProject(userId, projectId);
  } catch (error) {
    logger.error('Check project access failed', { error, userId, projectId });
    return false;
  }
};

// ==================== TASK ASSIGNMENT FUNCTIONS ====================

/**
 * Assign user to task
 * Validates that user is assigned to parent project first
 */
export const assignUserToTask = async (
  taskId: string,
  userId: string,
  assignedBy: string
): Promise<any> => {
  try {
    // Validate task exists and get project_id
    const taskResult = await query(
      'SELECT id, project_id FROM tasks WHERE id = $1',
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      throw new NotFoundError('Task not found');
    }

    const task = taskResult.rows[0];

    // Validate user exists
    const userResult = await query(
      'SELECT id, role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    const user = userResult.rows[0];

    // Check if user is assigned to the parent project (skip for master users)
    if (user?.role !== 'master') {
      const projectAssignment = await query(
        'SELECT id FROM project_assignments WHERE project_id = $1 AND user_id = $2',
        [task?.project_id, userId]
      );

      if (projectAssignment.rows.length === 0) {
        throw new ConflictError(
          'User must be assigned to the project before being assigned to tasks',
          'USER_NOT_ASSIGNED_TO_PROJECT'
        );
      }
    }

    // Check if already assigned
    const existingAssignment = await query(
      'SELECT id FROM task_assignments WHERE task_id = $1 AND user_id = $2',
      [taskId, userId]
    );

    if (existingAssignment.rows.length > 0) {
      throw new ConflictError('User is already assigned to this task', 'ALREADY_ASSIGNED');
    }

    // Create assignment
    const result = await query(
      `INSERT INTO task_assignments (task_id, user_id, assigned_by, assigned_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [taskId, userId, assignedBy]
    );

    logger.info('User assigned to task', { taskId, userId, assignedBy });
    return result.rows[0];
  } catch (error) {
    logger.error('Assign user to task failed', { error, taskId, userId });
    throw error;
  }
};

/**
 * Remove user from task
 */
export const removeUserFromTask = async (
  taskId: string,
  userId: string,
  removedBy: string
): Promise<void> => {
  try {
    // Check if assignment exists
    const assignmentResult = await query(
      'SELECT id FROM task_assignments WHERE task_id = $1 AND user_id = $2',
      [taskId, userId]
    );

    if (assignmentResult.rows.length === 0) {
      throw new NotFoundError('Task assignment not found');
    }

    // Delete assignment
    await query(
      'DELETE FROM task_assignments WHERE task_id = $1 AND user_id = $2',
      [taskId, userId]
    );

    logger.info('User removed from task', { taskId, userId, removedBy });
  } catch (error) {
    logger.error('Remove user from task failed', { error, taskId, userId });
    throw error;
  }
};

/**
 * Get all tasks assigned to a user
 */
export const getUserTaskAssignments = async (userId: string): Promise<any[]> => {
  try {
    const result = await query(
      `SELECT 
        ta.id,
        ta.task_id,
        t.title as task_title,
        t.status as task_status,
        t.priority as task_priority,
        t.project_id,
        p.name as project_name,
        ta.assigned_by,
        u.full_name as assigner_full_name,
        ta.assigned_at
       FROM task_assignments ta
       JOIN tasks t ON t.id = ta.task_id
       JOIN projects p ON p.id = t.project_id
       JOIN users u ON u.id = ta.assigned_by
       WHERE ta.user_id = $1
       ORDER BY ta.assigned_at DESC`,
      [userId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Get user task assignments failed', { error, userId });
    throw error;
  }
};

/**
 * Get all users assigned to a task
 */
export const getTaskUserAssignments = async (taskId: string): Promise<any[]> => {
  try {
    const result = await query(
      `SELECT 
        ta.id,
        ta.task_id,
        ta.user_id,
        u.full_name as user_full_name,
        u.email as user_email,
        ta.assigned_by,
        assigner.full_name as assigner_full_name,
        ta.assigned_at
       FROM task_assignments ta
       JOIN users u ON u.id = ta.user_id
       JOIN users assigner ON assigner.id = ta.assigned_by
       WHERE ta.task_id = $1
       ORDER BY ta.assigned_at DESC`,
      [taskId]
    );

    return result.rows;
  } catch (error) {
    logger.error('Get task user assignments failed', { error, taskId });
    throw error;
  }
};

/**
 * Check if user is assigned to task
 */
export const isUserAssignedToTask = async (
  userId: string,
  taskId: string
): Promise<boolean> => {
  try {
    const result = await query(
      'SELECT id FROM task_assignments WHERE user_id = $1 AND task_id = $2',
      [userId, taskId]
    );

    return result.rows.length > 0;
  } catch (error) {
    logger.error('Check task assignment failed', { error, userId, taskId });
    return false;
  }
};

/**
 * Check if user has access to task (is master or assigned)
 */
export const checkTaskAccess = async (
  userId: string,
  taskId: string,
  userRole: string
): Promise<boolean> => {
  try {
    // Masters have access to all tasks
    if (userRole === 'master') {
      return true;
    }

    // Regular users need to be assigned
    return await isUserAssignedToTask(userId, taskId);
  } catch (error) {
    logger.error('Check task access failed', { error, userId, taskId });
    return false;
  }
};
