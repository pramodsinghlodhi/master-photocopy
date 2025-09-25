import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';

// GET /api/test-firebase-admin - Test Firebase Admin SDK connection
export async function GET(request: NextRequest) {
  try {
    console.log('Testing Firebase Admin SDK connection...');
    
    const db = getFirebaseAdminDB();
    console.log('✅ Firebase Admin DB instance obtained');

    // Test basic connectivity by attempting to list collections
    const testDoc = await db.collection('_test').limit(1).get();
    console.log('✅ Successfully queried Firestore');

    // Test orders collection
    const ordersSnapshot = await db.collection('orders').limit(1).get();
    console.log(`✅ Orders collection accessible, found ${ordersSnapshot.docs.length} documents`);

    // Test orderFiles collection  
    const filesSnapshot = await db.collection('orderFiles').limit(1).get();
    console.log(`✅ OrderFiles collection accessible, found ${filesSnapshot.docs.length} documents`);

    return NextResponse.json({
      success: true,
      message: 'Firebase Admin SDK is working properly',
      details: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        ordersCount: ordersSnapshot.docs.length,
        filesCount: filesSnapshot.docs.length,
      }
    });

  } catch (error: any) {
    console.error('❌ Firebase Admin SDK test failed:', error);
    
    let errorType = 'unknown';
    let suggestion = 'Unknown error occurred';
    
    if (error.message.includes('permission-denied') || error.message.includes('PERMISSION_DENIED')) {
      errorType = 'permission_denied';
      suggestion = 'Run: gcloud auth application-default login';
    } else if (error.message.includes('not found')) {
      errorType = 'project_not_found';
      suggestion = 'Verify NEXT_PUBLIC_FIREBASE_PROJECT_ID is set correctly';
    } else if (error.message.includes('Application Default Credentials')) {
      errorType = 'no_credentials';
      suggestion = 'Run: gcloud auth application-default login or set FIREBASE_SERVICE_ACCOUNT_KEY';
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Firebase Admin SDK test failed',
        errorType,
        suggestion,
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}