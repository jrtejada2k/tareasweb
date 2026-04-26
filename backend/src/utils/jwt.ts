/**
 * JWT Token Utilities
 * 
 * Handles JWT token generation, verification, and payload extraction
 * for authentication and refresh token flows.
 */

import jwt, { SignOptions } from 'jsonwebtoken';
import logger from './logger';

// JWT Payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  role: 'master' | 'user';
  iat?: number;
  exp?: number;
}

// Get secrets from environment
const ACCESS_TOKEN_SECRET: string = process.env['JWT_SECRET'] || 'your-secret-key-change-in-production';
const REFRESH_TOKEN_SECRET: string = process.env['JWT_REFRESH_SECRET'] || 'your-refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY: string | number = process.env['JWT_EXPIRES_IN'] || '15m';
const REFRESH_TOKEN_EXPIRY: string | number = process.env['JWT_REFRESH_EXPIRES_IN'] || '7d';

/**
 * Generate an access token (short-lived, 15 minutes)
 */
export const generateAccessToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  try {
    const token = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    } as SignOptions);
    return token;
  } catch (error) {
    logger.error('Error generating access token', { error });
    throw new Error('Failed to generate access token');
  }
};

/**
 * Generate a refresh token (long-lived, 7 days)
 */
export const generateRefreshToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  try {
    const token = jwt.sign(payload, REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    } as SignOptions);
    return token;
  } catch (error) {
    logger.error('Error generating refresh token', { error });
    throw new Error('Failed to generate refresh token');
  }
};

/**
 * Verify a token and return the decoded payload
 */
export const verifyToken = (token: string, isRefreshToken: boolean = false): JWTPayload => {
  try {
    const secret = isRefreshToken ? REFRESH_TOKEN_SECRET : ACCESS_TOKEN_SECRET;
    const decoded = jwt.verify(token, secret) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else {
      logger.error('Error verifying token', { error });
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Verify an access token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  return verifyToken(token, false);
};

/**
 * Verify a refresh token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  return verifyToken(token, true);
};

/**
 * Extract user ID from a token without full verification
 * (Use for logging/auditing, not for auth decisions)
 */
export const extractUserId = (token: string): string | null => {
  try {
    const decoded = jwt.decode(token) as JWTPayload | null;
    return decoded?.userId || null;
  } catch (error) {
    logger.warn('Failed to extract user ID from token', { error });
    return null;
  }
};

/**
 * Decode token without verification (for inspection only)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload | null;
  } catch (error) {
    logger.warn('Failed to decode token', { error });
    return null;
  }
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = (payload: Omit<JWTPayload, 'iat' | 'exp'>) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};
