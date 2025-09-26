import { NextRequest, NextResponse } from 'next/server';
import { signOut } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { sessionManager } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    // Get session ID from cookies
    const sessionId = request.cookies.get('session_id')?.value;
    
    // Destroy session if exists
    if (sessionId) {
      sessionManager.destroySession(sessionId);
    }

    // Sign out from Firebase if configured
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch (error: any) {
        console.warn('Firebase signout error:', error);
        // Continue with logout even if Firebase signout fails
      }
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear all auth cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0 // Expire immediately
    };

    response.cookies.set('access_token', '', cookieOptions);
    response.cookies.set('refresh_token', '', cookieOptions);
    response.cookies.set('session_id', '', cookieOptions);

    return response;

  } catch (error: any) {
    console.error('Logout error:', error);
    
    // Even if there's an error, clear cookies and return success
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0
    };

    response.cookies.set('access_token', '', cookieOptions);
    response.cookies.set('refresh_token', '', cookieOptions);
    response.cookies.set('session_id', '', cookieOptions);

    return response;
  }
}