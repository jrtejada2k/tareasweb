/**
 * Alert Service
 * 
 * Business logic for deadline alerts and notifications
 */

import { query } from '@utils/database';
import logger from '@utils/logger';
import { createNotification } from './notificationService';

/**
 * Check for tasks at risk and create deadline alerts
 * Called by scheduled cron job every 15 minutes
 */
export const checkDeadlineAlerts = async (): Promise<number> => {
  try {
    logger.info('Starting deadline alert check');

    // Get tasks at risk: end_date within 3 days, not completed
    const atRiskTasksResult = await query(
      `SELECT 
        t.id,
        t.title,
        t.status,
        t.priority,
        t.end_date,
        t.project_id,
        p.name as project_name
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       WHERE t.end_date IS NOT NULL
         AND t.end_date <= NOW() + INTERVAL '3 days'
         AND t.status != 'completada'
       ORDER BY t.end_date ASC`
    );

    const atRiskTasks = atRiskTasksResult.rows;

    if (atRiskTasks.length === 0) {
      logger.info('No at-risk tasks found');
      return 0;
    }

    logger.info(`Found ${atRiskTasks.length} at-risk tasks`);

    // Get all master users
    const masterUsersResult = await query(
      `SELECT id FROM users WHERE role = 'master' AND is_active = true`
    );

    const masterUsers = masterUsersResult.rows;

    if (masterUsers.length === 0) {
      logger.warn('No master users found to send alerts');
      return 0;
    }

    // Create notifications for each master user for each at-risk task
    let notificationCount = 0;

    for (const task of atRiskTasks) {
      // Check if notification already exists for this task
      const existingNotificationResult = await query(
        `SELECT id FROM notifications 
         WHERE related_task_id = $1 
           AND type = 'deadline_alert' 
           AND created_at > NOW() - INTERVAL '24 hours'
         LIMIT 1`,
        [task.id]
      );

      // Skip if alert already sent in last 24 hours
      if (existingNotificationResult.rows.length > 0) {
        continue;
      }

      const daysUntilDeadline = Math.ceil(
        (new Date(task.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      const urgencyLevel = daysUntilDeadline <= 1 ? 'URGENT' : 'WARNING';
      const title = `${urgencyLevel}: Task deadline approaching`;
      const message = `Task "${task.title}" in project "${task.project_name}" is due in ${daysUntilDeadline} day(s). Current status: ${task.status}, Priority: ${task.priority}`;

      // Create notification for each master user
      for (const master of masterUsers) {
        await createNotification({
          user_id: master.id,
          type: 'deadline_alert',
          title,
          message,
          related_task_id: task.id,
          related_project_id: task.project_id,
        });

        notificationCount++;
      }
    }

    logger.info('Deadline alerts created', {
      atRiskTasksCount: atRiskTasks.length,
      notificationsCreated: notificationCount,
    });

    return notificationCount;
  } catch (error) {
    logger.error('Check deadline alerts failed', { error });
    throw error;
  }
};

/**
 * Clear task alerts when task is completed
 * @param taskId Task ID that was completed
 */
export const clearTaskAlerts = async (taskId: string): Promise<void> => {
  try {
    const result = await query(
      `DELETE FROM notifications 
       WHERE related_task_id = $1 
         AND type = 'deadline_alert'
       RETURNING id`,
      [taskId]
    );

    const deletedCount = result.rows.length;

    if (deletedCount > 0) {
      logger.info('Task alerts cleared', { taskId, count: deletedCount });
    }
  } catch (error) {
    logger.error('Clear task alerts failed', { error, taskId });
    throw error;
  }
};

/**
 * Create alert notification for specific users
 * Used for custom alerts beyond scheduled checks
 */
export const createAlertNotification = async (
  userIds: string[],
  title: string,
  message: string,
  taskId?: string,
  projectId?: string
): Promise<number> => {
  try {
    let count = 0;

    for (const userId of userIds) {
      await createNotification({
        user_id: userId,
        type: 'alert',
        title,
        message,
        related_task_id: taskId,
        related_project_id: projectId,
      });
      count++;
    }

    logger.info('Alert notifications created', { count, userCount: userIds.length });

    return count;
  } catch (error) {
    logger.error('Create alert notification failed', { error });
    throw error;
  }
};
