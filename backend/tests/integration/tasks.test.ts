/**
 * Task Management Integration Tests
 * 
 * Tests for User Story 3-7: Task Operations
 * - Task CRUD operations with hierarchy
 * - Status transitions and validation
 * - Task assignment management
 * - Filtering and querying
 * - RBAC enforcement
 * 
 * Test Requirements (FR-012 to FR-022, FR-028-036):
 * - Master users can create/update tasks
 * - Assigned users can update task status
 * - Parent-child task hierarchy
 * - Status transition validation
 * - Task filtering by multiple criteria
 */

import request from 'supertest';
import app from '../../src/app';
import { pool } from '../../src/utils/database';

describe('Task API - Integration Tests', () => {
  let masterToken: string;
  let userToken: string;
  let masterUserId: string;
  let regularUserId: string;
  let testProjectId: string;
  let parentTaskId: string;
  let childTaskId: string;

  beforeAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM tasks WHERE title LIKE $1', ['Test Task%']);
    await pool.query('DELETE FROM projects WHERE name LIKE $1', ['Task Test Project%']);
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['task-test%@example.com']);

    // Register master user
    const masterRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'task-test-master@example.com',
        password: 'Master@Pass123',
        full_name: 'Task Test Master',
        role: 'master',
      });
    
    masterUserId = masterRes.body.user.id;

    // Login master
    const masterLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'task-test-master@example.com',
        password: 'Master@Pass123',
      });

    const masterCookiesRaw = masterLogin.headers['set-cookie'] as unknown;
    const masterCookies: string[] = Array.isArray(masterCookiesRaw)
      ? masterCookiesRaw
      : masterCookiesRaw
      ? [masterCookiesRaw as string]
      : [];
    {
      const cookie = masterCookies.find(c => c.startsWith('accessToken='));
  let tempMaster = typeof cookie === 'string' ? cookie.split(';')[0] : '';
  masterToken = tempMaster && tempMaster.includes('=') && tempMaster.split('=').length > 1
    ? tempMaster.split('=')[1] || ''
    : '';
    }

    // Register regular user
    const userRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'task-test-user@example.com',
        password: 'User@Pass123',
        full_name: 'Task Test User',
        role: 'user',
      });
    
    regularUserId = userRes.body.user.id;

    // Login regular user
    const userLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'task-test-user@example.com',
        password: 'User@Pass123',
      });

    const userCookiesRaw = userLogin.headers['set-cookie'] as unknown;
    const userCookies: string[] = Array.isArray(userCookiesRaw)
      ? userCookiesRaw
      : userCookiesRaw
      ? [userCookiesRaw as string]
      : [];
    {
      const cookie = userCookies.find(c => c.startsWith('accessToken='));
  let tempUser = typeof cookie === 'string' ? cookie.split(';')[0] : '';
  userToken = tempUser && tempUser.includes('=') && tempUser.split('=').length > 1
    ? tempUser.split('=')[1] || ''
    : '';
    }

    // Create test project
    const projectRes = await request(app)
      .post('/api/v1/projects')
      .set('Cookie', [`accessToken=${masterToken}`])
      .send({
        name: 'Task Test Project',
        description: 'Project for task integration tests',
        status: 'active',
      });

    testProjectId = projectRes.body.project.id;
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM tasks WHERE title LIKE $1', ['Test Task%']);
    await pool.query('DELETE FROM projects WHERE name LIKE $1', ['Task Test Project%']);
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['task-test%@example.com']);
    await pool.end();
  });

  describe('POST /api/v1/tasks - Create Task', () => {
    it('should allow master user to create task', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Cookie', [`accessToken=${masterToken}`])
        .send({
          project_id: testProjectId,
          title: 'Test Task One',
          description: 'First test task for integration tests',
          status: 'pending',
          priority: 'high',
          start_date: '2025-01-01',
          end_date: '2025-01-31',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        task: {
          project_id: testProjectId,
          title: 'Test Task One',
          description: 'First test task for integration tests',
          status: 'pending',
          priority: 'high',
          created_by: masterUserId,
        },
      });
      expect(response.body.task).toHaveProperty('id');
      expect(response.body.task).toHaveProperty('created_at');

      parentTaskId = response.body.task.id;
    });

    it('should create child task with parent_id', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Cookie', [`accessToken=${masterToken}`])
        .send({
          project_id: testProjectId,
          parent_id: parentTaskId,
          title: 'Test Task Child',
          description: 'Child task for hierarchy test',
          status: 'pending',
          priority: 'medium',
          start_date: '2025-01-05',
          end_date: '2025-01-25',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        task: {
          parent_id: parentTaskId,
          title: 'Test Task Child',
        },
      });

      childTaskId = response.body.task.id;
    });

    it('should reject regular user creating task (403)', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Cookie', [`accessToken=${userToken}`])
        .send({
          project_id: testProjectId,
          title: 'Test Task Unauthorized',
          description: 'Should not be created',
          status: 'pending',
          priority: 'low',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toMatch(/forbidden|permission/i);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Cookie', [`accessToken=${masterToken}`])
        .send({
          // missing project_id and title
          description: 'Missing required fields',
          status: 'pending',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate status enum', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Cookie', [`accessToken=${masterToken}`])
        .send({
          project_id: testProjectId,
          title: 'Test Task Invalid Status',
          description: 'Invalid status value',
          status: 'invalid_status',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate priority enum', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Cookie', [`accessToken=${masterToken}`])
        .send({
          project_id: testProjectId,
          title: 'Test Task Invalid Priority',
          description: 'Invalid priority value',
          status: 'pending',
          priority: 'invalid_priority',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate date range (end_date after start_date)', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Cookie', [`accessToken=${masterToken}`])
        .send({
          project_id: testProjectId,
          title: 'Test Task Invalid Dates',
          description: 'End date before start date',
          status: 'pending',
          start_date: '2025-01-31',
          end_date: '2025-01-01',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/tasks - List Tasks', () => {
    beforeAll(async () => {
      // Create additional test tasks
      await request(app)
        .post('/api/v1/tasks')
        .set('Cookie', [`accessToken=${masterToken}`])
        .send({
          project_id: testProjectId,
          title: 'Test Task Two',
          description: 'Second test task',
          status: 'in_progress',
          priority: 'medium',
        });

      await request(app)
        .post('/api/v1/tasks')
        .set('Cookie', [`accessToken=${masterToken}`])
        .send({
          project_id: testProjectId,
          title: 'Test Task Three',
          description: 'Third test task',
          status: 'completed',
          priority: 'low',
        });
    });

    it('should list all tasks for master user', async () => {
      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Cookie', [`accessToken=${masterToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.tasks).toBeInstanceOf(Array);
      expect(response.body.tasks.length).toBeGreaterThanOrEqual(4);
    });

    it('should filter tasks by status', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?status=pending')
        .set('Cookie', [`accessToken=${masterToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.tasks.every((t: any) => t.status === 'pending')).toBe(true);
    });

    it('should filter tasks by project_id', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks?project_id=${testProjectId}`)
        .set('Cookie', [`accessToken=${masterToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.tasks.every((t: any) => t.project_id === testProjectId)).toBe(true);
    });

    it('should filter tasks by priority', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?priority=high')
        .set('Cookie', [`accessToken=${masterToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.tasks.every((t: any) => t.priority === 'high')).toBe(true);
    });

    it('should filter tasks by date range', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?start_date_from=2025-01-01&start_date_to=2025-12-31')
        .set('Cookie', [`accessToken=${masterToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.tasks).toBeInstanceOf(Array);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?page=1&limit=2')
        .set('Cookie', [`accessToken=${masterToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.tasks.length).toBeLessThanOrEqual(2);
      expect(response.body).toHaveProperty('pagination');
    });

    it('should return only assigned tasks for regular user', async () => {
      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Cookie', [`accessToken=${userToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.tasks).toBeInstanceOf(Array);
      // User not assigned to any tasks yet
      expect(response.body.tasks.length).toBe(0);
    });
  });

  describe('GET /api/v1/tasks/:id - Get Task by ID', () => {
    it('should get task details with hierarchy', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/${childTaskId}`)
        .set('Cookie', [`accessToken=${masterToken}`])
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        task: {
          id: childTaskId,
          parent_id: parentTaskId,
          title: 'Test Task Child',
        },
      });
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/tasks/${fakeId}`)
        .set('Cookie', [`accessToken=${masterToken}`])
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid UUID format (400)', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/invalid-uuid')
        .set('Cookie', [`accessToken=${masterToken}`])
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/tasks/:id - Update Task', () => {
    it('should allow master to update task', async () => {
      const response = await request(app)
        .put(`/api/v1/tasks/${parentTaskId}`)
        .set('Cookie', [`accessToken=${masterToken}`])
        .send({
          title: 'Test Task One - Updated',
          description: 'Updated description',
          status: 'in_progress',
          priority: 'critical',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        task: {
          id: parentTaskId,
          title: 'Test Task One - Updated',
          description: 'Updated description',
          status: 'in_progress',
          priority: 'critical',
        },
      });
    });

    it('should reject regular user updating task (403)', async () => {
      const response = await request(app)
        .put(`/api/v1/tasks/${parentTaskId}`)
        .set('Cookie', [`accessToken=${userToken}`])
        .send({
          title: 'Unauthorized Update',
          description: 'Should not work',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/tasks/:id/assign - Assign User to Task', () => {
    it('should allow master to assign user to task', async () => {
      const response = await request(app)
        .post(`/api/v1/tasks/${parentTaskId}/assign`)
        .set('Cookie', [`accessToken=${masterToken}`])
        .send({
          user_id: regularUserId,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringMatching(/assigned/i),
      });
    });

    it('should allow regular user to view assigned task', async () => {
      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Cookie', [`accessToken=${userToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.tasks.length).toBeGreaterThan(0);
      expect(response.body.tasks.some((t: any) => t.id === parentTaskId)).toBe(true);
    });

    it('should reject duplicate assignment', async () => {
      const response = await request(app)
        .post(`/api/v1/tasks/${parentTaskId}/assign`)
        .set('Cookie', [`accessToken=${masterToken}`])
        .send({
          user_id: regularUserId,
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toMatch(/duplicate|already/i);
    });

    it('should reject regular user assigning others (403)', async () => {
      const response = await request(app)
        .post(`/api/v1/tasks/${parentTaskId}/assign`)
        .set('Cookie', [`accessToken=${userToken}`])
        .send({
          user_id: masterUserId,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/tasks/:id/status - Update Task Status', () => {
    it('should allow assigned user to update status', async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${parentTaskId}/status`)
        .set('Cookie', [`accessToken=${userToken}`])
        .send({
          status: 'in_progress',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        task: {
          id: parentTaskId,
          status: 'in_progress',
        },
      });
    });

    it('should validate status transitions', async () => {
      // Try invalid transition (in_progress -> pending not allowed)
      const response = await request(app)
        .patch(`/api/v1/tasks/${parentTaskId}/status`)
        .set('Cookie', [`accessToken=${userToken}`])
        .send({
          status: 'pending',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should allow transition to completed', async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${parentTaskId}/status`)
        .set('Cookie', [`accessToken=${userToken}`])
        .send({
          status: 'completed',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        task: {
          status: 'completed',
        },
      });
    });

    it('should reject non-assigned user updating status', async () => {
      // Create a new master user to test non-assigned access
      const response = await request(app)
        .patch(`/api/v1/tasks/${childTaskId}/status`)
        .set('Cookie', [`accessToken=${userToken}`])
        .send({
          status: 'in_progress',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/tasks/:id/unassign/:userId - Remove User from Task', () => {
    it('should allow master to remove user from task', async () => {
      const response = await request(app)
        .delete(`/api/v1/tasks/${parentTaskId}/unassign/${regularUserId}`)
        .set('Cookie', [`accessToken=${masterToken}`])
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringMatching(/removed|unassigned/i),
      });
    });

    it('should verify user no longer sees task after removal', async () => {
      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Cookie', [`accessToken=${userToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.tasks.some((t: any) => t.id === parentTaskId)).toBe(false);
    });
  });

  describe('DELETE /api/v1/tasks/:id - Delete Task', () => {
    it('should allow master to delete child task first', async () => {
      const response = await request(app)
        .delete(`/api/v1/tasks/${childTaskId}`)
        .set('Cookie', [`accessToken=${masterToken}`])
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringMatching(/deleted/i),
      });
    });

    it('should allow master to delete parent task', async () => {
      const response = await request(app)
        .delete(`/api/v1/tasks/${parentTaskId}`)
        .set('Cookie', [`accessToken=${masterToken}`])
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringMatching(/deleted/i),
      });
    });

    it('should return 404 when accessing deleted task', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/${parentTaskId}`)
        .set('Cookie', [`accessToken=${masterToken}`])
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject regular user deleting task (403)', async () => {
      // Create a new task for this test
      const createRes = await request(app)
        .post('/api/v1/tasks')
        .set('Cookie', [`accessToken=${masterToken}`])
        .send({
          project_id: testProjectId,
          title: 'Test Task To Delete',
          description: 'Will try to delete as regular user',
          status: 'pending',
        });

      const taskId = createRes.body.task.id;

      const response = await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Cookie', [`accessToken=${userToken}`])
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
