// Edge Runtime compatible auth utilities
// This file provides simple token validation without Node.js crypto

export interface UserPayload {
  id: string;
  email: string;
  role?: string;
  name?: string;
}

/**
 * Simple token validation for Edge Runtime
 * This doesn't verify the signature - just checks structure and expiration
 * Full verification happens in API routes with Node.js runtime
 */
export function parseJWTPayload(token: string): UserPayload | null {
  try {
    // Split JWT token
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode payload (base64url)
    const payload = parts[1];
    // Add padding if needed
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode base64url
    const decodedPayload = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'));
    const parsed = JSON.parse(decodedPayload);

    // Check expiration
    if (parsed.exp && Date.now() >= parsed.exp * 1000) {
      return null; // Token expired
    }

    // Return user payload
    return {
      id: parsed.id,
      email: parsed.email,
      role: parsed.role,
      name: parsed.name
    };
  } catch (error: any) {
    console.warn('Token parsing failed:', error);
    return null;
  }
}

/**
 * Check if user has admin role
 */
export function isAdmin(user: UserPayload | null): boolean {
  return user?.role === 'admin';
}

/**
 * Get user from request (Edge Runtime compatible)
 */
export function getUserFromRequest(token: string | undefined): UserPayload | null {
  if (!token) {
    return null;
  }
  
  return parseJWTPayload(token);
}