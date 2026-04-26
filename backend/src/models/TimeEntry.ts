/**
 * Time Entry Model
 * 
 * Represents time logged by users on tasks
 */

export interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  hours_worked: number;
  work_date: Date;
  description: string | null;
  created_at: Date;
}

export interface CreateTimeEntryData {
  task_id: string;
  user_id: string;
  hours_worked: number;
  work_date: Date;
  description?: string;
}

export interface TimeEntryWithDetails extends TimeEntry {
  task_title: string;
  task_status: string;
  project_id: string;
  project_name: string;
  user_name: string;
}
