/**
 * Authentication Integration Tests
 * 
 * Tests for User Story 1: Secure User Authentication
 * - User registration
 * - Login with credentials
 * - JWT token validation
 * - Token refresh
 * - Logout
 * 
 * Test Requirements (FR-001 to FR-006):
 * - Register new users with email/password
 * - Login returns JWT access + refresh tokens in HttpOnly cookies
 * - Protected routes require valid JWT
 * - Token refresh rotation
 * - Logout clears tokens and invalidates refresh token
 */

import request from 'supertest';
import app from '../../src/app';
import { pool } from '../../src/utils/database';

describe('Authentication API - POST /api/v1/auth/register', () => {
  beforeAll(async () => {
    // Clean up test database before tests
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['test%@example.com']);
  });

  afterAll(async () => {
    // Clean up and close database connection
    await pool.query('DELETE FROM users WHERE email LIKE $1', ['test%@example.com']);
    await pool.end();
  });

  describe('Successful Registration', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'testuser1@example.com',
          password: 'Test@Pass123',
          full_name: 'Test User One',
          role: 'user',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('registered'),
        user: {
          email: 'testuser1@example.com',
          full_name: 'Test User One',
          role: 'user',
        },
      });
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).toHaveProperty('created_at');
    });

    it('should register a master user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'testmaster1@example.com',
          password: 'Master@Pass123',
          full_name: 'Test Master One',
          role: 'master',
        })
        .expect(201);

      expect(response.body.user.role).toBe('master');
    });
  });

  describe('Validation Errors', () => {
    it('should reject registration with invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test@Pass123',
          full_name: 'Test User',
          role: 'user',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'testuser2@example.com',
          password: 'weak',
          full_name: 'Test User Two',
          role: 'user',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject registration with missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'testuser3@example.com',
          password: 'Test@Pass123',
          // missing full_name and role
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject duplicate email registration', async () => {
      // First registration
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'testduplicate@example.com',
          password: 'Test@Pass123',
          full_name: 'Test Duplicate',
          role: 'user',
        })
        .expect(201);

      // Attempt duplicate registration
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'testduplicate@example.com',
          password: 'Different@Pass123',
          full_name: 'Test Duplicate Again',
          role: 'user',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatchObject({
        code: expect.stringMatching(/email|duplicate/i),
      });
    });
  });
});

describe('Authentication API - POST /api/v1/auth/login', () => {
  let testUserEmail: string;
  let testUserPassword: string;

  beforeAll(async () => {
    // Register a test user for login tests
    testUserEmail = 'testlogin@example.com';
    testUserPassword = 'Login@Pass123';

    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testUserEmail,
        password: testUserPassword,
        full_name: 'Test Login User',
        role: 'user',
      });
  });

  describe('Successful Login', () => {
    it('should login with valid credentials and set JWT cookies', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUserEmail,
          password: testUserPassword,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('login'),
        user: {
          email: testUserEmail,
          full_name: 'Test Login User',
          role: 'user',
        },
      });

      // Verify JWT tokens are set in HttpOnly cookies
      const rawCookies = response.headers['set-cookie'] as unknown;
      const cookies: string[] = Array.isArray(rawCookies)
        ? rawCookies
        : rawCookies
        ? [rawCookies as string]
        : [];
      expect(cookies).toBeDefined();
      expect(cookies.some(cookie => cookie.startsWith('accessToken='))).toBe(true);
      expect(cookies.some(cookie => cookie.startsWith('refreshToken='))).toBe(true);

      // Verify HttpOnly flag
      const accessTokenCookie = cookies.find(c => c.startsWith('accessToken='));
      expect(accessTokenCookie).toMatch(/HttpOnly/);
    });
  });

  describe('Authentication Failures', () => {
    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUserPassword,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toMatch(/invalid|credentials/i);
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUserEmail,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUserEmail,
          // missing password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('Protected Routes - GET /api/v1/auth/profile', () => {
  let accessToken: string;
  let testUserEmail: string;

  beforeAll(async () => {
    // Register and login to get access token
    testUserEmail = 'testprofile@example.com';
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testUserEmail,
        password: 'Profile@Pass123',
        full_name: 'Test Profile User',
        role: 'user',
      });

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUserEmail,
        password: 'Profile@Pass123',
      });

    const rawCookies = loginResponse.headers['set-cookie'] as unknown;
    const cookies: string[] = Array.isArray(rawCookies)
      ? rawCookies
      : rawCookies
      ? [rawCookies as string]
      : [];
    const accessTokenCookie = cookies.find(c => c.startsWith('accessToken='));
  let tempAccess = typeof accessTokenCookie === 'string' ? accessTokenCookie.split(';')[0] : '';
  accessToken = tempAccess && tempAccess.includes('=') && tempAccess.split('=').length > 1
    ? tempAccess.split('=')[1] || ''
    : '';
  });

  it('should access protected route with valid JWT token', async () => {
    const response = await request(app)
      .get('/api/v1/auth/profile')
      .set('Cookie', [`accessToken=${accessToken}`])
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      user: {
        email: testUserEmail,
        full_name: 'Test Profile User',
        role: 'user',
      },
    });
  });

  it('should reject access without JWT token (401)', async () => {
    const response = await request(app)
      .get('/api/v1/auth/profile')
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toMatch(/unauthorized|token/i);
  });

  it('should reject access with invalid JWT token (401)', async () => {
    const response = await request(app)
      .get('/api/v1/auth/profile')
      .set('Cookie', ['accessToken=invalid.jwt.token'])
      .expect(401);

    expect(response.body.success).toBe(false);
  });
});

