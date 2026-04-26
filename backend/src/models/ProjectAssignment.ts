/**
 * ProjectAssignment Model
 * 
 * Represents user assignments to projects
 */

export interface ProjectAssignment {
  id: string; // UUID
  project_id: string; // UUID
  user_id: string; // UUID
  assigned_by: string; // UUID - master user who made the assignment
  assigned_at: Date;
}

/**
 * Project assignment creation data
 */
export interface CreateProjectAssignmentData {
  project_id: string;
  user_id: string;
  assigned_by: string;
}

/**
 * Project assignment with user details
 */
export interface ProjectAssignmentWithUser extends ProjectAssignment {
  user_full_name: string;
  user_email: string;
  assigner_full_name: string;
}

/**
 * User assignment with project details
 */
export interface UserProjectAssignment {
  id: string;
  project_id: string;
  project_name: string;
  project_status: string;
  assigned_at: Date;
  assigned_by: string;
  assigner_full_name: string;
}
