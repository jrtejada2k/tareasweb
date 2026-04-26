/**
 * Rate Limiting Middleware
 * 
 * Provides rate limiting for API endpoints to prevent abuse,
 * especially for authentication endpoints.
 */

import rateLimit from 'express-rate-limit';
import logger from '@utils/logger';

/**
 * Rate limiter for login endpoint
 * 5 attempts per 15 minutes per IP
 */
export const loginRateLimiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10), // 15 minutes
  max: parseInt(process.env['RATE_LIMIT_MAX_LOGIN'] || '5', 10), // 5 requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts. Please try again later.',
    },
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('Login rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many login attempts. Please try again in 15 minutes.',
      },
    });
  },
  skip: (_req) => {
    // Skip rate limiting in test and development environments
    const env = process.env['NODE_ENV'];
    return env === 'test' || env === 'development';
  },
});

/**
 * Rate limiter for registration endpoint
 * 3 attempts per hour per IP
 */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env['RATE_LIMIT_MAX_REGISTER'] || '3', 10), // 3 requests per hour
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many registration attempts. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Registration rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many registration attempts. Please try again in 1 hour.',
      },
    });
  },
  skip: () => {
    // Skip rate limiting in test and development environments
    const env = process.env['NODE_ENV'];
    return env === 'test' || env === 'development';
  },
});

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10), // 15 minutes
  max: parseInt(process.env['RATE_LIMIT_MAX_API'] || '100', 10), // 100 requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('API rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again in 15 minutes.',
      },
    });
  },
  skip: () => {
    // Skip rate limiting in test and development environments
    const env = process.env['NODE_ENV'];
    return env === 'test' || env === 'development';
  },
  // Key generator to rate limit by user ID if authenticated, otherwise by IP
  keyGenerator: (req) => {
    return req.user?.userId || req.ip || 'unknown';
  },
});

/**
 * Strict rate limiter for sensitive operations
 * 10 requests per hour per user/IP
 */
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests for this operation.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Strict rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests for this operation. Please try again later.',
      },
    });
  },
  skip: () => {
    // Skip rate limiting in test and development environments
    const env = process.env['NODE_ENV'];
    return env === 'test' || env === 'development';
  },
  keyGenerator: (req) => {
    return req.user?.userId || req.ip || 'unknown';
  },
});

/**
 * Custom rate limiter factory
 * @param options - Rate limit options
 */
export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message: string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: options.message,
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Custom rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        userId: req.user?.userId,
        limit: options.max,
        window: options.windowMs,
      });
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: options.message,
        },
      });
    },
    skip: () => {
      // Skip rate limiting in test and development environments
      const env = process.env['NODE_ENV'];
      return env === 'test' || env === 'development';
    },
    keyGenerator: (req) => {
      return req.user?.userId || req.ip || 'unknown';
    },
  });
};
