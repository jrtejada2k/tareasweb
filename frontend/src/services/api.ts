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

    // Only block refresh on the refresh endpoint itself (prevents infinite loop)
    const isRefreshEndpoint = originalRequest.url?.includes('/auth/refresh');
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshEndpoint) {
      originalRequest._retry = true;

      try {
        await authService.refreshToken();
        return apiClient(originalRequest);
      } catch (refreshError) {
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Suppress toast for expected 401s (unauthenticated /auth/me on first load, failed refresh)
    const isAuthEndpoint = originalRequest.url?.includes('/auth/');
    if (!(error.response?.status === 401 && isAuthEndpoint)) {
      const errorMessage = error.response?.data?.message || 'An error occurred';
      toast.error(errorMessage);
    }

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
    // /auth/me returns { success, user: userProfile }
    return response.data.user ?? response.data;
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
    const response = await apiClient.post(`/projects/${projectId}/assign-user`, { userId });
    return response.data;
  },
};

// Tasks Service
export const tasksService = {
  getAll: async (params?: {
    project_id?: string;
    status?: string;
    priority?: string;
    assigned_to_me?: string;
    start_date_from?: string;
    start_date_to?: string;
    end_date_from?: string;
    end_date_to?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('/tasks', { params });
    return response.data;
  },

  getById: async (id: string, includeSubtasks = false) => {
    const response = await apiClient.get(`/tasks/${id}`, {
      params: includeSubtasks ? { include_subtasks: 'true' } : {},
    });
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
    const response = await apiClient.post(`/tasks/${taskId}/assign-user`, { userId });
    return response.data;
  },
};

// Time Entries Service
export const timeEntriesService = {
  getByTask: async (taskId: string) => {
    const response = await apiClient.get('/time-entries', { params: { task_id: taskId } });
    return response.data;
  },

  create: async (data: {
    task_id: string;
    hours_worked: number;
    work_date: string;
    description?: string;
  }) => {
    const response = await apiClient.post('/time-entries', data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/time-entries/${id}`);
    return response.data;
  },
};

// Deadline Requests Service
export const deadlineRequestsService = {
  getAll: async (params?: { status?: string; task_id?: string; project_id?: string }) => {
    const response = await apiClient.get('/deadline-requests', { params });
    return response.data;
  },

  create: async (data: { task_id: string; requested_deadline: string; reason: string }) => {
    const response = await apiClient.post('/deadline-requests', data);
    return response.data;
  },

  approve: async (id: string, review_notes?: string) => {
    const response = await apiClient.patch(`/deadline-requests/${id}/approve`, { review_notes });
    return response.data;
  },

  deny: async (id: string, review_notes?: string) => {
    const response = await apiClient.patch(`/deadline-requests/${id}/deny`, { review_notes });
    return response.data;
  },
};

// Dashboard Service
export const dashboardService = {
  getUserDashboard: async (month?: number, year?: number) => {
    const response = await apiClient.get('/dashboard/user', { params: { month, year } });
    return response.data;
  },

  getMasterDashboard: async () => {
    const response = await apiClient.get('/dashboard/master');
    return response.data;
  },
};

export default apiClient;
