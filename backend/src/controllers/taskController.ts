/**
 * Task Controller
 * 
 * HTTP request handlers for task endpoints
 */

import { Request, Response } from 'express';
import {
  createTask,
  updateTask,
  deleteTask,
  getTaskById,
  getTaskWithSubtasks,
  listTasks,
  updateTaskStatus,
} from '@services/taskService';
import {
  assignUserToTask,
  removeUserFromTask,
  getTaskUserAssignments,
} from '@services/assignmentService';
import {
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskDTO,
  TaskSummaryDTO,
  TaskStatus,
  TaskPriority,
} from '../types/task.types';
import { asyncHandler } from '@middleware/errorMiddleware';

/**
 * Create a new task
 * POST /api/v1/tasks
 * Requires: master role
 */
export const create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const taskData: CreateTaskDTO = req.body;
  const userId = req.user?.userId!;

  const task = await createTask(taskData, userId);

  // Convert to DTO
  const taskDTO: TaskDTO = {
    id: task.id,
    project_id: task.project_id,
    parent_task_id: task.parent_task_id,
    title: task.title,
    description: task.description,
    status: task.status as TaskStatus,
    priority: task.priority as TaskPriority,
    start_date: task.start_date ? task.start_date.toISOString() : null,
    end_date: task.end_date ? task.end_date.toISOString() : null,
    estimated_hours: task.estimated_hours,
    actual_hours: task.actual_hours,
    completion_percentage: task.completion_percentage,
    created_by: task.created_by,
    created_at: task.created_at.toISOString(),
    updated_at: task.updated_at.toISOString(),
    completed_at: task.completed_at ? task.completed_at.toISOString() : null,
  };

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: taskDTO,
  });
});

/**
 * Update a task
 * PUT /api/v1/tasks/:id
 * Requires: master role
 */
export const update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const taskId = req.params['id']!;
  const updateData: UpdateTaskDTO = req.body;
  const userId = req.user?.userId!;

  const task = await updateTask(taskId!, updateData, userId);

  // Convert to DTO
  const taskDTO: TaskDTO = {
    id: task.id,
    project_id: task.project_id,
    parent_task_id: task.parent_task_id,
    title: task.title,
    description: task.description,
    status: task.status as TaskStatus,
    priority: task.priority as TaskPriority,
    start_date: task.start_date ? task.start_date.toISOString() : null,
    end_date: task.end_date ? task.end_date.toISOString() : null,
    estimated_hours: task.estimated_hours,
    actual_hours: task.actual_hours,
    completion_percentage: task.completion_percentage,
    created_by: task.created_by,
    created_at: task.created_at.toISOString(),
    updated_at: task.updated_at.toISOString(),
    completed_at: task.completed_at ? task.completed_at.toISOString() : null,
  };

  res.status(200).json({
    success: true,
    message: 'Task updated successfully',
    data: taskDTO,
  });
});

/**
 * Update task status
 * PATCH /api/v1/tasks/:id/status
 * Requires: master or assigned user
 */
export const updateStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const taskId = req.params['id']!;
  const { status: newStatus } = req.body;
  const userId = req.user?.userId!;
  const userRole = req.user?.role || 'user';

  const task = await updateTaskStatus(taskId, newStatus, userId, userRole);

  // Convert to DTO
  const taskDTO: TaskDTO = {
    id: task.id,
    project_id: task.project_id,
    parent_task_id: task.parent_task_id,
    title: task.title,
    description: task.description,
    status: task.status as TaskStatus,
    priority: task.priority as TaskPriority,
    start_date: task.start_date ? task.start_date.toISOString() : null,
    end_date: task.end_date ? task.end_date.toISOString() : null,
    estimated_hours: task.estimated_hours,
    actual_hours: task.actual_hours,
    completion_percentage: task.completion_percentage,
    created_by: task.created_by,
    created_at: task.created_at.toISOString(),
    updated_at: task.updated_at.toISOString(),
    completed_at: task.completed_at ? task.completed_at.toISOString() : null,
  };

  res.status(200).json({
    success: true,
    message: 'Task status updated successfully',
    data: taskDTO,
  });
});

/**
 * Delete a task
 * DELETE /api/v1/tasks/:id
 * Requires: master role
 */
export const remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const taskId = req.params['id']!;
  const userId = req.user?.userId!;

  await deleteTask(taskId!, userId);

  res.status(200).json({
    success: true,
    message: 'Task deleted successfully',
  });
});

/**
 * Get task by ID
 * GET /api/v1/tasks/:id
 * Requires: RBAC check (master or assigned user)
 */
