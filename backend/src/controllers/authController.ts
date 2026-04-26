/**
 * Authentication Controller
 * 
 * HTTP request handlers for authentication endpoints
 */

import { Request, Response } from 'express';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getUserById,
} from '@services/authService';
import { CreateUserDTO, LoginDTO, UserProfileDTO, UserRole } from '../types/user.types';
import { asyncHandler } from '@middleware/errorMiddleware';

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userData: CreateUserDTO = req.body;

  const user = await registerUser(userData);

  // Convert to DTO
  const userProfile: UserProfileDTO = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role as UserRole,
    is_active: user.is_active,
    created_at: user.created_at.toISOString(),
    updated_at: user.updated_at.toISOString(),
    last_login_at: user.last_login_at ? user.last_login_at.toISOString() : null,
  };

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    user: userProfile,
  });
});

/**
 * Login user
 * POST /api/v1/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const loginData: LoginDTO = req.body;

  const { user, accessToken, refreshToken } = await loginUser(loginData);

  // Set tokens in HttpOnly cookies
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production', // HTTPS only in production
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Convert to DTO
  const userProfile: UserProfileDTO = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role as UserRole,
    is_active: user.is_active,
    created_at: user.created_at.toISOString(),
    updated_at: user.updated_at.toISOString(),
    last_login_at: user.last_login_at ? user.last_login_at.toISOString() : null,
  };

  res.status(200).json({
    success: true,
    message: 'Login successful',
    user: userProfile,
  });
});

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export const refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Get refresh token from cookie or body
  const refreshToken = req.cookies?.['refreshToken'] || req.body.refreshToken;

  if (!refreshToken) {
    res.status(401).json({
      success: false,
      error: {
        code: 'REFRESH_TOKEN_MISSING',
        message: 'Refresh token is required',
      },
    });
    return;
  }

  const { accessToken } = await refreshAccessToken(refreshToken);

  // Set new access token in cookie
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
  });
});

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const refreshToken = req.cookies?.['refreshToken'];

  if (userId) {
    await logoutUser(userId, refreshToken);
  }

  // Clear cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

/**
 * Get current user profile
 * GET /api/v1/auth/me
 */
export const me = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      },
    });
    return;
  }

  const user = await getUserById(userId);

  // Convert to DTO
  const userProfile: UserProfileDTO = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role as UserRole,
    is_active: user.is_active,
    created_at: user.created_at.toISOString(),
    updated_at: user.updated_at.toISOString(),
    last_login_at: user.last_login_at ? user.last_login_at.toISOString() : null,
  };

  res.status(200).json({
    success: true,
    user: userProfile,
  });
});
