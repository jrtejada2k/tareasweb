// services/usersService.ts
import api from './api';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export const usersService = {
  async getAll(): Promise<{ users: User[] }> {
    const response = await api.get('/users');
    return { users: response.data.data };
  },

  async getById(id: string): Promise<{ user: User }> {
    const response = await api.get(`/users/${id}`);
    return { user: response.data.data };
  },
};