export const getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const taskId = req.params['id']!;
  const userId = req.user?.userId!;
  const userRole = req.user?.role;
  const includeSubtasks = req.query['include_subtasks'] === 'true';

  let task;

  if (includeSubtasks) {
    const taskWithSubtasks = await getTaskWithSubtasks(taskId!, userId, userRole);
    
    // Convert to DTO
    task = {
      id: taskWithSubtasks.id,
      project_id: taskWithSubtasks.project_id,
      parent_task_id: taskWithSubtasks.parent_task_id,
      title: taskWithSubtasks.title,
      description: taskWithSubtasks.description,
      status: taskWithSubtasks.status,
      priority: taskWithSubtasks.priority,
      start_date: taskWithSubtasks.start_date ? taskWithSubtasks.start_date.toISOString() : null,
      end_date: taskWithSubtasks.end_date ? taskWithSubtasks.end_date.toISOString() : null,
      estimated_hours: taskWithSubtasks.estimated_hours,
      actual_hours: taskWithSubtasks.actual_hours,
      completion_percentage: taskWithSubtasks.completion_percentage,
      created_by: taskWithSubtasks.created_by,
      created_at: taskWithSubtasks.created_at.toISOString(),
      updated_at: taskWithSubtasks.updated_at.toISOString(),
      completed_at: taskWithSubtasks.completed_at ? taskWithSubtasks.completed_at.toISOString() : null,
      subtasks: taskWithSubtasks.subtasks.map((subtask) => ({
        id: subtask.id,
        project_id: subtask.project_id,
        parent_task_id: subtask.parent_task_id,
        title: subtask.title,
        status: subtask.status,
        priority: subtask.priority,
        start_date: subtask.start_date ? subtask.start_date.toISOString() : null,
        end_date: subtask.end_date ? subtask.end_date.toISOString() : null,
        completion_percentage: subtask.completion_percentage,
      })),
    };
  } else {
    const taskData = await getTaskById(taskId!, userId, userRole);
    
    task = {
      id: taskData.id,
      project_id: taskData.project_id,
      parent_task_id: taskData.parent_task_id,
      title: taskData.title,
      description: taskData.description,
      status: taskData.status,
      priority: taskData.priority,
      start_date: taskData.start_date ? taskData.start_date.toISOString() : null,
      end_date: taskData.end_date ? taskData.end_date.toISOString() : null,
      estimated_hours: taskData.estimated_hours,
      actual_hours: taskData.actual_hours,
      completion_percentage: taskData.completion_percentage,
      created_by: taskData.created_by,
      created_at: taskData.created_at.toISOString(),
      updated_at: taskData.updated_at.toISOString(),
      completed_at: taskData.completed_at ? taskData.completed_at.toISOString() : null,
    };
  }

  res.status(200).json({
    success: true,
    data: task,
  });
});

/**
 * List tasks
 * GET /api/v1/tasks
 * Filter by assignments for regular users
 */
export const list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId!;
  const userRole = req.user?.role;
  const page = parseInt(req.query['page'] as string) || 1;
  const limit = parseInt(req.query['limit'] as string) || 20;

  // Parse filters
  const filters = {
    project_id: req.query['project_id'] as string | undefined,
    parent_task_id: req.query['parent_task_id'] as string | undefined,
    status: req.query['status'] as TaskStatus | undefined,
    priority: req.query['priority'] as TaskPriority | undefined,
    assigned_user_id: req.query['assigned_user_id'] as string | undefined,
    assigned_to_me: req.query['assigned_to_me'] === 'true',
    start_date_from: req.query['start_date_from'] as string | undefined,
    start_date_to: req.query['start_date_to'] as string | undefined,
    end_date_from: req.query['end_date_from'] as string | undefined,
    end_date_to: req.query['end_date_to'] as string | undefined,
    search: req.query['search'] as string | undefined,
  };

  const { tasks, total } = await listTasks({
    ...filters,
    userId,
    userRole,
    page,
    limit,
  });

  // Convert to DTOs
  const taskDTOs: TaskSummaryDTO[] = tasks.map((task) => ({
    id: task.id,
    project_id: task.project_id,
    parent_task_id: task.parent_task_id,
    title: task.title,
    status: task.status as TaskStatus,
    priority: task.priority as TaskPriority,
    start_date: task.start_date ? task.start_date.toISOString() : null,
    end_date: task.end_date ? task.end_date.toISOString() : null,
    completion_percentage: task.completion_percentage,
  }));

  res.status(200).json({
    success: true,
    data: taskDTOs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * Assign user to task
 * POST /api/v1/tasks/:id/assign-user
 * Requires: master role
 */
export const assignUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const taskId = req.params['id']!;
  const { userId: targetUserId } = req.body;
  const assignedBy = req.user?.userId!;

  const assignment = await assignUserToTask(taskId, targetUserId, assignedBy);

  res.status(200).json({
    success: true,
    message: 'User assigned to task successfully',
    data: {
      id: assignment.id,
      task_id: assignment.task_id,
      user_id: assignment.user_id,
      assigned_by: assignment.assigned_by,
      assigned_at: assignment.assigned_at.toISOString(),
    },
  });
});

/**
 * Remove user from task
 * DELETE /api/v1/tasks/:id/unassign-user/:userId
 * Requires: master role
 */
export const unassignUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const taskId = req.params['id']!;
  const targetUserId = req.params['userId']!;
  const removedBy = req.user?.userId!;

  await removeUserFromTask(taskId, targetUserId, removedBy);

  res.status(200).json({
    success: true,
    message: 'User removed from task successfully',
  });
});

/**
 * Get users assigned to task
 * GET /api/v1/tasks/:id/users
 * Requires: master or assigned user
 */
export const getAssignedUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const taskId = req.params['id']!;

  const assignments = await getTaskUserAssignments(taskId);

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
