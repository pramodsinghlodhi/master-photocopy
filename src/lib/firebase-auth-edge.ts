// Edge Runtime compatible Firebase auth utilities

export interface UserPayload {
  id: string;
  email: string;
  role?: string;
  name?: string;
}

/**
 * Parse Firebase ID token payload (without verification)
 * This doesn't verify the signature - just checks structure and basic info
 * Full verification happens in API routes with Firebase Admin SDK
 */
export function parseFirebaseToken(token: string): UserPayload | null {
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

    // Determine role - admin for specific email, otherwise user
    const role = parsed.role || 
      (parsed.email === 'admin@masterphotocopy.com' ? 'admin' : 'user');

    // Return user payload
    return {
      id: parsed.sub || parsed.user_id, // Firebase uses 'sub' for user ID
      email: parsed.email,
      role,
      name: parsed.name
    };
  } catch (error: any) {
    console.warn('Firebase token parsing failed:', error);
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
 * Get user from Firebase token in request
 */
export function getUserFromFirebaseToken(token: string | undefined): UserPayload | null {
  if (!token) {
    return null;
  }
  
  return parseFirebaseToken(token);
}

/**
 * Get Firebase token from request headers or cookies
 */
export function getFirebaseTokenFromRequest(request: any): string | undefined {
  // First try Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split('Bearer ')[1];
  }
  
  // Then try firebase_token cookie
  const tokenCookie = request.cookies.get('firebase_token');
  if (tokenCookie?.value) {
    return tokenCookie.value;
  }
  
  return undefined;
}