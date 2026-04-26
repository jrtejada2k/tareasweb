/**
 * Deadline Request Model
 * 
 * Represents deadline extension requests submitted by users
 * for approval by master users
 */

export interface DeadlineRequest {
  id: string;
  task_id: string;
  requested_by: string;
  current_deadline: Date;
  requested_deadline: Date;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  reviewed_by: string | null;
  reviewed_at: Date | null;
  review_notes: string | null;
  created_at: Date;
}

export interface CreateDeadlineRequestData {
  task_id: string;
  requested_by: string;
  current_deadline: Date;
  requested_deadline: Date;
  reason: string;
}

export interface ReviewDeadlineRequestData {
  reviewed_by: string;
  review_notes?: string;
}

export interface DeadlineRequestWithDetails extends DeadlineRequest {
  task_title: string;
  task_status: string;
  project_id: string;
  project_name: string;
  requester_name: string;
  reviewer_name: string | null;
}
