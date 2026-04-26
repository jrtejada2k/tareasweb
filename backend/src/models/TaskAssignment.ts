/**
 * Task Assignment Model
 * 
 * Represents user assignment to tasks
 */

export interface TaskAssignment {
  id: string;
  task_id: string;
  user_id: string;
  assigned_by: string;
  assigned_at: Date;
}

/**
 * Data required to create a new task assignment
 */
export interface CreateTaskAssignmentData {
  task_id: string;
  user_id: string;
  assigned_by: string;
}

/**
 * Task assignment with user details (for API responses)
 */
export interface TaskAssignmentWithUser {
  id: string;
  task_id: string;
  user_id: string;
  user_full_name: string;
  user_email: string;
  assigned_by: string;
  assigner_full_name: string;
  assigned_at: Date;
}

/**
 * User's task assignment view with task details
 */
export interface UserTaskAssignment {
  id: string;
  task_id: string;
  task_title: string;
  task_status: string;
  task_priority: string;
  project_id: string;
  project_name: string;
  assigned_by: string;
  assigner_full_name: string;
  assigned_at: Date;
}
