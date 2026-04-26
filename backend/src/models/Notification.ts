/**
 * Notification Model
 * 
 * Represents system notifications for users
 */

export interface Notification {
  id: string;
  user_id: string;
  type: string; // 'deadline_alert', 'task_assigned', 'request_approved', etc.
  title: string;
  message: string;
  related_task_id: string | null;
  related_project_id: string | null;
  is_read: boolean;
  created_at: Date;
}

/**
 * Data required to create a notification
 */
export interface CreateNotificationData {
  user_id: string;
  type: string;
  title: string;
  message: string;
  related_task_id?: string | null;
  related_project_id?: string | null;
}

/**
 * Notification with additional details (for API responses)
 */
export interface NotificationWithDetails extends Notification {
  task_title?: string;
  project_name?: string;
}
