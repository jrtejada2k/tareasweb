/**
 * Project Service Unit Tests
 * 
 * Unit tests for project service with mocked database
 * Tests business logic without database dependencies
 */

import * as projectService from '../../src/services/projectService';
import * as database from '../../src/utils/database';
import { NotFoundError, ForbiddenError, ConflictError } from '../../src/middleware/errorMiddleware';

// Mock dependencies
jest.mock('../../src/utils/database');
jest.mock('../../src/utils/logger');

describe('Project Service - Unit Tests', () => {
  const mockQuery = database.query as jest.MockedFunction<typeof database.query>;
  const mockTransaction = database.transaction as jest.MockedFunction<typeof database.transaction>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    it('should create a new project successfully', async () => {
      const projectData = {
        name: 'New Project',
        description: 'Project description',
        status: 'active' as const,
        created_by: '123e4567-e89b-12d3-a456-426614174000',
      };

      const mockProject = {
        id: 'proj-123e4567-e89b-12d3-a456-426614174000',
        name: projectData.name,
        description: projectData.description,
        status: projectData.status,
        created_by: projectData.created_by,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock: Count query
      mockQuery.mockResolvedValueOnce({
        rows: [{ total: '2' } as any],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock: Get projects
      mockQuery.mockResolvedValueOnce({
  rows: [mockProject],
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO projects'),
        expect.arrayContaining([projectData.name, projectData.description, projectData.status, projectData.created_by])
      );
    });
  });

  describe('getProjectById', () => {
    it('should return project when found', async () => {
      const projectId = 'proj-123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-123e4567-e89b-12d3-a456-426614174000';
      const userRole = 'master';

      const mockProject = {
        id: projectId,
        name: 'Test Project',
        description: 'Test description',
        status: 'active' as const,
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock: Select project
      mockQuery.mockResolvedValueOnce({
        rows: [mockProject],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });
        // Mock count query for getProjectById
        mockQuery.mockResolvedValueOnce({
          rows: [{ total: '1' } as any],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: [],
        });

  const result = await projectService.getProjectById(projectId, userId, userRole);

      expect(result).toMatchObject({
        id: projectId,
        name: 'Test Project',
      });
    });

    it('should throw NotFoundError when project not found', async () => {
      const projectId = 'nonexistent-proj-id';
      const userId = 'user-123e4567-e89b-12d3-a456-426614174000';
      const userRole = 'user';

      // Mock: Project not found
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });
        // Mock count query for getProjectById
        mockQuery.mockResolvedValueOnce({
          rows: [{ total: '0' } as any],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: [],
        });

      await expect(projectService.getProjectById(projectId, userId, userRole)).rejects.toThrow(NotFoundError);
    });

    it('should enforce assignment for regular users', async () => {
      const projectId = 'proj-123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-123e4567-e89b-12d3-a456-426614174000';
      const userRole = 'user';

      // Mock: Project found but user not assigned
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

  await expect(projectService.getProjectById(projectId, userId, userRole)).rejects.toThrow(ForbiddenError);
    });
  });

  describe('updateProject', () => {
    it('should update project successfully', async () => {
      const projectId = 'proj-123e4567-e89b-12d3-a456-426614174000';
      const updateData = {
        name: 'Updated Project',
        description: 'Updated description',
        status: 'completed' as const,
      };

      const mockUpdatedProject = {
        id: projectId,
        name: updateData.name,
        description: updateData.description,
        status: updateData.status,
        created_by: 'user-123',
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock: Check project exists
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: projectId }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });
        // Mock count query for updateProject
        mockQuery.mockResolvedValueOnce({
          rows: [{ total: '1' } as any],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: [],
        });

      // Mock: Update project
      mockQuery.mockResolvedValueOnce({
        rows: [mockUpdatedProject],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      });

  const result = await projectService.updateProject(projectId, updateData as any, 'user-123');

      expect(result).toMatchObject({
        id: projectId,
        name: updateData.name,
        status: updateData.status,
      });
    });

    it('should throw NotFoundError if project does not exist', async () => {
      const projectId = 'nonexistent-proj-id';
      const updateData = {
        name: 'Updated Project',
      };

      // Mock: Project not found
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });
        // Mock count query for updateProject
        mockQuery.mockResolvedValueOnce({
          rows: [{ total: '0' } as any],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: [],
        });

  await expect(projectService.updateProject(projectId, updateData as any, 'user-123')).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      const projectId = 'proj-123e4567-e89b-12d3-a456-426614174000';

      // Mock: Check project exists
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: projectId }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });
        // Mock count query for deleteProject
        mockQuery.mockResolvedValueOnce({
          rows: [{ total: '1' } as any],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: [],
        });

      // Mock: Delete project
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: 'DELETE',
        oid: 0,
        fields: [],
      });

  await projectService.deleteProject(projectId, 'user-123');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM projects'),
        [projectId]
      );
    });

    it('should throw NotFoundError if project does not exist', async () => {
      const projectId = 'nonexistent-proj-id';

      // Mock: Project not found
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });
        // Mock count query for deleteProject
        mockQuery.mockResolvedValueOnce({
          rows: [{ total: '0' } as any],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: [],
        });

  await expect(projectService.deleteProject(projectId, 'user-123')).rejects.toThrow(NotFoundError);
    });
  });

  describe('assignUserToProject', () => {
    it('should assign user to project successfully', async () => {
      const projectId = 'proj-123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-123e4567-e89b-12d3-a456-426614174000';
      const assignedBy = 'master-123e4567-e89b-12d3-a456-426614174000';

      // Mock: Check project exists
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: projectId }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock: Check user exists
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: userId }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock: Check existing assignment
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock: Insert assignment
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'assignment-id', project_id: projectId, user_id: userId }],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });

  const result = await projectService.assignUserToProject(projectId, userId, assignedBy);

      expect(result).toHaveProperty('project_id', projectId);
      expect(result).toHaveProperty('user_id', userId);
    });

    it('should throw ConflictError if user already assigned', async () => {
      const projectId = 'proj-123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-123e4567-e89b-12d3-a456-426614174000';
      const assignedBy = 'master-123e4567-e89b-12d3-a456-426614174000';

      // Mock: Check project exists
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: projectId }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock: Check user exists
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: userId }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock: Assignment already exists
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'existing-assignment' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await expect(projectService.assignUserToProject(projectId, userId, assignedBy)).rejects.toThrow(ConflictError);
    });
  });

  describe('listProjects', () => {
    it('should list all projects for master user', async () => {
      const userId = 'master-123e4567-e89b-12d3-a456-426614174000';
      const userRole = 'master';
      const filters = { status: 'active' as const };

      const mockProjects = [
        {
          id: 'proj-1',
          name: 'Project 1',
          description: 'Description 1',
          status: 'active' as const,
          created_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'proj-2',
          name: 'Project 2',
          description: 'Description 2',
          status: 'active' as const,
          created_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Mock: Select projects
      mockQuery.mockResolvedValueOnce({
        rows: mockProjects,
        rowCount: 2,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock: Count query
      mockQuery.mockResolvedValueOnce({
        rows: [{ total: '2' } as any],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

  const result = await projectService.listProjects({ status: filters.status as any, userId, userRole, page: 1, limit: 20 });

      expect(result.projects).toHaveLength(2);
  expect((result as any).pagination.total).toBe(2);
    });

    it('should list only assigned projects for regular user', async () => {
      const userId = 'user-123e4567-e89b-12d3-a456-426614174000';
      const userRole = 'user';
      const filters = {};

      const mockProjects = [
        {
          id: 'proj-1',
          name: 'Assigned Project',
          description: 'User is assigned to this project',
          status: 'active' as const,
          created_by: 'master-123',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Mock: Count query with JOIN on project_assignments
      mockQuery.mockResolvedValueOnce({
        rows: [{ count: '1' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock: Select projects with JOIN
      mockQuery.mockResolvedValueOnce({
        rows: mockProjects,
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

  const result = await projectService.listProjects({ userId, userRole, page: 1, limit: 20 } as any);

      expect(result.projects).toHaveLength(1);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('JOIN project_assignments'),
        expect.arrayContaining([userId])
      );
    });
  });
});
