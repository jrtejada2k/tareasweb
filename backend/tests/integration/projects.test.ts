/**
 * Project Management Integration Tests
 * 
 * Tests for User Story 2: Project Creation & Management
 * - Project CRUD operations
 * - RBAC enforcement (master-only creation)
 * - Project assignment management
 * - Authorization checks
 * 
 * Test Requirements (FR-007 to FR-011, FR-023-027):
 * - Master users can create/update/delete projects
 * - Regular users can only view assigned projects
 * - Project queries with filtering
 * - User assignment to projects
 */

import request from 'supertest';
import app from '../../src/app';
import { pool } from '../../src/utils/database';

describe('Project API - Integration Tests', () => {
  let masterToken: string;
  let userToken: string;
  let masterUserId: string;
  let regularUserId: string;
  let testProjectId: string;

  beforeAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM projects WHERE name LIKE $1', ['Test Project%']);
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['project-test%@example.com']);

    // Register master user
    const masterRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'project-test-master@example.com',
        password: 'Master@Pass123',
        full_name: 'Project Test Master',
        role: 'master',
      });
    
    masterUserId = masterRes.body.user.id;

    // Login master
    const masterLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'project-test-master@example.com',
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
        email: 'project-test-user@example.com',
        password: 'User@Pass123',
        full_name: 'Project Test User',
        role: 'user',
      });
    
    regularUserId = userRes.body.user.id;

    // Login regular user
    const userLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'project-test-user@example.com',
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
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM projects WHERE name LIKE $1', ['Test Project%']);
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['project-test%@example.com']);
    await pool.end();
  });

  describe('POST /api/v1/projects - Create Project', () => {
    it('should allow master user to create project', async () => {
      const response = await request(app)
        .post('/api/v1/projects')
        .set('Cookie', [`accessToken=${masterToken}`])
        .send({
          name: 'Test Project One',
          description: 'First test project for integration tests',
          status: 'active',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        project: {
          name: 'Test Project One',
          description: 'First test project for integration tests',
          status: 'active',
          created_by: masterUserId,
        },
      });
      expect(response.body.project).toHaveProperty('id');
      expect(response.body.project).toHaveProperty('created_at');

      testProjectId = response.body.project.id;
    });

    it('should reject regular user creating project (403 Forbidden)', async () => {
      const response = await request(app)
        .post('/api/v1/projects')
        .set('Cookie', [`accessToken=${userToken}`])
        .send({
          name: 'Test Project Unauthorized',
          description: 'Should not be created',
          status: 'active',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toMatch(/forbidden|permission/i);
    });

    it('should reject unauthenticated request (401)', async () => {
      const response = await request(app)
        .post('/api/v1/projects')
        .send({
          name: 'Test Project Unauthenticated',
          description: 'Should not be created',
          status: 'active',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/projects')
        .set('Cookie', [`accessToken=${masterToken}`])
        .send({
          // missing name
          description: 'Missing name field',
          status: 'active',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate status enum', async () => {
      const response = await request(app)
        .post('/api/v1/projects')
        .set('Cookie', [`accessToken=${masterToken}`])
        .send({
          name: 'Test Project Invalid Status',
          description: 'Invalid status value',
          status: 'invalid_status',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/projects - List Projects', () => {
    beforeAll(async () => {
      // Create additional test projects
      await request(app)
        .post('/api/v1/projects')
        .set('Cookie', [`accessToken=${masterToken}`])
        .send({
          name: 'Test Project Two',
          description: 'Second test project',
          status: 'active',
        });

      await request(app)
        .post('/api/v1/projects')
        .set('Cookie', [`accessToken=${masterToken}`])
        .send({
          name: 'Test Project Three',
          description: 'Third test project',
          status: 'completed',
        });
    });

    it('should list all projects for master user', async () => {
      const response = await request(app)
        .get('/api/v1/projects')
        .set('Cookie', [`accessToken=${masterToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.projects).toBeInstanceOf(Array);
      expect(response.body.projects.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter projects by status', async () => {
      const response = await request(app)
        .get('/api/v1/projects?status=active')
        .set('Cookie', [`accessToken=${masterToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.projects.every((p: any) => p.status === 'active')).toBe(true);
    });

    it('should return only assigned projects for regular user', async () => {
      const response = await request(app)
        .get('/api/v1/projects')
        .set('Cookie', [`accessToken=${userToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.projects).toBeInstanceOf(Array);
      // User not assigned to any projects yet
      expect(response.body.projects.length).toBe(0);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/projects?page=1&limit=2')
        .set('Cookie', [`accessToken=${masterToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.projects.length).toBeLessThanOrEqual(2);
      expect(response.body).toHaveProperty('pagination');
    });
  });

  describe('GET /api/v1/projects/:id - Get Project by ID', () => {
    it('should get project details for master user', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${testProjectId}`)
        .set('Cookie', [`accessToken=${masterToken}`])
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        project: {
          id: testProjectId,
          name: 'Test Project One',
        },
      });
    });

    it('should return 404 for non-existent project', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/projects/${fakeId}`)
        .set('Cookie', [`accessToken=${masterToken}`])
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid UUID format (400)', async () => {
      const response = await request(app)
        .get('/api/v1/projects/invalid-uuid')
        .set('Cookie', [`accessToken=${masterToken}`])
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/projects/:id - Update Project', () => {
    it('should allow master to update project', async () => {
      const response = await request(app)
        .put(`/api/v1/projects/${testProjectId}`)
        .set('Cookie', [`accessToken=${masterToken}`])
        .send({
          name: 'Test Project One - Updated',
          description: 'Updated description',
          status: 'active',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        project: {
          id: testProjectId,
          name: 'Test Project One - Updated',
          description: 'Updated description',
        },
      });
    });

    it('should reject regular user updating project (403)', async () => {
      const response = await request(app)
        .put(`/api/v1/projects/${testProjectId}`)
        .set('Cookie', [`accessToken=${userToken}`])
        .send({
          name: 'Unauthorized Update',
          description: 'Should not work',
          status: 'active',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/projects/:id/assign - Assign User to Project', () => {
    it('should allow master to assign user to project', async () => {
      const response = await request(app)
        .post(`/api/v1/projects/${testProjectId}/assign`)
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

    it('should allow regular user to view assigned project after assignment', async () => {
      const response = await request(app)
        .get('/api/v1/projects')
        .set('Cookie', [`accessToken=${userToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.projects.length).toBeGreaterThan(0);
      expect(response.body.projects.some((p: any) => p.id === testProjectId)).toBe(true);
    });

    it('should reject duplicate assignment', async () => {
      const response = await request(app)
        .post(`/api/v1/projects/${testProjectId}/assign`)
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
        .post(`/api/v1/projects/${testProjectId}/assign`)
        .set('Cookie', [`accessToken=${userToken}`])
        .send({
          user_id: masterUserId,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/projects/:id/unassign/:userId - Remove User from Project', () => {
    it('should allow master to remove user from project', async () => {
      const response = await request(app)
        .delete(`/api/v1/projects/${testProjectId}/unassign/${regularUserId}`)
        .set('Cookie', [`accessToken=${masterToken}`])
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringMatching(/removed|unassigned/i),
      });
    });

    it('should verify user no longer sees project after removal', async () => {
      const response = await request(app)
        .get('/api/v1/projects')
        .set('Cookie', [`accessToken=${userToken}`])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.projects.some((p: any) => p.id === testProjectId)).toBe(false);
    });
  });

  describe('DELETE /api/v1/projects/:id - Delete Project', () => {
    it('should allow master to delete project', async () => {
      const response = await request(app)
        .delete(`/api/v1/projects/${testProjectId}`)
        .set('Cookie', [`accessToken=${masterToken}`])
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringMatching(/deleted/i),
      });
    });

    it('should return 404 when accessing deleted project', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${testProjectId}`)
        .set('Cookie', [`accessToken=${masterToken}`])
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should reject regular user deleting project (403)', async () => {
      // Create a new project for this test
      const createRes = await request(app)
        .post('/api/v1/projects')
        .set('Cookie', [`accessToken=${masterToken}`])
        .send({
          name: 'Test Project To Delete',
          description: 'Will try to delete as regular user',
          status: 'active',
        });

      const projectId = createRes.body.project.id;

      const response = await request(app)
        .delete(`/api/v1/projects/${projectId}`)
        .set('Cookie', [`accessToken=${userToken}`])
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});
