/**
 * Express Application Setup
 * 
 * Configures Express server with middleware, routes, and error handling.
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { errorHandler, notFoundHandler } from '@middleware/errorMiddleware';
import { apiRateLimiter } from '@middleware/rateLimitMiddleware';
import logger from '@utils/logger';
import { checkConnection } from '@utils/database';
import { openApiSpec } from '@config/openapi';

/**
 * Create and configure Express application
 */
const createApp = (): Application => {
  const app = express();

  // Trust proxy (for deployment behind reverse proxy like nginx)
  app.set('trust proxy', 1);

  // CORS configuration
  const corsOptions = {
    origin: process.env['CORS_ORIGIN']?.split(',') || ['http://localhost:5173'],
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24 hours
  };
  app.use(cors(corsOptions));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Cookie parser
  app.use(cookieParser());

  // Request logging middleware
  app.use((req: Request, res: Response, next) => {
    const start = Date.now();

    // Log response when it finishes
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.http('HTTP Request', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userId: req.user?.userId,
      });
    });

    next();
  });

  // Health check endpoint (no rate limiting)
  app.get('/health', async (_req: Request, res: Response) => {
    try {
      const dbConnected = await checkConnection();

      const health = {
        status: dbConnected ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbConnected ? 'connected' : 'disconnected',
      };

      const statusCode = dbConnected ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      logger.error('Health check failed', { error });
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'error',
      });
    }
  });

  // OpenAPI documentation (Swagger UI)
  app.use('/api/docs', swaggerUi.serve);
  app.get('/api/docs', swaggerUi.setup(openApiSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'TareasWeb API Documentation',
  }));

  // OpenAPI JSON spec endpoint
  app.get('/api/docs/openapi.json', (_req: Request, res: Response) => {
    res.json(openApiSpec);
  });

  // API rate limiting (apply to all /api routes)
  app.use('/api', apiRateLimiter);

  // API Routes
  // Import routes
  const authRoutes = require('@routes/authRoutes').default;
  const projectRoutes = require('@routes/projectRoutes').default;
  const taskRoutes = require('@routes/taskRoutes').default;
  const dashboardRoutes = require('@routes/dashboardRoutes').default;
  const deadlineRoutes = require('@routes/deadlineRoutes').default;
  const timeTrackingRoutes = require('@routes/timeTrackingRoutes').default;
  const userRoutes = require('@routes/userRoutes').default;
  const notificationRoutes = require('@routes/notificationRoutes').default;

  // Mount routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/projects', projectRoutes);
  app.use('/api/v1/tasks', taskRoutes);
  app.use('/api/v1/dashboard', dashboardRoutes);
  app.use('/api/v1/deadline-requests', deadlineRoutes);
  app.use('/api/v1/time-entries', timeTrackingRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/notifications', notificationRoutes);

  // API root endpoint
  app.get('/api', (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'TareasWeb API',
      version: '1.0.0',
      documentation: '/api/docs',
      endpoints: {
        health: '/health',
        auth: '/api/v1/auth',
        projects: '/api/v1/projects',
        tasks: '/api/v1/tasks',
        dashboard: '/api/v1/dashboard',
        deadlineRequests: '/api/v1/deadline-requests',
        timeEntries: '/api/v1/time-entries',
      },
    });
  });

  // 404 handler (must be after all routes)
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  logger.info('Express application configured');

  return app;
};

export default createApp;
