/**
 * Jest Test Setup
 * 
 * Global configuration for all tests:
 * - Environment variable setup
 * - Test database configuration
 * - Global test utilities
 */

// Set test environment variables
process.env['NODE_ENV'] = 'test';
process.env['PORT'] = '3001';
process.env['LOG_DIR'] = process.env['LOG_DIR'] || '/tmp/tareasweb-test-logs';
process.env['JWT_SECRET'] = 'test-jwt-secret-key-for-testing-only';
process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret-key-for-testing-only';
process.env['JWT_EXPIRES_IN'] = '15m';
process.env['JWT_REFRESH_EXPIRES_IN'] = '7d';

// Database configuration for tests (use test database)
process.env['DB_HOST'] = process.env['TEST_DB_HOST'] || 'localhost';
process.env['DB_PORT'] = process.env['TEST_DB_PORT'] || '5432';
process.env['DB_NAME'] = process.env['TEST_DB_NAME'] || 'tareasweb_test';
process.env['DB_USER'] = process.env['TEST_DB_USER'] || 'postgres';
process.env['DB_PASSWORD'] = process.env['TEST_DB_PASSWORD'] || 'postgres';

// SMTP configuration (use test mode)
process.env['SMTP_HOST'] = 'localhost';
process.env['SMTP_PORT'] = '1025'; // MailHog or similar test SMTP server
process.env['SMTP_USER'] = '';
process.env['SMTP_PASS'] = '';
process.env['SMTP_FROM'] = 'test@tareasweb.local';

// Disable console logs during tests (optional)
if (process.env['SILENT_TESTS'] === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Global test timeout
jest.setTimeout(10000);