describe('Token Refresh - POST /api/v1/auth/refresh', () => {
  let refreshToken: string;

  beforeAll(async () => {
    // Register and login to get refresh token
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'testrefresh@example.com',
        password: 'Refresh@Pass123',
        full_name: 'Test Refresh User',
        role: 'user',
      });

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'testrefresh@example.com',
        password: 'Refresh@Pass123',
      });

    const rawCookiesLogin = loginResponse.headers['set-cookie'] as unknown;
    const cookies: string[] = Array.isArray(rawCookiesLogin)
      ? rawCookiesLogin
      : rawCookiesLogin
      ? [rawCookiesLogin as string]
      : [];
    const refreshTokenCookie = cookies.find(c => c.startsWith('refreshToken='));
  let tempRefresh = typeof refreshTokenCookie === 'string' ? refreshTokenCookie.split(';')[0] : '';
  refreshToken = tempRefresh && tempRefresh.includes('=') && tempRefresh.split('=').length > 1
    ? tempRefresh.split('=')[1] || ''
    : '';
  });

  it('should refresh access token with valid refresh token', async () => {
    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [`refreshToken=${refreshToken}`])
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      message: expect.stringContaining('refresh'),
    });

    // Verify new tokens are set
    const rawCookies2 = response.headers['set-cookie'] as unknown;
    const cookies: string[] = Array.isArray(rawCookies2)
      ? rawCookies2
      : rawCookies2
      ? [rawCookies2 as string]
      : [];
    expect(cookies.some(c => c.startsWith('accessToken='))).toBe(true);
    expect(cookies.some(c => c.startsWith('refreshToken='))).toBe(true);
  });

  it('should reject refresh with missing refresh token (401)', async () => {
    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  it('should reject refresh with invalid refresh token (401)', async () => {
    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', ['refreshToken=invalid.refresh.token'])
      .expect(401);

    expect(response.body.success).toBe(false);
  });
});

describe('Logout - POST /api/v1/auth/logout', () => {
  let accessToken: string;
  let refreshToken: string;

  beforeEach(async () => {
    // Register and login before each logout test
    const timestamp = Date.now();
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `testlogout${timestamp}@example.com`,
        password: 'Logout@Pass123',
        full_name: 'Test Logout User',
        role: 'user',
      });

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: `testlogout${timestamp}@example.com`,
        password: 'Logout@Pass123',
      });

    const rawCookies3 = loginResponse.headers['set-cookie'] as unknown;
    const cookies: string[] = Array.isArray(rawCookies3)
      ? rawCookies3
      : rawCookies3
      ? [rawCookies3 as string]
      : [];
    const accessTokenCookie = cookies.find(c => c.startsWith('accessToken='));
    const refreshTokenCookie = cookies.find(c => c.startsWith('refreshToken='));
  accessToken = (typeof accessTokenCookie === 'string' && accessTokenCookie.includes('=') && accessTokenCookie.split(';')[0].split('=').length > 1)
    ? accessTokenCookie.split(';')[0].split('=')[1] || ''
    : '';
  refreshToken = (typeof refreshTokenCookie === 'string' && refreshTokenCookie.includes('=') && refreshTokenCookie.split(';')[0].split('=').length > 1)
    ? refreshTokenCookie.split(';')[0].split('=')[1] || ''
    : '';
  });

  it('should logout successfully and clear JWT cookies', async () => {
    const response = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', [`accessToken=${accessToken}`, `refreshToken=${refreshToken}`])
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      message: expect.stringContaining('logout'),
    });

    // Verify tokens are cleared (Max-Age=0 or empty value)
    const rawCookiesLogout = response.headers['set-cookie'] as unknown;
    const cookies: string[] = Array.isArray(rawCookiesLogout)
      ? rawCookiesLogout
      : rawCookiesLogout
      ? [rawCookiesLogout as string]
      : [];
    expect(cookies.some(c => c.includes('accessToken=') && (c.includes('Max-Age=0') || c.includes('accessToken=;')))).toBe(true);
    expect(cookies.some(c => c.includes('refreshToken=') && (c.includes('Max-Age=0') || c.includes('refreshToken=;')))).toBe(true);
  });

  it('should reject accessing protected route after logout', async () => {
    // Logout first
    await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', [`accessToken=${accessToken}`, `refreshToken=${refreshToken}`])
      .expect(200);

    // Try to access protected route with old token
    const response = await request(app)
      .get('/api/v1/auth/profile')
      .set('Cookie', [`accessToken=${accessToken}`])
      .expect(401);

    expect(response.body.success).toBe(false);
  });

  it('should reject refresh token after logout', async () => {
    // Logout first
    await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', [`accessToken=${accessToken}`, `refreshToken=${refreshToken}`])
      .expect(200);

    // Try to refresh with old refresh token
    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [`refreshToken=${refreshToken}`])
      .expect(401);

    expect(response.body.success).toBe(false);
  });
});
