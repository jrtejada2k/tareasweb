/**
 * Notification Service
 * 
 * Business logic for managing user notifications
 */

import { query } from '@utils/database';
import logger from '@utils/logger';
import { Notification, CreateNotificationData, NotificationWithDetails } from '@models/Notification';

/**
 * Create a notification
 */
export const createNotification = async (
  data: CreateNotificationData
): Promise<Notification> => {
  try {
    const result = await query<Notification>(
      `INSERT INTO notifications (user_id, type, title, message, related_task_id, related_project_id, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
       RETURNING *`,
      [
        data.user_id,
        data.type,
        data.title,
        data.message,
        data.related_task_id || null,
        data.related_project_id || null,
      ]
    );

    const notification = result.rows[0];
    
    if (!notification) {
      throw new Error('Failed to create notification');
    }

    logger.info('Notification created', {
      notificationId: notification.id,
      userId: data.user_id,
      type: data.type,
    });

    return notification;
  } catch (error) {
    logger.error('Create notification failed', { error, data });
    throw error;
  }
};

/**
 * Get notifications for a user
 * @param userId User ID
 * @param filters Optional filters (is_read, type)
 * @param pagination Page and limit
 */
export const getNotifications = async (
  userId: string,
  filters?: {
    is_read?: boolean;
    type?: string;
  },
  pagination?: {
    page?: number;
    limit?: number;
  }
): Promise<{ notifications: NotificationWithDetails[]; total: number }> => {
  try {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['n.user_id = $1'];
    const values: any[] = [userId];
    let paramIndex = 2;

    if (filters?.is_read !== undefined) {
      conditions.push(`n.is_read = $${paramIndex++}`);
      values.push(filters.is_read);
    }

    if (filters?.type) {
      conditions.push(`n.type = $${paramIndex++}`);
      values.push(filters.type);
    }

    const whereClause = conditions.join(' AND ');

    // Get notifications with related task/project details
    const notificationsResult = await query<NotificationWithDetails>(
      `SELECT 
        n.*,
        t.title as task_title,
        p.name as project_name
       FROM notifications n
       LEFT JOIN tasks t ON t.id = n.related_task_id
       LEFT JOIN projects p ON p.id = n.related_project_id
       WHERE ${whereClause}
       ORDER BY n.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...values, limit, offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM notifications n
       WHERE ${whereClause}`,
      values
    );

    const total = parseInt(countResult.rows[0]?.total || '0', 10);

    logger.debug('Notifications retrieved', { userId, count: notificationsResult.rows.length });

    return {
      notifications: notificationsResult.rows,
      total,
    };
  } catch (error) {
    logger.error('Get notifications failed', { error, userId });
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId: string, userId: string): Promise<void> => {
  try {
    await query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );

    logger.info('Notification marked as read', { notificationId, userId });
  } catch (error) {
    logger.error('Mark notification as read failed', { error, notificationId });
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId: string): Promise<number> => {
  try {
    const result = await query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE user_id = $1 AND is_read = false
       RETURNING id`,
      [userId]
    );

    const count = result.rows.length;

    logger.info('All notifications marked as read', { userId, count });

    return count;
  } catch (error) {
    logger.error('Mark all notifications as read failed', { error, userId });
    throw error;
  }
};

/**
 * Get unread notification count for a user
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const result = await query(
      `SELECT COUNT(*) as count
       FROM notifications
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    return parseInt(result.rows[0]?.count || '0', 10);
  } catch (error) {
    logger.error('Get unread count failed', { error, userId });
    throw error;
  }
};
