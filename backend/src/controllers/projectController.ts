/**
 * Project Controller
 * 
 * HTTP request handlers for project endpoints
 */

import { Request, Response } from 'express';
import {
  createProject,
  updateProject,
  deleteProject,
  getProjectById,
  getProjectWithTasks,
  listProjects,
} from '@services/projectService';
import {
  assignUserToProject,
  removeUserFromProject,
  getProjectUserAssignments,
} from '@services/assignmentService';
import {
  CreateProjectDTO,
  UpdateProjectDTO,
  ProjectDTO,
  ProjectSummaryDTO,
  ProjectStatus,
} from '../types/project.types';
import { asyncHandler } from '@middleware/errorMiddleware';

/**
 * Create a new project
 * POST /api/v1/projects
 * Requires: master role
 */
export const create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const projectData: CreateProjectDTO = req.body;
  const userId = req.user?.userId!;

  const project = await createProject(projectData, userId);

  // Convert to DTO
  const projectDTO: ProjectDTO = {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status as ProjectStatus,
    created_by: project.created_by,
    start_date: project.start_date ? project.start_date.toISOString() : null,
    end_date: project.end_date ? project.end_date.toISOString() : null,
    created_at: project.created_at.toISOString(),
    updated_at: project.updated_at.toISOString(),
  };

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: projectDTO,
  });
});

/**
 * Update a project
 * PUT /api/v1/projects/:id
 * Requires: master role
 */
export const update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const projectId = req.params['id'];
  if (!projectId) {
    res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Project ID is required' } });
    return;
  }
  
  const updateData: UpdateProjectDTO = req.body;
  const userId = req.user?.userId!;

  const project = await updateProject(projectId, updateData, userId);

  // Convert to DTO
  const projectDTO: ProjectDTO = {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status as ProjectStatus,
    created_by: project.created_by,
    start_date: project.start_date ? project.start_date.toISOString() : null,
    end_date: project.end_date ? project.end_date.toISOString() : null,
    created_at: project.created_at.toISOString(),
    updated_at: project.updated_at.toISOString(),
  };

  res.status(200).json({
    success: true,
    message: 'Project updated successfully',
    data: projectDTO,
  });
});

/**
 * Delete a project
 * DELETE /api/v1/projects/:id
 * Requires: master role
 */
export const remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const projectId = req.params['id'];
  if (!projectId) {
    res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Project ID is required' } });
    return;
  }
  
  const userId = req.user?.userId!;

  await deleteProject(projectId, userId);

  res.status(200).json({
    success: true,
    message: 'Project deleted successfully',
  });
});

/**
 * Get project by ID
 * GET /api/v1/projects/:id
 * Requires: master or assigned user
 */
export const getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const projectId = req.params['id'];
  if (!projectId) {
    res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Project ID is required' } });
    return;
  }
  
  const userId = req.user?.userId!;
  const userRole = req.user?.role;
  const includeTasks = req.query['include_tasks'] === 'true';

  let project;
  
  if (includeTasks) {
    project = await getProjectWithTasks(projectId, userId, userRole);
  } else {
    project = await getProjectById(projectId, userId, userRole);
  }

  // Convert to DTO
  const projectDTO: any = {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    created_by: project.created_by,
    start_date: project.start_date ? project.start_date.toISOString() : null,
    end_date: project.end_date ? project.end_date.toISOString() : null,
    created_at: project.created_at.toISOString(),
    updated_at: project.updated_at.toISOString(),
  };

  if (includeTasks && project.tasks) {
    projectDTO.tasks = project.tasks;
  }

  res.status(200).json({
    success: true,
    data: projectDTO,
  });
});

/**
 * List projects
 * GET /api/v1/projects
 * Filter by user assignments for regular users
 */
export const list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId!;
  const userRole = req.user?.role;
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 20;
  const status = req.query['status'] as ProjectStatus | undefined;

  const { projects, total } = await listProjects({
    status,
    userId,
    userRole,
    page,
    limit,
  });

  // Convert to DTOs
  const projectDTOs: ProjectSummaryDTO[] = projects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status as ProjectStatus,
    start_date: project.start_date ? project.start_date.toISOString() : null,
    end_date: project.end_date ? project.end_date.toISOString() : null,
    total_tasks: Number(project.total_tasks) || 0,
    completed_tasks: Number(project.completed_tasks) || 0,
    assigned_users: Number(project.assigned_users) || 0,
  }));

  res.status(200).json({
    success: true,
    data: projectDTOs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * Assign user to project
 * POST /api/v1/projects/:id/assign-user
 * Requires: master role
 */
export const assignUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const projectId = req.params['id']!;
  const { userId: targetUserId } = req.body;
  const assignedBy = req.user?.userId!;

  const assignment = await assignUserToProject(projectId, targetUserId, assignedBy);

  res.status(200).json({
    success: true,
    message: 'User assigned to project successfully',
    data: {
      id: assignment.id,
      project_id: assignment.project_id,
      user_id: assignment.user_id,
      assigned_by: assignment.assigned_by,
      assigned_at: assignment.assigned_at.toISOString(),
    },
  });
});

/**
 * Remove user from project
 * DELETE /api/v1/projects/:id/unassign-user/:userId
 * Requires: master role
 */
export const unassignUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const projectId = req.params['id']!;
  const targetUserId = req.params['userId']!;
  const removedBy = req.user?.userId!;

  await removeUserFromProject(projectId, targetUserId, removedBy);

  res.status(200).json({
    success: true,
    message: 'User removed from project successfully',
  });
});

/**
 * Get users assigned to project
 * GET /api/v1/projects/:id/users
 * Requires: master or assigned user
 */
export const getAssignedUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const projectId = req.params['id']!;

  const assignments = await getProjectUserAssignments(projectId);

  res.status(200).json({
    success: true,
    data: assignments.map((a) => ({
      id: a.id,
      user_id: a.user_id,
      user_full_name: a.user_full_name,
      user_email: a.user_email,
      assigned_by: a.assigned_by,
      assigner_full_name: a.assigner_full_name,
      assigned_at: a.assigned_at.toISOString(),
    })),
  });
});
