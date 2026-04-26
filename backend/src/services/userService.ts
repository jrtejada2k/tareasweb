/**
 * User Service
 * 
 * Business logic for user management
 */

import { query } from '@utils/database';
import logger from '@utils/logger';
import { NotFoundError } from '@middleware/errorMiddleware';

export interface UserListItem {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: Date;
}

/**
 * Get all users (master only, for assignment dropdowns)
 */
export const getAllUsers = async (): Promise<UserListItem[]> => {
  try {
    const result = await query<UserListItem>(
      `SELECT id, email, full_name, role, is_active, created_at
       FROM users
       WHERE is_active = TRUE
       ORDER BY full_name ASC`
    );

    logger.info('Users list retrieved', { count: result.rows.length });
    
    return result.rows;
  } catch (error) {
    logger.error('Failed to retrieve users list', { error });
    throw error;
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<UserListItem> => {
  try {
    const result = await query<UserListItem>(
      `SELECT id, email, full_name, role, is_active, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    const user = result.rows[0];
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  } catch (error) {
    logger.error('Failed to retrieve user', { error, userId });
    throw error;
  }
};
