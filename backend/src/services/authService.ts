/**
 * Authentication Service
 * 
 * Business logic for user authentication, registration, and token management
 */

import { query } from '@utils/database';
import { hashPassword, comparePassword } from '@utils/bcrypt';
import { generateTokenPair, verifyRefreshToken } from '@utils/jwt';
import logger from '@utils/logger';
import { User, SafeUser, toSafeUser, CreateUserData } from '@models/User';
import { CreateUserDTO, LoginDTO, UserRole } from '../types/user.types';
import { ConflictError, UnauthorizedError, NotFoundError } from '@middleware/errorMiddleware';
import crypto from 'crypto';

/**
 * Register a new user
 */
export const registerUser = async (data: CreateUserDTO): Promise<SafeUser> => {
  try {
    // Check if user already exists
    const existingUser = await query<User>(
      'SELECT id FROM users WHERE email = $1',
      [data.email]
    );

    if (existingUser.rows.length > 0) {
      throw new ConflictError('User with this email already exists', 'USER_ALREADY_EXISTS');
    }

    // Hash password
    const password_hash = await hashPassword(data.password);

    // Create user data
    const userData: CreateUserData = {
      email: data.email,
      password_hash,
      full_name: data.full_name,
      role: data.role,
      is_active: true,
    };

    // Insert user
    const result = await query<User>(
      `INSERT INTO users (email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, password_hash, full_name, role, is_active, created_at, updated_at, last_login_at`,
      [userData.email, userData.password_hash, userData.full_name, userData.role, userData.is_active]
    );

    const user = result.rows[0];
    
    if (!user) {
      throw new Error('Failed to create user');
    }

    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return toSafeUser(user);
  } catch (error) {
    logger.error('User registration failed', { error, email: data.email });
    throw error;
  }
};

/**
 * Login user and generate tokens
 */
export const loginUser = async (
  data: LoginDTO
): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> => {
  try {
    // Find user by email
    const result = await query<User>(
      'SELECT * FROM users WHERE email = $1',
      [data.email]
    );

    const user = result.rows[0];
    
    if (!user) {
      throw new UnauthorizedError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new UnauthorizedError('Account is disabled', 'ACCOUNT_DISABLED');
    }

    // Verify password
    const isPasswordValid = await comparePassword(data.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    // Hash refresh token before storing
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Calculate expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store refresh token in database
    await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, is_revoked)
       VALUES ($1, $2, $3, $4)`,
      [user.id, tokenHash, expiresAt, false]
    );

    // Update last login timestamp
    await query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
    });

    return {
      user: toSafeUser({ ...user, last_login_at: new Date() }),
      accessToken,
      refreshToken,
    };
  } catch (error) {
    logger.error('User login failed', { error, email: data.email });
    throw error;
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (
  refreshToken: string
): Promise<{ accessToken: string }> => {
  try {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Hash the refresh token
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Check if refresh token exists and is valid
    const tokenResult = await query(
      `SELECT * FROM refresh_tokens 
       WHERE user_id = $1 AND token_hash = $2 AND is_revoked = false AND expires_at > NOW()`,
      [payload.userId, tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      throw new UnauthorizedError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }

    // Get user to ensure still active
    const userResult = await query<User>(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [payload.userId]
    );

    const user = userResult.rows[0];
    
    if (!user) {
      throw new UnauthorizedError('User not found or disabled', 'USER_NOT_ACTIVE');
    }

    // Generate new access token
    const { accessToken } = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    logger.info('Access token refreshed', { userId: user.id });

    return { accessToken };
  } catch (error) {
    logger.error('Token refresh failed', { error });
    throw error;
  }
};

/**
 * Logout user by revoking refresh token
 */
export const logoutUser = async (userId: string, refreshToken?: string): Promise<void> => {
  try {
    if (refreshToken) {
      // Revoke specific refresh token
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await query(
        'UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1 AND token_hash = $2',
        [userId, tokenHash]
      );
    } else {
      // Revoke all refresh tokens for user
      await query(
        'UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1 AND is_revoked = false',
        [userId]
      );
    }

    logger.info('User logged out', { userId });
  } catch (error) {
    logger.error('Logout failed', { error, userId });
    throw error;
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<SafeUser> => {
  try {
    const result = await query<User>(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    const user = result.rows[0];
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return toSafeUser(user);
  } catch (error) {
    logger.error('Get user by ID failed', { error, userId });
    throw error;
  }
};

/**
 * Clean up expired refresh tokens (called by scheduler)
 */
export const cleanupExpiredTokens = async (): Promise<number> => {
  try {
    const result = await query(
      'DELETE FROM refresh_tokens WHERE expires_at < NOW() OR is_revoked = true',
      []
    );

    const deletedCount = result.rowCount || 0;
    logger.info('Cleaned up expired refresh tokens', { count: deletedCount });

    return deletedCount;
  } catch (error) {
    logger.error('Token cleanup failed', { error });
    throw error;
  }
};
