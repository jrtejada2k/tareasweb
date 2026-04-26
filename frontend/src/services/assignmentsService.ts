// services/assignmentsService.ts
import api from './api';

export const assignmentsService = {
  // Project assignments
  async assignUserToProject(projectId: string, userId: string): Promise<void> {
    await api.post(`/projects/${projectId}/assign-user`, { user_id: userId });
  },

  async removeUserFromProject(projectId: string, userId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/unassign-user/${userId}`);
  },

  async getProjectUsers(projectId: string): Promise<any> {
    const response = await api.get(`/projects/${projectId}/users`);
    return response.data;
  },

  // Task assignments
  async assignUserToTask(taskId: string, userId: string): Promise<void> {
    await api.post(`/tasks/${taskId}/assign-user`, { user_id: userId });
  },

  async removeUserFromTask(taskId: string, userId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}/unassign-user/${userId}`);
  },

  async getTaskUsers(taskId: string): Promise<any> {
    const response = await api.get(`/tasks/${taskId}/users`);
    return response.data;
  },
};
