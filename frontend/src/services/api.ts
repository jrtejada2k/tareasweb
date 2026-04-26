import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await authService.refreshToken();
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Show error toast
    const errorMessage = error.response?.data?.message || 'An error occurred';
    toast.error(errorMessage);

    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (email: string, password: string, full_name: string) => {
    const response = await apiClient.post('/auth/register', {
      email,
      password,
      full_name,
    });
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  refreshToken: async () => {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};

// Projects Service
export const projectsService = {
  getAll: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get('/projects', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data;
  },

  create: async (data: { name: string; description?: string; status?: string }) => {
    const response = await apiClient.post('/projects', data);
    return response.data;
  },

  update: async (id: string, data: { name?: string; description?: string; status?: string }) => {
    const response = await apiClient.put(`/projects/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/projects/${id}`);
    return response.data;
  },

  assignUser: async (projectId: string, userId: string) => {
    const response = await apiClient.post(`/projects/${projectId}/assign`, { user_id: userId });
    return response.data;
  },
};

// Tasks Service
export const tasksService = {
  getAll: async (params?: {
    project_id?: string;
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/tasks', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/tasks/${id}`);
    return response.data;
  },

  create: async (data: {
    project_id: string;
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    start_date?: string;
    end_date?: string;
    parent_task_id?: string;
  }) => {
    const response = await apiClient.post('/tasks', data);
    return response.data;
  },

  update: async (
    id: string,
    data: {
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      start_date?: string;
      end_date?: string;
    }
  ) => {
    const response = await apiClient.put(`/tasks/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await apiClient.patch(`/tasks/${id}/status`, { status });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/tasks/${id}`);
    return response.data;
  },

  assignUser: async (taskId: string, userId: string) => {
    const response = await apiClient.post(`/tasks/${taskId}/assign`, { user_id: userId });
    return response.data;
  },
};

export default apiClient;
