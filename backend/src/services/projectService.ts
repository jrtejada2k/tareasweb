/**
 * Project Service
 * 
 * Business logic for project management
 */

import { query } from '@utils/database';
import logger from '@utils/logger';
import { Project, CreateProjectData, UpdateProjectData, ProjectWithStats } from '@models/Project';
import { CreateProjectDTO, UpdateProjectDTO, ProjectStatus } from '../types/project.types';
import { NotFoundError, ForbiddenError, ConflictError } from '@middleware/errorMiddleware';
import * as assignmentService from '@services/assignmentService';

/**
 * Create a new project (master only)
 */
export const createProject = async (
  data: CreateProjectDTO,
  userId: string
): Promise<Project> => {
  try {
    const projectData: CreateProjectData = {
      name: data.name,
      description: data.description || null,
      status: data.status || ProjectStatus.ACTIVE,
      created_by: userId,
      start_date: data.start_date ? new Date(data.start_date) : null,
      end_date: data.end_date ? new Date(data.end_date) : null,
    };

    // Validate dates
    if (projectData.start_date && projectData.end_date) {
      if (projectData.end_date < projectData.start_date) {
        throw new ConflictError('End date must be after start date', 'INVALID_DATES');
      }
    }

    const result = await query<Project>(
      `INSERT INTO projects (name, description, status, created_by, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        projectData.name,
        projectData.description,
        projectData.status,
        projectData.created_by,
        projectData.start_date,
        projectData.end_date,
      ]
    );

    const project = result.rows[0];
    
    if (!project) {
      throw new Error('Failed to create project');
    }

    logger.info('Project created', {
      projectId: project.id,
      name: project.name,
      createdBy: userId,
    });

    return project;
  } catch (error) {
    logger.error('Project creation failed', { error, userId });
    throw error;
  }
};

/**
 * Update a project (master only)
 */
export const updateProject = async (
  projectId: string,
  data: UpdateProjectDTO,
  userId: string
): Promise<Project> => {
  try {
    // Check if project exists
    const existingProject = await getProjectById(projectId, userId);

    const updateData: UpdateProjectData = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.start_date !== undefined && {
        start_date: data.start_date ? new Date(data.start_date) : null,
      }),
      ...(data.end_date !== undefined && {
        end_date: data.end_date ? new Date(data.end_date) : null,
      }),
    };

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (updateData.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(updateData.name);
    }
    if (updateData.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(updateData.description);
    }
    if (updateData.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(updateData.status);
    }
    if (updateData.start_date !== undefined) {
      updateFields.push(`start_date = $${paramIndex++}`);
      updateValues.push(updateData.start_date);
    }
    if (updateData.end_date !== undefined) {
      updateFields.push(`end_date = $${paramIndex++}`);
      updateValues.push(updateData.end_date);
    }

    if (updateFields.length === 0) {
      return existingProject;
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(projectId);

    const result = await query<Project>(
      `UPDATE projects SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      updateValues
    );

    const project = result.rows[0];
    
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    logger.info('Project updated', {
      projectId: project.id,
      updatedBy: userId,
    });

    return project;
  } catch (error) {
    logger.error('Project update failed', { error, projectId, userId });
    throw error;
  }
};

/**
 * Delete a project (master only, check no active tasks)
 */
export const deleteProject = async (projectId: string, userId: string): Promise<void> => {
  try {
    // Check if project exists
    await getProjectById(projectId, userId);

    // Check for active tasks
    const tasksResult = await query(
      `SELECT COUNT(*) as count FROM tasks 
       WHERE project_id = $1 AND status NOT IN ('completada')`,
      [projectId]
    );

    const taskCount = parseInt(tasksResult.rows[0]?.count || '0', 10);

    if (taskCount > 0) {
      throw new ConflictError(
        `Cannot delete project with ${taskCount} active task(s). Complete or delete tasks first.`,
        'PROJECT_HAS_ACTIVE_TASKS'
      );
    }

    // Delete project (cascade will handle related records)
    await query('DELETE FROM projects WHERE id = $1', [projectId]);

    logger.info('Project deleted', {
      projectId,
      deletedBy: userId,
    });
  } catch (error) {
    logger.error('Project deletion failed', { error, projectId, userId });
    throw error;
  }
};

