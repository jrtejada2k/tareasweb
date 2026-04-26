/**
 * RefreshToken Model
 * 
 * Represents a refresh token for JWT authentication
 */

export interface RefreshToken {
  id: string; // UUID
  user_id: string; // UUID
  token_hash: string; // Hashed token for security
  expires_at: Date;
  is_revoked: boolean;
  created_at: Date;
}

/**
 * Refresh token creation data
 */
export interface CreateRefreshTokenData {
  user_id: string;
  token_hash: string;
  expires_at: Date;
  is_revoked?: boolean;
}

/**
 * Refresh token update data
 */
export interface UpdateRefreshTokenData {
  is_revoked?: boolean;
}
