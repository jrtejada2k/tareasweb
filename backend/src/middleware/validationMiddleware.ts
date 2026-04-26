/**
 * Validation Middleware
 * 
 * Provides request validation using Joi schemas for body, query, and params.
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import logger from '@utils/logger';

/**
 * Validate request body against a Joi schema
 * @param schema - Joi validation schema
 */
export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Collect all validation errors
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      }));

      // Enhanced debugging - log to console with full details
      console.log('========================================');
      console.log('VALIDATION ERROR DETAILS');
      console.log('========================================');
      console.log('Path:', req.path);
      console.log('Method:', req.method);
      console.log('Request Body:', JSON.stringify(req.body, null, 2));
      console.log('Validation Errors:', JSON.stringify(errors, null, 2));
      console.log('========================================');

      logger.warn('Request body validation failed', {
        path: req.path,
        method: req.method,
        body: req.body,
        errors,
      });

      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request body validation failed',
          details: errors,
        },
      });
      return;
    }

    // Replace req.body with validated and sanitized value
    req.body = value;
    next();
  };
};

/**
 * Validate request query parameters against a Joi schema
 * @param schema - Joi validation schema
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      }));

      logger.warn('Request query validation failed', {
        path: req.path,
        method: req.method,
        errors,
      });

      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request query validation failed',
          details: errors,
        },
      });
      return;
    }

    // Replace req.query with validated and sanitized value
    req.query = value;
    next();
  };
};

/**
 * Validate request params against a Joi schema
 * @param schema - Joi validation schema
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      }));

      logger.warn('Request params validation failed', {
        path: req.path,
        method: req.method,
        errors,
      });

      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request params validation failed',
          details: errors,
        },
      });
      return;
    }

    // Replace req.params with validated and sanitized value
    req.params = value;
    next();
  };
};

/**
 * Validate entire request (body, query, params) against multiple schemas
 * @param schemas - Object containing body, query, and/or params schemas
 */
export const validateRequest = (schemas: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Array<{ location: string; field: string; message: string; type: string }> = [];

    // Validate body
    if (schemas.body) {
      const { error, value } = schemas.body.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(
          ...error.details.map((detail) => ({
            location: 'body',
            field: detail.path.join('.'),
            message: detail.message,
            type: detail.type,
          }))
        );
      } else {
        req.body = value;
      }
    }

    // Validate query
    if (schemas.query) {
      const { error, value } = schemas.query.validate(req.query, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(
          ...error.details.map((detail) => ({
            location: 'query',
            field: detail.path.join('.'),
            message: detail.message,
            type: detail.type,
          }))
        );
      } else {
        req.query = value;
      }
    }

    // Validate params
    if (schemas.params) {
      const { error, value } = schemas.params.validate(req.params, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        errors.push(
          ...error.details.map((detail) => ({
            location: 'params',
            field: detail.path.join('.'),
            message: detail.message,
            type: detail.type,
          }))
        );
      } else {
        req.params = value;
      }
    }

    if (errors.length > 0) {
      logger.warn('Request validation failed', {
        path: req.path,
        method: req.method,
        errors,
      });

      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors,
        },
      });
      return;
    }

    next();
  };
};

// Export common Joi validators for reuse
export { Joi };
