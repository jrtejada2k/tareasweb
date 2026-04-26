/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * Provides role-based authorization checks for master and user roles.
 */

import { Request, Response, NextFunction } from 'express';
import logger from '@utils/logger';

/**
 * Middleware to require 'master' role
 * Must be used after requireAuth middleware
 */
export const requireMaster = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    logger.warn('RBAC check failed - no user in request', {
      path: req.path,
      method: req.method,
    });
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Authentication required',
      },
    });
    return;
  }

  if (req.user.role !== 'master') {
    logger.warn('RBAC check failed - insufficient permissions', {
      userId: req.user.userId,
      userRole: req.user.role,
      requiredRole: 'master',
      path: req.path,
      method: req.method,
    });
    res.status(403).json({
      success: false,
      error: {
        code: 'RBAC_FORBIDDEN',
        message: 'Insufficient permissions. Master role required.',
      },
    });
    return;
  }

  logger.debug('RBAC check passed - master role', {
    userId: req.user.userId,
  });

  next();
};

/**
 * Middleware to require 'user' role (any authenticated user)
 * This checks that user exists (effectively same as requireAuth)
 * but provides explicit RBAC semantics
 */
export const requireUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    logger.warn('RBAC check failed - no user in request', {
      path: req.path,
      method: req.method,
    });
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Authentication required',
      },
    });
    return;
  }

  logger.debug('RBAC check passed - user authenticated', {
    userId: req.user.userId,
    role: req.user.role,
  });

  next();
};

/**
 * Middleware to require one of multiple roles
 * @param allowedRoles - Array of allowed roles
 */
export const requireRole = (...allowedRoles: Array<'master' | 'user'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      logger.warn('RBAC check failed - no user in request', {
        path: req.path,
        method: req.method,
      });
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('RBAC check failed - role not in allowed list', {
        userId: req.user.userId,
        userRole: req.user.role,
        allowedRoles,
        path: req.path,
        method: req.method,
      });
      res.status(403).json({
        success: false,
        error: {
          code: 'RBAC_FORBIDDEN',
          message: `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`,
        },
      });
      return;
    }

    logger.debug('RBAC check passed - role authorized', {
      userId: req.user.userId,
      role: req.user.role,
      allowedRoles,
    });

    next();
  };
};

/**
 * Check if user has master role (utility function)
 */
export const isMaster = (req: Request): boolean => {
  return req.user?.role === 'master';
};

/**
 * Check if user is authenticated (utility function)
 */
export const isUser = (req: Request): boolean => {
  return req.user !== undefined;
};
