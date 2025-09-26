import { NextRequest, NextResponse } from 'next/server';

// For development without Firebase Admin SDK, we'll do basic token parsing
function parseFirebaseIdToken(idToken: string) {
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const payload = parts[1];
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decodedPayload = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'));
    const parsed = JSON.parse(decodedPayload);

    // Check expiration
    if (parsed.exp && Date.now() >= parsed.exp * 1000) {
      throw new Error('Token expired');
    }

    // Check issuer
    if (!parsed.iss || !parsed.iss.includes('securetoken.google.com')) {
      throw new Error('Invalid token issuer');
    }

    return parsed;
  } catch (error: any) {
    throw new Error('Token parsing failed: ' + error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Parse and validate token (basic validation without Admin SDK)
    const decodedToken = parseFirebaseIdToken(idToken);
    
    // Get user role from custom claims or set default for admin
    const role = decodedToken.role || 
      (decodedToken.email === 'admin@masterphotocopy.com' ? 'admin' : 'user');

    const user = {
      id: decodedToken.sub || decodedToken.user_id,
      email: decodedToken.email,
      name: decodedToken.name || '',
      role
    };

    return NextResponse.json({
      success: true,
      user,
      claims: decodedToken
    });

  } catch (error: any) {
    console.error('Token verification failed:', error);
    
    return NextResponse.json(
      { error: 'Invalid token: ' + error.message },
      { status: 401 }
    );
  }
}

export async function GET(request: NextRequest) {
  // For GET requests, try to get token from Authorization header
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Parse and validate token (basic validation without Admin SDK)
    const decodedToken = parseFirebaseIdToken(idToken);
    
    // Get user role from custom claims or set default for admin
    const role = decodedToken.role || 
      (decodedToken.email === 'admin@masterphotocopy.com' ? 'admin' : 'user');

    const user = {
      id: decodedToken.sub || decodedToken.user_id,
      email: decodedToken.email,
      name: decodedToken.name || '',
      role
    };

    return NextResponse.json({
      success: true,
      user,
      claims: decodedToken
    });

  } catch (error: any) {
    console.error('Token verification failed:', error);
    
    return NextResponse.json(
      { error: 'Invalid token: ' + error.message },
      { status: 401 }
    );
  }
}