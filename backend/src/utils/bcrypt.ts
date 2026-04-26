/**
 * Bcrypt Password Hashing Utilities
 * 
 * Provides secure password hashing and comparison using bcrypt
 * with cost factor 12 as per security requirements.
 */

import bcrypt from 'bcryptjs';
import logger from './logger';

// Get bcrypt rounds from environment (default: 12)
const BCRYPT_ROUNDS = parseInt(process.env['BCRYPT_ROUNDS'] || '12', 10);

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    return hash;
  } catch (error) {
    logger.error('Error hashing password', { error });
    throw new Error('Failed to hash password');
  }
};

/**
 * Compare a plain text password with a hash
 * @param password - Plain text password
 * @param hash - Hashed password to compare against
 * @returns True if password matches, false otherwise
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    logger.error('Error comparing password', { error });
    throw new Error('Failed to compare password');
  }
};

/**
 * Generate a random salt (for advanced use cases)
 */
export const generateSalt = async (): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    return salt;
  } catch (error) {
    logger.error('Error generating salt', { error });
    throw new Error('Failed to generate salt');
  }
};

/**
 * Validate password strength (basic validation)
 * @param password - Password to validate
 * @returns Validation result with success flag and message
 */
export const validatePasswordStrength = (password: string): { valid: boolean; message?: string } => {
  // Minimum 8 characters
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }

  // Maximum 128 characters (prevent DoS via bcrypt)
  if (password.length > 128) {
    return { valid: false, message: 'Password must be less than 128 characters' };
  }

  // Must contain at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }

  // Must contain at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }

  // Must contain at least one number
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }

  // Must contain at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }

  return { valid: true };
};
