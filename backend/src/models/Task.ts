/**
 * Task Model
 * 
 * Represents a task in the system
 */

export interface Task {
  id: string; // UUID
  project_id: string; // UUID
  parent_task_id: string | null; // UUID for sub-tasks
  title: string;
  description: string | null;
  status: 'not_started' | 'iniciada' | 'en_progreso' | 'completada';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date: Date | null;
  end_date: Date | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  completion_percentage: number;
  created_by: string; // UUID - user ID
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
}

/**
 * Task creation data
 */
export interface CreateTaskData {
  project_id: string;
  parent_task_id?: string | null;
  title: string;
  description?: string | null;
  status?: 'not_started' | 'iniciada' | 'en_progreso' | 'completada';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  start_date?: Date | null;
  end_date?: Date | null;
  estimated_hours?: number | null;
  actual_hours?: number | null;
  completion_percentage?: number;
  created_by: string;
}

/**
 * Task update data
 */
export interface UpdateTaskData {
  title?: string;
  description?: string | null;
  status?: 'not_started' | 'iniciada' | 'en_progreso' | 'completada';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  start_date?: Date | null;
  end_date?: Date | null;
  estimated_hours?: number | null;
  actual_hours?: number | null;
  completion_percentage?: number;
  completed_at?: Date | null;
}

/**
 * Task with sub-tasks
 */
export interface TaskWithSubtasks extends Task {
  subtasks: Task[];
}

/**
 * Task with assignments
 */
export interface TaskWithAssignments extends Task {
  assigned_users: Array<{
    user_id: string;
    full_name: string;
    email: string;
  }>;
}