/**
 * Get project by ID (with access control)
 */
export const getProjectById = async (
  projectId: string,
  userId: string,
  userRole?: string
): Promise<Project> => {
  try {
    const result = await query<Project>(
      'SELECT * FROM projects WHERE id = $1',
      [projectId]
    );

    const project = result.rows[0];
    
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Check access: masters have access to all, regular users must be assigned
    if (userRole && userRole !== 'master') {
      const assignmentResult = await query(
        'SELECT id FROM project_assignments WHERE project_id = $1 AND user_id = $2',
        [projectId, userId]
      );

      if (assignmentResult.rows.length === 0) {
        throw new ForbiddenError(
          'You do not have access to this project',
          'PROJECT_ACCESS_DENIED'
        );
      }
    }

    logger.debug('Project retrieved', { projectId });

    return project;
  } catch (error) {
    logger.error('Get project failed', { error, projectId });
    throw error;
  }
};

/**
 * Get project with tasks
 */
export const getProjectWithTasks = async (
  projectId: string,
  userId: string,
  userRole?: string
): Promise<any> => {
  try {
    const project = await getProjectById(projectId, userId, userRole);

    // Get tasks for this project
    const tasksResult = await query(
      `SELECT id, title, status, priority, parent_task_id
       FROM tasks 
       WHERE project_id = $1
       ORDER BY created_at ASC`,
      [projectId]
    );

    return {
      ...project,
      tasks: tasksResult.rows,
    };
  } catch (error) {
    logger.error('Get project with tasks failed', { error, projectId });
    throw error;
  }
};

/**
 * List projects (with pagination, status filter)
 */
export const listProjects = async (
  filters: {
    status?: ProjectStatus;
    userId?: string;
    userRole?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ projects: ProjectWithStats[]; total: number }> => {
  try {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Filter by status
    if (filters.status) {
      conditions.push(`p.status = $${paramIndex++}`);
      values.push(filters.status);
    }

    // Filter by user assignments (for regular users)
    if (filters.userId && filters.userRole !== 'master') {
      conditions.push(
        `EXISTS (
          SELECT 1 FROM project_assignments pa 
          WHERE pa.project_id = p.id AND pa.user_id = $${paramIndex++}
        )`
      );
      values.push(filters.userId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get projects with stats
    const projectsResult = await query<ProjectWithStats>(
      `SELECT 
        p.*,
        COUNT(DISTINCT t.id) as total_tasks,
        COUNT(DISTINCT CASE WHEN t.status = 'completada' THEN t.id END) as completed_tasks,
        COUNT(DISTINCT pa.user_id) as assigned_users
       FROM projects p
       LEFT JOIN tasks t ON t.project_id = p.id
       LEFT JOIN project_assignments pa ON pa.project_id = p.id
       ${whereClause}
       GROUP BY p.id
       ORDER BY p.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...values, limit, offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(DISTINCT p.id) as total
       FROM projects p
       ${whereClause}`,
      values
    );

    const total = parseInt(countResult.rows[0]?.total || '0', 10);

    logger.debug('Projects listed', { count: projectsResult.rows.length, total });

    const result = {
      projects: projectsResult.rows,
      total,
    } as { projects: ProjectWithStats[]; total: number } & { pagination?: { page: number; limit: number; total: number; totalPages: number } };

    // Backwards-compatible pagination metadata for consumers/tests expecting it
    result.pagination = {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };

    return result;
  } catch (error) {
    logger.error('List projects failed', { error });
    throw error;
  }
};

/**
 * Backwards-compatible: Assign a user to a project (proxy to assignmentService)
 */
export const assignUserToProject = async (
  projectId: string,
  userId: string,
  assignedBy: string
) => {
  return assignmentService.assignUserToProject(projectId, userId, assignedBy);
};
