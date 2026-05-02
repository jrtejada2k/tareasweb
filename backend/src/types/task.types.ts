/**
 * Task Type Definitions
 * 
 * DTOs and types for task management
 */

// Task status enum (EXACT values matching database ENUM)
export enum TaskStatus {
  NOT_STARTED = 'not_started',
  INICIADA = 'iniciada',
  EN_PROGRESO = 'en_progreso',
  COMPLETADA = 'completada',
  BLOCKED = 'blocked',
  CANCELLED = 'cancelled',
}

// Task priority enum
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Create task DTO
export interface CreateTaskDTO {
  project_id: string;
  parent_task_id?: string | null;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  start_date?: string; // ISO date string
  end_date?: string; // ISO date string
  estimated_hours?: number;
}

// Update task DTO
export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  start_date?: string | null; // ISO date string
  end_date?: string | null; // ISO date string
  estimated_hours?: number | null;
  actual_hours?: number | null;
  completion_percentage?: number;
}

// Task DTO (for API responses)
export interface TaskDTO {
  id: string;
  project_id: string;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  start_date: string | null; // ISO date string
  end_date: string | null; // ISO date string
  estimated_hours: number | null;
  actual_hours: number | null;
  completion_percentage: number;
  created_by: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  completed_at: string | null; // ISO date string
}

// Task summary DTO (for lists)
export interface TaskSummaryDTO {
  id: string;
  project_id: string;
  parent_task_id: string | null;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  start_date: string | null;
  end_date: string | null;
  completion_percentage: number;
  assigned_users?: number;
  has_subtasks?: boolean;
}

// Task with subtasks DTO
export interface TaskWithSubtasksDTO extends TaskDTO {
  subtasks: TaskSummaryDTO[];
}

// Task filters
export interface TaskFilters {
  project_id?: string;
  parent_task_id?: string | null;
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  assigned_user_id?: string;
  assigned_to_me?: boolean; // Filter for tasks assigned to current user
  start_date_from?: string;
  start_date_to?: string;
  end_date_from?: string;
  end_date_to?: string;
  search?: string; // Search in title and description
}

// Task list response
export interface TaskListResponse {
  success: boolean;
  data: TaskSummaryDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Task response
export interface TaskResponse {
  success: boolean;
  data: TaskDTO | TaskWithSubtasksDTO;
}

// Task deleted response
export interface TaskDeleteResponse {
  success: boolean;
  message: string;
}
