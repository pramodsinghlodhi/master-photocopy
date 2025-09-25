import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';

// OTP Verification API
export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otp } = await request.json();
    
    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = getFirebaseAdminDB();
    const otpDoc = db.collection('otps').doc(phoneNumber);
    const otpData = await otpDoc.get();

    if (!otpData.exists) {
      return NextResponse.json(
        { error: 'OTP not found or expired' },
        { status: 404 }
      );
    }

    const data = otpData.data()!;
    
    // Check if OTP has expired
    if (new Date() > data.expiryTime.toDate()) {
      await otpDoc.delete();
      return NextResponse.json(
        { error: 'OTP has expired' },
        { status: 400 }
      );
    }

    // Check attempts limit
    if (data.attempts >= 3) {
      await otpDoc.delete();
      return NextResponse.json(
        { error: 'Too many verification attempts' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (data.otp === otp) {
      // Mark as verified and delete
      await otpDoc.delete();
      return NextResponse.json({
        success: true,
        message: 'OTP verified successfully'
      });
    } else {
      // Increment attempts
      await otpDoc.update({
        attempts: data.attempts + 1
      });
      
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}