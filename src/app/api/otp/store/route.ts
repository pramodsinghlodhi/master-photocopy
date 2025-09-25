import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';

// OTP Storage API
export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otp, expiryTime } = await request.json();
    
    if (!phoneNumber || !otp || !expiryTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = getFirebaseAdminDB();
    
    // Store OTP with expiry
    await db.collection('otps').doc(phoneNumber).set({
      otp,
      expiryTime: new Date(expiryTime),
      createdAt: new Date(),
      attempts: 0,
      verified: false
    });

    return NextResponse.json({
      success: true,
      message: 'OTP stored successfully'
    });

  } catch (error) {
    console.error('Error storing OTP:', error);
    return NextResponse.json(
      { error: 'Failed to store OTP' },
      { status: 500 }
    );
  }
}