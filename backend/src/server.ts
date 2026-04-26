/**
 * Server Entry Point
 * 
 * Initializes the application, connects to database,
 * starts the HTTP server, and handles graceful shutdown
 */

import createApp from './app';
import { checkConnection, closePool } from '@utils/database';
import logger from '@utils/logger';
import { initializeScheduledTasks, stopAllJobs } from '@utils/scheduler';
import { ensureInitialAdmin } from '@utils/seedAdmin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Server configuration
const PORT = parseInt(process.env['API_PORT'] || '3000', 10);
const HOST = process.env['API_HOST'] || '0.0.0.0';

/**
 * Start the server
 */
const startServer = async () => {
  try {
    logger.info('Starting TareasWeb API server...');

    // Check database connection
    logger.info('Checking database connection...');
    const isDbConnected = await checkConnection();
    
    if (!isDbConnected) {
      logger.error('Failed to connect to database');
      process.exit(1);
    }
    
  logger.info('Database connection successful');

  // Ensure an initial admin user exists
  await ensureInitialAdmin();

    // Initialize scheduled tasks
    logger.info('Initializing scheduled tasks...');
    await initializeScheduledTasks();
    logger.info('Scheduled tasks initialized');

    // Create Express app
    const app = createApp();

    // Start HTTP server
    const server = app.listen(PORT, HOST, () => {
      logger.info(`Server running on http://${HOST}:${PORT}`);
      logger.info(`Environment: ${process.env['NODE_ENV'] || 'development'}`);
      logger.info(`Health check: http://${HOST}:${PORT}/health`);
      logger.info(`API endpoint: http://${HOST}:${PORT}/api`);
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async (err) => {
        if (err) {
          logger.error('Error during server shutdown', { error: err });
          process.exit(1);
        }

        logger.info('HTTP server closed');

        try {
          // Stop all cron jobs
          logger.info('Stopping scheduled tasks...');
          stopAllJobs();
          logger.info('Scheduled tasks stopped');

          // Close database connections
          logger.info('Closing database connections...');
          await closePool();
          logger.info('Database connections closed');

          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown', { error });
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error });
      if (server) {
        gracefulShutdown('uncaughtException');
      } else {
        process.exit(1);
      }
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason, promise });
      if (server) {
        gracefulShutdown('unhandledRejection');
      } else {
        process.exit(1);
      }
    });

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Start the server
startServer();



