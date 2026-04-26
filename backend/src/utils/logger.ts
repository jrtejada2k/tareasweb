/**
 * Winston Logger Configuration
 * 
 * Provides structured logging with daily file rotation, JSON format,
 * and 7-day retention as per resource constraints.
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Define log levels and colors
const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
  },
};

winston.addColors(logLevels.colors);

// Determine log level from environment
const level = process.env['LOG_LEVEL'] || 'info';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format (for development)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info['timestamp']} [${info.level}]: ${info.message}`
  )
);

// Daily rotate file transport for all logs
const fileRotateTransport = new DailyRotateFile({
  filename: path.join(process.env['LOG_DIR'] || '/var/log/tareasweb', 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '7d', // Keep logs for 7 days
  maxSize: '20m', // Rotate if file exceeds 20MB
  format: logFormat,
  level: 'debug', // Log everything to file
});

// Daily rotate file transport for errors only
const errorRotateTransport = new DailyRotateFile({
  filename: path.join(process.env['LOG_DIR'] || '/var/log/tareasweb', 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '7d',
  maxSize: '20m',
  format: logFormat,
  level: 'error', // Only errors
});

// Create the logger
const logger = winston.createLogger({
  levels: logLevels.levels,
  level,
  transports: [
    // Console transport (development)
    new winston.transports.Console({
      format: process.env['NODE_ENV'] === 'production' ? logFormat : consoleFormat,
    }),
    // File transports
    fileRotateTransport,
    errorRotateTransport,
  ],
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.env['LOG_DIR'] || '/var/log/tareasweb', 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.env['LOG_DIR'] || '/var/log/tareasweb', 'rejections.log'),
    }),
  ],
});

// Create child logger with module context
export const createLogger = (module: string) => {
  return logger.child({ module });
};

// Export default logger
export default logger;

// Helper functions for structured logging
export const logRequest = (method: string, url: string, userId?: string, ip?: string) => {
  logger.http('HTTP Request', {
    method,
    url,
    userId,
    ip,
  });
};

export const logResponse = (
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  userId?: string
) => {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'http';
  logger.log(level, 'HTTP Response', {
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
    userId,
  });
};

export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error('Application Error', {
    error: error.message,
    stack: error.stack,
    ...context,
  });
};

export const logAudit = (
  action: string,
  userId: string,
  entityType: string,
  entityId: string,
  details?: Record<string, any>
) => {
  logger.info('Audit Log', {
    action,
    userId,
    entityType,
    entityId,
    ...details,
  });
};
