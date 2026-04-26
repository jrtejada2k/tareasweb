/**
 * Authentication Routes
 * 
 * Defines all authentication-related endpoints
 */

import { Router } from 'express';
import { register, login, refresh, logout, me } from '@controllers/authController';
import { requireAuth } from '@middleware/authMiddleware';
import { validateBody } from '@middleware/validationMiddleware';
import { loginRateLimiter, registerRateLimiter } from '@middleware/rateLimitMiddleware';
import { registerSchema, loginSchema } from '@utils/validation';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new user
 * Rate limited: 3 requests per hour per IP
 */
router.post('/register', registerRateLimiter, validateBody(registerSchema), register);

/**
 * POST /api/v1/auth/login
 * Login with email and password
 * Rate limited: 5 requests per 15 minutes per IP
 */
router.post('/login', loginRateLimiter, validateBody(loginSchema), login);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', refresh);

/**
 * POST /api/v1/auth/logout
 * Logout and revoke refresh token
 * Requires authentication
 */
router.post('/logout', requireAuth, logout);

/**
 * GET /api/v1/auth/me
 * Get current user profile
 * Requires authentication
 */
router.get('/me', requireAuth, me);

export default router;
