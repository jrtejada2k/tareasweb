/**
 * Project Type Definitions
 * 
 * DTOs and types for project management
 */

// Project status enum (must match database CHECK constraint)
export enum ProjectStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  COMPLETED = 'completed',
}

// Create project DTO
export interface CreateProjectDTO {
  name: string;
  description?: string;
  status?: ProjectStatus;
  start_date?: string; // ISO date string
  end_date?: string; // ISO date string
}

// Update project DTO
export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  start_date?: string | null; // ISO date string
  end_date?: string | null; // ISO date string
}

// Project DTO (for API responses)
export interface ProjectDTO {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  created_by: string;
  start_date: string | null; // ISO date string
  end_date: string | null; // ISO date string
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

// Project summary DTO (for lists)
export interface ProjectSummaryDTO {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  total_tasks?: number;
  completed_tasks?: number;
  assigned_users?: number;
}

// Project with tasks DTO
export interface ProjectWithTasksDTO extends ProjectDTO {
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    assigned_to: string | null;
  }>;
}

// Project list response
export interface ProjectListResponse {
  success: boolean;
  data: ProjectSummaryDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Project response
export interface ProjectResponse {
  success: boolean;
  data: ProjectDTO;
}

// Project deleted response
export interface ProjectDeleteResponse {
  success: boolean;
  message: string;
}
