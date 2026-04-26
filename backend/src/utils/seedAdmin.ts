/**
 * Initial Admin User Seeder
 *
 * Ensures there is at least one master (admin) user in the system.
 * If none exists, creates one using environment variables.
 */

import { query } from '@utils/database';
import logger from '@utils/logger';
import { hashPassword } from '@utils/bcrypt';

export const ensureInitialAdmin = async () => {
  try {
    // Check if any master user already exists
    const existing = await query<{ id: string }>(
      "SELECT id FROM users WHERE role = 'master' LIMIT 1"
    );

    if (existing.rows.length > 0) {
      logger.info('Admin user already present, skipping admin seeding');
      return;
    }

    // Read admin credentials from env or sensible defaults (dev only)
    const email = process.env['ADMIN_EMAIL'] || 'admin@tareasweb.local';
    const password = process.env['ADMIN_PASSWORD'] || 'Admin123!';
    const fullName = process.env['ADMIN_FULL_NAME'] || 'System Administrator';

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create admin user
    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, 'master', true)
       RETURNING id, email`,
      [email, passwordHash, fullName]
    );

    const admin = result.rows[0];
    if (admin) {
      logger.warn('Initial admin user created. CHANGE THIS PASSWORD ASAP.', {
        email,
      });
    }
  } catch (error) {
    logger.error('Failed to ensure initial admin user', { error });
  }
};

export default ensureInitialAdmin;
