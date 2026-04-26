/**
 * User Model
 * 
 * Represents a user in the system (master or regular user)
 */

export interface User {
  id: string; // UUID
  email: string;
  password_hash: string;
  full_name: string;
  role: 'master' | 'user';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
}

/**
 * User without sensitive information (for API responses)
 */
export interface SafeUser {
  id: string;
  email: string;
  full_name: string;
  role: 'master' | 'user';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
}

/**
 * User creation data (for database insert)
 */
export interface CreateUserData {
  email: string;
  password_hash: string;
  full_name: string;
  role: 'master' | 'user';
  is_active?: boolean;
}

/**
 * User update data (for database update)
 */
export interface UpdateUserData {
  email?: string;
  password_hash?: string;
  full_name?: string;
  role?: 'master' | 'user';
  is_active?: boolean;
  last_login_at?: Date;
}

/**
 * Remove sensitive fields from user object
 */
export const toSafeUser = (user: User): SafeUser => {
  const { password_hash, ...safeUser } = user;
  return safeUser as SafeUser;
};
