import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get Firebase token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify token using Firebase Auth API
    const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/api/auth/firebase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    if (!verifyResponse.ok) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { user } = await verifyResponse.json();

    // Check if user is admin
    const isAdmin = user.role === 'admin';
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Access denied - Admin privileges required' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      isAdmin: true,
      permissions: [
        'users.read',
        'users.write',
        'orders.read',
        'orders.write',
        'settings.read',
        'settings.write',
        'dashboard.access',
        'analytics.read'
      ]
    });

  } catch (error: any) {
    console.error('Admin verification error:', error);
    
    return NextResponse.json(
      { error: 'Admin verification failed' },
      { status: 500 }
    );
  }
}