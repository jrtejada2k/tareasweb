// services/notificationsService.ts
import api from './api';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  related_task_id?: string;
  related_project_id?: string;
  is_read: boolean;
  created_at: string;
}

export const notificationsService = {
  async getAll(isRead?: boolean): Promise<{ notifications: Notification[] }> {
    const params = isRead !== undefined ? { is_read: isRead } : {};
    const response = await api.get('/notifications', { params });
    return { notifications: response.data.data };
  },

  async markAsRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get('/notifications/unread-count');
    return response.data.count;
  },
};
