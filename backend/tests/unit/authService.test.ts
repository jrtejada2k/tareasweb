/**
 * Auth Service Unit Tests
 * 
 * Unit tests for authentication service with mocked database
 * Tests business logic without database dependencies
 */

import * as authService from '../../src/services/authService';
import * as database from '../../src/utils/database';
import * as bcrypt from '../../src/utils/bcrypt';
import * as jwt from '../../src/utils/jwt';
import { ConflictError, UnauthorizedError } from '../../src/middleware/errorMiddleware';
import { UserRole } from '../../src/types/user.types';

// Mock dependencies
jest.mock('../../src/utils/database');
jest.mock('../../src/utils/bcrypt');
jest.mock('../../src/utils/jwt');
jest.mock('../../src/utils/logger');

describe('Auth Service - Unit Tests', () => {
  const mockQuery = database.query as jest.MockedFunction<typeof database.query>;
  const mockTransaction = database.transaction as jest.MockedFunction<typeof database.transaction>;
  const mockHashPassword = bcrypt.hashPassword as jest.MockedFunction<typeof bcrypt.hashPassword>;
  const mockComparePassword = bcrypt.comparePassword as jest.MockedFunction<typeof bcrypt.comparePassword>;
  const mockGenerateTokenPair = jwt.generateTokenPair as jest.MockedFunction<typeof jwt.generateTokenPair>;
  const mockVerifyRefreshToken = jwt.verifyRefreshToken as jest.MockedFunction<typeof jwt.verifyRefreshToken>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        full_name: 'Test User',
        role: UserRole.USER,
      };

      // Mock: No existing user
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock: Password hashing
      mockHashPassword.mockResolvedValueOnce('$2b$12$hashedpassword');

      // Mock: User creation
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: registerData.email,
            password_hash: '$2b$12$hashedpassword',
            full_name: registerData.full_name,
            role: registerData.role,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
            last_login_at: null,
          },
        ],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });

      const result = await authService.registerUser(registerData);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email', registerData.email);
      expect(result).toHaveProperty('full_name', registerData.full_name);
      expect(result).toHaveProperty('role', registerData.role);
      expect(result).not.toHaveProperty('password_hash');
      expect(mockHashPassword).toHaveBeenCalledWith(registerData.password);
    });

    it('should throw ConflictError if user already exists', async () => {
      const registerData = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
        full_name: 'Existing User',
        role: UserRole.USER,
      };

      // Mock: Existing user found
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: '123e4567-e89b-12d3-a456-426614174000' }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await expect(authService.registerUser(registerData)).rejects.toThrow(ConflictError);
      expect(mockHashPassword).not.toHaveBeenCalled();
    });
  });

  describe('loginUser', () => {
    it('should login user with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: loginData.email,
        password_hash: '$2b$12$hashedpassword',
        full_name: 'Test User',
        role: 'user' as const,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        last_login_at: null,
      };

      // Mock: User found
      mockQuery.mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock: Password comparison
      mockComparePassword.mockResolvedValueOnce(true);

      // Mock: Token generation
      mockGenerateTokenPair.mockReturnValueOnce({
        accessToken: 'mock.access.token',
        refreshToken: 'mock.refresh.token',
      });

      // Mock: Update last login
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      });

      // Mock: Store refresh token
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });

      const result = await authService.loginUser(loginData);

      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(loginData.email);
      expect(result).toHaveProperty('accessToken', 'mock.access.token');
      expect(result).toHaveProperty('refreshToken', 'mock.refresh.token');
      expect(mockComparePassword).toHaveBeenCalledWith(loginData.password, mockUser.password_hash);
      expect(mockGenerateTokenPair).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('should throw UnauthorizedError if user not found', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'SecurePass123!',
      };

      // Mock: User not found
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await expect(authService.loginUser(loginData)).rejects.toThrow(UnauthorizedError);
      expect(mockComparePassword).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError if password is invalid', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: loginData.email,
        password_hash: '$2b$12$hashedpassword',
        full_name: 'Test User',
        role: 'user' as const,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        last_login_at: null,
      };

      // Mock: User found
      mockQuery.mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock: Password comparison fails
      mockComparePassword.mockResolvedValueOnce(false);

      await expect(authService.loginUser(loginData)).rejects.toThrow(UnauthorizedError);
      expect(mockGenerateTokenPair).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError if account is disabled', async () => {
      const loginData = {
        email: 'disabled@example.com',
        password: 'SecurePass123!',
      };

      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: loginData.email,
        password_hash: '$2b$12$hashedpassword',
        full_name: 'Disabled User',
        role: 'user' as const,
        is_active: false,
        created_at: new Date(),
        updated_at: new Date(),
        last_login_at: null,
      };

      // Mock: User found but inactive
      mockQuery.mockResolvedValueOnce({
        rows: [mockUser],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await expect(authService.loginUser(loginData)).rejects.toThrow(UnauthorizedError);
      expect(mockComparePassword).not.toHaveBeenCalled();
    });
  });

  describe('logoutUser', () => {
    it('should invalidate refresh token on logout', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const token = 'mock.refresh.token';

      // Mock: Delete refresh token
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: 'DELETE',
        oid: 0,
        fields: [],
      });

      await authService.logoutUser(userId, token);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1 AND token_hash = $2'),
        expect.arrayContaining([userId, expect.any(String)])
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('should generate new access token with valid refresh token', async () => {
      const refreshToken = 'valid.refresh.token';
      const mockPayload = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        role: 'user' as const,
        type: 'refresh' as const,
      };

      // Mock: Verify refresh token
      mockVerifyRefreshToken.mockReturnValueOnce(mockPayload);

      // Mock: Check token exists in database
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'token-id', user_id: mockPayload.userId }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      // Mock: Generate new token pair
      mockGenerateTokenPair.mockReturnValueOnce({
        accessToken: 'new.access.token',
        refreshToken: 'new.refresh.token',
      });

      // Mock: Get user
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: mockPayload.userId, email: mockPayload.email, role: 'user', is_active: true }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      const result = await authService.refreshAccessToken(refreshToken);

  expect(result).toHaveProperty('accessToken', 'new.access.token');
      expect(mockVerifyRefreshToken).toHaveBeenCalledWith(refreshToken);
    });

    it('should throw UnauthorizedError if refresh token is invalid', async () => {
      const refreshToken = 'invalid.refresh.token';

      // Mock: Verify refresh token throws error
      mockVerifyRefreshToken.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshAccessToken(refreshToken)).rejects.toThrow();
    });

    it('should throw UnauthorizedError if token not found in database', async () => {
      const refreshToken = 'valid.refresh.token';
      const mockPayload = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        role: 'user' as const,
        type: 'refresh' as const,
      };

      // Mock: Verify refresh token
      mockVerifyRefreshToken.mockReturnValueOnce(mockPayload);

      // Mock: Token not found in database
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });

      await expect(authService.refreshAccessToken(refreshToken)).rejects.toThrow(UnauthorizedError);
    });
  });
});
