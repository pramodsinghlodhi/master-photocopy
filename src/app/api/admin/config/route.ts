import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';

// Admin Configuration API for Firebase Services
export async function GET() {
  try {
    const db = getFirebaseAdminDB();
    
    const configDoc = await db.collection('admin_config').doc('firebase_services').get();
    
    if (!configDoc.exists) {
      // Return default configuration
      const defaultConfig = {
        auth: { enabled: true },
        firestore: { enabled: true },
        storage: { enabled: true },
        realtimeDb: { enabled: true },
        functions: { enabled: true },
        analytics: { enabled: true },
        messaging: { enabled: true },
        remoteConfig: { enabled: true },
        dataConnect: { enabled: false },
        appCheck: { enabled: false },
        hosting: { enabled: true },
        email: {
          enabled: true,
          providers: {
            firebase: { enabled: true },
            sendgrid: { enabled: false, apiKey: '' },
            mailgun: { enabled: false, apiKey: '', domain: '' },
            ses: { enabled: false, region: 'us-east-1' },
            nodemailer: { enabled: false, smtp: {} }
          }
        },
        sms: {
          enabled: true,
          providers: {
            firebase: { enabled: true },
            twilio: { enabled: false, accountSid: '', authToken: '' },
            fast2sms: { enabled: false, apiKey: '' },
            textlocal: { enabled: false, apiKey: '', sender: '' },
            msg91: { enabled: false, apiKey: '', route: '4' }
          }
        },
        otp: {
          enabled: true,
          length: 6,
          expiryMinutes: 10,
          maxAttempts: 3
        }
      };

      // Save default config
      await db.collection('admin_config').doc('firebase_services').set(defaultConfig);
      
      return NextResponse.json(defaultConfig);
    }

    return NextResponse.json(configDoc.data());

  } catch (error) {
    console.error('Error fetching admin config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();
    
    const db = getFirebaseAdminDB();
    
    // Update configuration
    await db.collection('admin_config').doc('firebase_services').set(config, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully'
    });

  } catch (error) {
    console.error('Error updating admin config:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const updates = await request.json();
    
    const db = getFirebaseAdminDB();
    
    // Partial update
    await db.collection('admin_config').doc('firebase_services').update(updates);

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully'
    });

  } catch (error) {
    console.error('Error updating admin config:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}