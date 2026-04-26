/**
 * PostgreSQL Database Connection Pool
 * 
 * Provides connection pooling, query wrappers, and transaction helpers
 * using node-postgres (pg) with resource constraints optimization.
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import logger from './logger';

// Database configuration from environment
const dbConfig = {
  host: process.env['POSTGRES_HOST'] || 'localhost',
  port: parseInt(process.env['POSTGRES_PORT'] || '5432', 10),
  database: process.env['POSTGRES_DB'] || 'tareasweb',
  user: process.env['POSTGRES_USER'] || 'postgres',
  password: process.env['POSTGRES_PASSWORD'] || 'postgres',
  max: parseInt(process.env['DATABASE_POOL_MAX'] || '20', 10), // Max connections
  min: parseInt(process.env['DATABASE_POOL_MIN'] || '2', 10), // Min connections
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 10000, // 10 seconds
  ssl: false, // Disable SSL for local development
};

// Debug: Log connection parameters (mask password)
console.log('=== DATABASE CONNECTION CONFIG ===');
console.log('Host:', dbConfig.host);
console.log('Port:', dbConfig.port);
console.log('Database:', dbConfig.database);
console.log('User:', dbConfig.user);
console.log('Password:', dbConfig.password ? '***MASKED***' : 'NOT SET');
console.log('Max connections:', dbConfig.max);
console.log('Min connections:', dbConfig.min);
console.log('==================================');

// Create connection pool
const pool = new Pool(dbConfig);

// Pool error handler
pool.on('error', (err) => {
  logger.error('Unexpected database pool error', { error: err });
});

// Pool connection event
pool.on('connect', () => {
  logger.debug('New database connection established');
});

// Pool remove event
pool.on('remove', () => {
  logger.debug('Database connection removed from pool');
});

/**
 * Execute a query with parameters
 * @param text - SQL query text
 * @param params - Query parameters
 * @returns Query result
 */
export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    logger.debug('Database query executed', {
      text,
      duration: `${duration}ms`,
      rows: result.rowCount,
    });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Database query failed', {
      text,
      params: params ? '[REDACTED]' : undefined, // Don't log sensitive data
      duration: `${duration}ms`,
      error,
    });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 * @returns Pool client
 */
export const getClient = async (): Promise<PoolClient> => {
  try {
    const client = await pool.connect();
    logger.debug('Database client acquired from pool');
    return client;
  } catch (error) {
    logger.error('Failed to acquire database client', { error });
    throw error;
  }
};

/**
 * Execute a transaction with automatic rollback on error
 * @param callback - Transaction callback function
 * @returns Result from callback
 */
export const transaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    logger.debug('Transaction started');

    const result = await callback(client);

    await client.query('COMMIT');
    logger.debug('Transaction committed');

    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back', { error });
    throw error;
  } finally {
    client.release();
    logger.debug('Database client released to pool');
  }
};

/**
 * Begin a transaction (manual control)
 */
export const beginTransaction = async (client: PoolClient): Promise<void> => {
  await client.query('BEGIN');
  logger.debug('Manual transaction started');
};

/**
 * Commit a transaction (manual control)
 */
export const commitTransaction = async (client: PoolClient): Promise<void> => {
  await client.query('COMMIT');
  logger.debug('Manual transaction committed');
};

/**
 * Rollback a transaction (manual control)
 */
export const rollbackTransaction = async (client: PoolClient): Promise<void> => {
  await client.query('ROLLBACK');
  logger.debug('Manual transaction rolled back');
};

/**
 * Check database connection health
 * @returns True if connected, false otherwise
 */
export const checkConnection = async (): Promise<boolean> => {
  try {
    console.log('Attempting database connection...');
    const result = await pool.query('SELECT 1');
    console.log('Database connection successful!', result.rows);
    return true;
  } catch (error) {
    console.error('=== DATABASE CONNECTION ERROR ===');
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
    console.error('=================================');
    logger.error('Database health check failed', { error });
    return false;
  }
};

/**
 * Get pool statistics
 */
export const getPoolStats = () => {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
};

/**
 * Close all connections in the pool (for graceful shutdown)
 */
export const closePool = async (): Promise<void> => {
  try {
    await pool.end();
    logger.info('Database pool closed');
  } catch (error) {
    logger.error('Error closing database pool', { error });
    throw error;
  }
};

// Export pool for advanced use cases
export { pool };

// Default export
export default {
  query,
  getClient,
  transaction,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  checkConnection,
  getPoolStats,
  closePool,
  pool,
};
