import { NextRequest, NextResponse } from 'next/server';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { generateTokenPair, generateSessionId, UserPayload } from '@/lib/auth';
import { sessionManager } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    // Check if Firebase is configured
    if (!isFirebaseConfigured || !auth || !db) {
      return NextResponse.json(
        { error: 'Firebase not configured' },
        { status: 500 }
      );
    }

    const { email, password, name, role = 'user' } = await request.json();

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Update Firebase Auth profile
    await updateProfile(firebaseUser, {
      displayName: name
    });

    // Create user document in Firestore
    const userData = {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      name: name,
      role: role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userData);

    // Generate JWT tokens
    const tokens = generateTokenPair(userData);
    
    // Create session
    const sessionId = generateSessionId();
    sessionManager.createSession(sessionId, userData);

    // Create response with tokens
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
    console.error('Registration error:', error);
    
    // Handle specific Firebase auth errors
    if (error.code === 'auth/email-already-in-use') {
      return NextResponse.json(
        { error: 'Email address is already registered' },
        { status: 409 }
      );
    }
    
    if (error.code === 'auth/invalid-email') {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }
    
    if (error.code === 'auth/weak-password') {
      return NextResponse.json(
        { error: 'Password is too weak' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}