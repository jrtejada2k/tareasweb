/**
 * User Type Definitions
 * 
 * DTOs and types for user authentication and management
 */

// User role enum
export enum UserRole {
  MASTER = 'master',
  USER = 'user',
}

// Create user DTO (for registration)
export interface CreateUserDTO {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
}

// Login DTO
export interface LoginDTO {
  email: string;
  password: string;
}

// User profile DTO (for API responses)
export interface UserProfileDTO {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string; // ISO string
  updated_at: string; // ISO string
  last_login_at: string | null; // ISO string
}

// JWT payload interface (extends the one from jwt.ts)
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Auth response (login/register)
export interface AuthResponse {
  success: boolean;
  message: string;
  user: UserProfileDTO;
  accessToken?: string; // Optional - may be in cookie
  refreshToken?: string; // Optional - may be in cookie
}

// Refresh token response
export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  accessToken?: string; // Optional - may be in cookie
}

// Logout response
export interface LogoutResponse {
  success: boolean;
  message: string;
}

// Profile response
export interface ProfileResponse {
  success: boolean;
  user: UserProfileDTO;
}
