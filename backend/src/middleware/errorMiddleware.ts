/**
 * Error Handling Middleware
 * 
 * Global error handler that formats errors, logs them,
 * and returns consistent JSON responses.
 */

import { Request, Response, NextFunction } from 'express';
import logger from '@utils/logger';

// Custom error class for application errors
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, 'VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

// Backwards-compatible alias for 400 Bad Request errors
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', code: string = 'BAD_REQUEST', details?: any) {
    super(400, code, message, details);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED') {
    super(401, code, message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', code: string = 'FORBIDDEN') {
    super(403, code, message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(404, 'NOT_FOUND', message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code: string = 'CONFLICT') {
    super(409, code, message);
    this.name = 'ConflictError';
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(500, 'INTERNAL_SERVER_ERROR', message);
    this.name = 'InternalServerError';
  }
}

/**
 * Global error handler middleware
 * Must be registered last in the middleware chain
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default error values
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = undefined;

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    details = err.details;
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'AUTH_TOKEN_INVALID';
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'AUTH_TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }
  // Handle database errors
  else if (err.name === 'QueryFailedError' || (err as any).code?.startsWith('23')) {
    statusCode = 400;
    errorCode = 'DATABASE_ERROR';
    message = 'Database operation failed';
    // Don't expose internal database errors to client
    if (process.env['NODE_ENV'] === 'development') {
      details = err.message;
    }
  }
  // Handle validation errors from other libraries
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = err.message || 'Validation failed';
  }
  // Generic error
  else {
    message = err.message || message;
  }

  // Log error with context
  const logContext = {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: errorCode,
    },
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userId: req.user?.userId,
    },
  };

  if (statusCode >= 500) {
    logger.error('Server error', logContext);
  } else {
    logger.warn('Client error', logContext);
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details && { details }),
      // Include stack trace in development
      ...(process.env['NODE_ENV'] === 'development' && { stack: err.stack }),
    },
  });
};

/**
 * 404 Not Found handler
 * Place before error handler, after all routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
    },
  });
};

/**
 * Async handler wrapper to catch promise rejections
 * Wraps async route handlers to automatically catch errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
