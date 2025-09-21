import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { sessionManager } from '@/lib/session';
import { userStore } from '@/lib/user-store';

export async function GET(request: NextRequest) {
  try {
    // Get access token from cookies
    const accessToken = request.cookies.get('access_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify the access token
    const payload = verifyAccessToken(accessToken);
    
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid access token' },
        { status: 401 }
      );
    }

    // Get user from store
    const user = userStore.findById(payload.id);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get session info if available
    const sessionId = request.cookies.get('session_id')?.value;
    let sessionInfo = null;
    
    if (sessionId) {
      const session = sessionManager.getSession(sessionId);
      if (session) {
        sessionInfo = {
          id: session.id,
          createdAt: session.createdAt,
          lastAccessed: session.lastAccessed,
          expiresAt: session.expiresAt
        };
      }
    }

    // Return user data without password hash
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    return NextResponse.json({
      success: true,
      user: userData,
      session: sessionInfo,
      authenticated: true
    });

  } catch (error: any) {
    console.error('User verification error:', error);
    
    // Handle JWT verification errors
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { success: false, error: 'Token expired' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Authentication verification failed' },
      { status: 500 }
    );
  }
}