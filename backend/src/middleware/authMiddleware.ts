/**
 * Authentication Middleware
 * 
 * Validates JWT tokens from cookies or Authorization header,
 * attaches user information to request object, and handles auth errors.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '@utils/jwt';
import logger from '@utils/logger';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Extract JWT token from cookie or Authorization header
 */
const extractToken = (req: Request): string | null => {
  // Try cookie first (preferred for security)
  if (req.cookies?.['accessToken']) {
    return req.cookies['accessToken'];
  }

  // Try Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
};

/**
 * Middleware to require authentication
 * Validates JWT and attaches user to req.user
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_MISSING',
          message: 'Authentication token is required',
        },
      });
      return;
    }

    // Verify token
    const payload = verifyAccessToken(token);

    // Attach user to request
    req.user = payload;

    logger.debug('User authenticated', {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    next();
  } catch (error) {
    logger.warn('Authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      path: req.path,
    });

    if (error instanceof Error && error.message === 'Token has expired') {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_EXPIRED',
          message: 'Authentication token has expired',
        },
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_TOKEN_INVALID',
        message: 'Invalid authentication token',
      },
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't fail if missing
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (token) {
      const payload = verifyAccessToken(token);
      req.user = payload;

      logger.debug('Optional auth - user authenticated', {
        userId: payload.userId,
      });
    } else {
      logger.debug('Optional auth - no token provided');
    }

    next();
  } catch (error) {
    // Don't fail on optional auth errors
    logger.debug('Optional auth failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next();
  }
};

/**
 * Check if user is authenticated (for route guards)
 */
export const isAuthenticated = (req: Request): boolean => {
  return req.user !== undefined;
};

/**
 * Get current user from request
 */
export const getCurrentUser = (req: Request): JWTPayload | null => {
  return req.user || null;
};
