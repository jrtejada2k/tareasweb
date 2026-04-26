/**
 * Cron Job Scheduler Service
 * 
 * Manages scheduled tasks using node-cron for deadline monitoring,
 * notifications, and periodic cleanup operations.
 */

import cron from 'node-cron';
import logger from './logger';

// Store active cron jobs
const jobs: Map<string, cron.ScheduledTask> = new Map();

/**
 * Add a new cron job
 * @param name - Unique job name
 * @param schedule - Cron expression (e.g., '0 * * * *' for hourly)
 * @param callback - Function to execute on schedule
 * @param options - Cron options (timezone, scheduled)
 */
export const addJob = (
  name: string,
  schedule: string,
  callback: () => void | Promise<void>,
  options?: cron.ScheduleOptions
): void => {
  try {
    // Check if job already exists
    if (jobs.has(name)) {
      logger.warn(`Cron job "${name}" already exists, skipping creation`);
      return;
    }

    // Validate cron expression
    if (!cron.validate(schedule)) {
      throw new Error(`Invalid cron expression: ${schedule}`);
    }

    // Wrap callback with error handling and logging
    const wrappedCallback = async () => {
      const start = Date.now();
      logger.info(`Cron job "${name}" started`, { schedule });

      try {
        await callback();
        const duration = Date.now() - start;
        logger.info(`Cron job "${name}" completed successfully`, {
          schedule,
          duration: `${duration}ms`,
        });
      } catch (error) {
        const duration = Date.now() - start;
        logger.error(`Cron job "${name}" failed`, {
          schedule,
          duration: `${duration}ms`,
          error,
        });
      }
    };

    // Create and start the job
    const task = cron.schedule(schedule, wrappedCallback, {
      scheduled: true,
      timezone: options?.timezone || 'America/Mexico_City', // Default timezone
      ...options,
    });

    jobs.set(name, task);
    logger.info(`Cron job "${name}" registered`, { schedule });
  } catch (error) {
    logger.error(`Failed to add cron job "${name}"`, { error });
    throw error;
  }
};

/**
 * Remove a cron job
 * @param name - Job name to remove
 */
export const removeJob = (name: string): void => {
  const job = jobs.get(name);
  if (job) {
    job.stop();
    jobs.delete(name);
    logger.info(`Cron job "${name}" removed`);
  } else {
    logger.warn(`Cron job "${name}" not found`);
  }
};

/**
 * Stop a cron job without removing it
 * @param name - Job name to stop
 */
export const stopJob = (name: string): void => {
  const job = jobs.get(name);
  if (job) {
    job.stop();
    logger.info(`Cron job "${name}" stopped`);
  } else {
    logger.warn(`Cron job "${name}" not found`);
  }
};

/**
 * Start a stopped cron job
 * @param name - Job name to start
 */
export const startJob = (name: string): void => {
  const job = jobs.get(name);
  if (job) {
    job.start();
    logger.info(`Cron job "${name}" started`);
  } else {
    logger.warn(`Cron job "${name}" not found`);
  }
};

/**
 * Get all registered job names
 */
export const getJobNames = (): string[] => {
  return Array.from(jobs.keys());
};

/**
 * Check if a job exists
 * @param name - Job name
 */
export const hasJob = (name: string): boolean => {
  return jobs.has(name);
};

/**
 * Stop all cron jobs (for graceful shutdown)
 */
export const stopAllJobs = (): void => {
  logger.info('Stopping all cron jobs');
  jobs.forEach((job, name) => {
    job.stop();
    logger.debug(`Cron job "${name}" stopped`);
  });
  jobs.clear();
  logger.info('All cron jobs stopped');
};

/**
 * Initialize default scheduled tasks
 * Called from server.ts on startup
 */
export const initializeScheduledTasks = async (): Promise<void> => {
  logger.info('Initializing scheduled tasks');

  // Import alertService dynamically to avoid circular dependencies
  const { checkDeadlineAlerts } = await import('../services/alertService');

  // Check for deadline alerts every 15 minutes
  addJob(
    'check-deadline-alerts',
    '*/15 * * * *', // Every 15 minutes
    async () => {
      await checkDeadlineAlerts();
    }
  );

  // Daily cleanup of expired refresh tokens at 2 AM
  addJob(
    'cleanup-expired-tokens',
    '0 2 * * *', // Daily at 2 AM
    async () => {
      // Placeholder - actual implementation in services/auth.ts
      logger.debug('Cleaning up expired refresh tokens...');
    }
  );

  // Daily audit log archival at 3 AM
  addJob(
    'archive-audit-logs',
    '0 3 * * *', // Daily at 3 AM
    async () => {
      // Placeholder - actual implementation in services/audit.ts
      logger.debug('Archiving old audit logs...');
    }
  );

  logger.info(`Initialized ${jobs.size} scheduled tasks`);
};

// Export scheduler service
export default {
  addJob,
  removeJob,
  stopJob,
  startJob,
  getJobNames,
  hasJob,
  stopAllJobs,
  initializeScheduledTasks,
};
