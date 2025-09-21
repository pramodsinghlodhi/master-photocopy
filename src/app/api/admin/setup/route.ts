import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // For Firebase Auth, we just check if admin user exists
  // Since the user already has Firebase admin configured, always return that admin exists
  return NextResponse.json({
    hasAdmin: true,
    message: 'Firebase Authentication is configured with admin user'
  });
}

export async function POST(request: NextRequest) {
  // For Firebase Auth, admin setup is handled through Firebase Console
  // This endpoint is kept for compatibility but returns appropriate message
  return NextResponse.json({
    error: 'Admin setup is handled through Firebase Authentication. Please use Firebase Console to manage users.',
    hasAdmin: true
  }, { status: 400 });
}