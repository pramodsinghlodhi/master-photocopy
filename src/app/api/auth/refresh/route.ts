import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateTokenPair, UserPayload } from '@/lib/auth';
import { userStore } from '@/lib/user-store';
import { sessionManager } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookies or request body
    let refreshToken = request.cookies.get('refresh_token')?.value;
    
    if (!refreshToken) {
      const body = await request.json();
      refreshToken = body.refreshToken;
    }

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 401 }
      );
    }

    // Verify refresh token
    const tokenPayload = verifyRefreshToken(refreshToken);
    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Get updated user data from our user store
    const user = userStore.findById(tokenPayload.id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    const userData: UserPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    // Generate new token pair
    const tokens = generateTokenPair(userData);
    
    // Update session if exists
    const sessionId = request.cookies.get('session_id')?.value;
    if (sessionId) {
      sessionManager.updateSession(sessionId, userData);
      sessionManager.extendSession(sessionId);
    }

    // Create response with new tokens
    const response = NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role
      },
      accessToken: tokens.accessToken
    });

    // Set new secure HTTP-only cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/'
    };

    // Set new access token cookie (15 minutes)
    response.cookies.set('access_token', tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 // 15 minutes
    });

    // Set new refresh token cookie (7 days)
    response.cookies.set('refresh_token', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;

  } catch (error: any) {
    console.error('Token refresh error:', error);
    
    return NextResponse.json(
      { error: 'Token refresh failed' },
      { status: 500 }
    );
  }
}