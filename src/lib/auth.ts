import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

// JWT Secret - use a strong secret in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

export interface UserPayload {
  id: string;
  email: string;
  role?: string;
  name?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'master-photocopy',
    audience: 'master-photocopy-users'
  });
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(payload: UserPayload): string {
  return jwt.sign(
    { id: payload.id, email: payload.email },
    JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'master-photocopy',
      audience: 'master-photocopy-users'
    }
  );
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(payload: UserPayload): TokenPair {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload)
  };
}

/**
 * Verify JWT access token
 */
export function verifyAccessToken(token: string): UserPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'master-photocopy',
      audience: 'master-photocopy-users'
    }) as UserPayload;
    return decoded;
  } catch (error: any) {
    console.error('Access token verification failed:', error);
    return null;
  }
}

/**
 * Verify JWT refresh token
 */
export function verifyRefreshToken(token: string): Pick<UserPayload, 'id' | 'email'> | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'master-photocopy',
      audience: 'master-photocopy-users'
    }) as Pick<UserPayload, 'id' | 'email'>;
    return decoded;
  } catch (error: any) {
    console.error('Refresh token verification failed:', error);
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Extract token from request cookies
 */
export function extractTokenFromCookies(request: NextRequest): string | null {
  return request.cookies.get('access_token')?.value || null;
}

/**
 * Get user from request (from either header or cookies)
 */
export function getUserFromRequest(request: NextRequest): UserPayload | null {
  // Try to get token from Authorization header first
  const authHeader = request.headers.get('authorization');
  let token = extractTokenFromHeader(authHeader);
  
  // If no token in header, try cookies
  if (!token) {
    token = extractTokenFromCookies(request);
  }
  
  if (!token) {
    return null;
  }
  
  return verifyAccessToken(token);
}

/**
 * Check if user has required role
 */
export function hasRole(user: UserPayload | null, requiredRole: string): boolean {
  if (!user || !user.role) {
    return false;
  }
  
  // Admin role has access to everything
  if (user.role === 'admin') {
    return true;
  }
  
  return user.role === requiredRole;
}

/**
 * Check if user is admin
 */
export function isAdmin(user: UserPayload | null): boolean {
  return hasRole(user, 'admin');
}

/**
 * Generate a secure random string for session IDs
 */
export function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}