import { NextRequest, NextResponse } from 'next/server';
import { generateTokenPair, generateSessionId, verifyPassword } from '@/lib/auth';
import { sessionManager } from '@/lib/session';
import { userStore } from '@/lib/user-store';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = userStore.findByEmail(email);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Prepare user data for JWT
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    // Generate JWT tokens
    const tokens = generateTokenPair(userData);
    
    // Create session
    const sessionId = generateSessionId();
    sessionManager.createSession(sessionId, userData);

    // Create response with tokens
    const response = NextResponse.json({
      success: true,
      user: userData,
      accessToken: tokens.accessToken
    });

    // Set secure HTTP-only cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/'
    };

    // Set access token cookie (15 minutes)
    response.cookies.set('access_token', tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 // 15 minutes
    });

    // Set refresh token cookie (7 days)
    response.cookies.set('refresh_token', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    // Set session cookie
    response.cookies.set('session_id', sessionId, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return response;

  } catch (error: any) {
    console.error('Login error:', error);

    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}