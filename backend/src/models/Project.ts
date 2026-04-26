/**
 * Project Model
 * 
 * Represents a project in the system
 */

export interface Project {
  id: string; // UUID
  name: string;
  description: string | null;
  status: 'active' | 'archived' | 'completed'; // Must match database CHECK constraint
  created_by: string; // UUID - user ID
  start_date: Date | null;
  end_date: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Project creation data
 */
export interface CreateProjectData {
  name: string;
  description?: string | null;
  status?: 'active' | 'archived' | 'completed';
  created_by: string;
  start_date?: Date | null;
  end_date?: Date | null;
}

/**
 * Project update data
 */
export interface UpdateProjectData {
  name?: string;
  description?: string | null;
  status?: 'active' | 'archived' | 'completed';
  start_date?: Date | null;
  end_date?: Date | null;
}

/**
 * Project with task count
 */
export interface ProjectWithStats extends Project {
  total_tasks: number;
  completed_tasks: number;
  assigned_users: number;
}
