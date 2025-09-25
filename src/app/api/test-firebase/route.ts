import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Firebase Admin SDK...');
    
    // Test 1: Database connection
    console.log('Testing Firestore...');
    const db = getFirebaseAdminDB();
    const testCollection = await db.collection('test').limit(1).get();
    console.log('Firestore test successful');
    
    // Test 2: Storage connection
    console.log('Testing Storage...');
    const bucket = getStorage().bucket();
    const [bucketExists] = await bucket.exists();
    console.log('Storage bucket exists:', bucketExists);
    
    // Test 3: Storage permissions
    let storagePermissions = 'unknown';
    try {
      const [files] = await bucket.getFiles({ maxResults: 1 });
      storagePermissions = 'OK';
      console.log('Storage permissions test successful');
    } catch (storageError: any) {
      console.warn('Storage permission test failed:', storageError.message);
      storagePermissions = `Error: ${storageError.message}`;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Firebase Admin SDK is working',
      tests: {
        firestore: 'OK',
        storage: bucketExists ? 'OK' : 'Bucket not found',
        storagePermissions
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        hasAdminProjectId: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
        hasAdminEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        hasAdminKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
      }
    });
    
  } catch (error: any) {
    console.error('Firebase Admin test failed:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        hasAdminProjectId: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
        hasAdminEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        hasAdminKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
      }
    }, { status: 500 });
  }
}