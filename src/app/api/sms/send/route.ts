import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';

// SMS API endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, to, message, from } = body;

    switch (provider) {
      case 'twilio':
        return await handleTwilioSMS(body);
      case 'firebase':
        return await handleFirebaseSMS(body);
      default:
        return NextResponse.json(
          { error: 'Unsupported SMS provider' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('SMS API error:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS' },
      { status: 500 }
    );
  }
}

async function handleTwilioSMS(data: any) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        From: data.from || process.env.TWILIO_PHONE_NUMBER || '',
        To: data.to,
        Body: data.message
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      return NextResponse.json({
        success: true,
        messageId: result.sid,
        provider: 'twilio'
      });
    } else {
      throw new Error(result.message || 'Twilio API error');
    }
  } catch (error: any) {
    console.error('Twilio SMS error:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS via Twilio' },
      { status: 500 }
    );
  }
}

async function handleFirebaseSMS(data: any) {
  try {
    // This would typically call a Firebase Function
    // For now, we'll log it as a placeholder
    console.log('Firebase SMS would be sent:', data);
    
    return NextResponse.json({
      success: true,
      provider: 'firebase'
    });
  } catch (error: any) {
    console.error('Firebase SMS error:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS via Firebase' },
      { status: 500 }
    );
  }
}