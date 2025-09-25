import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Check Firebase Admin SDK configuration
    const adminApp = getFirebaseAdminApp();
    const hasAdminSDK = !!adminApp;
    
    // Check environment variables
    const hasProjectId = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const hasServiceAccountKey = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const hasAppCredentials = !!process.env.GOOGLE_APPLICATION_CREDENTIALS || hasServiceAccountKey;
    
    // Overall system status
    const isFullyConfigured = hasAdminSDK && hasProjectId && hasAppCredentials;
    
    const status = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      firebase: {
        adminSDK: {
          configured: hasAdminSDK,
          initialized: hasAdminSDK
        },
        project: {
          hasProjectId,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not configured'
        },
        credentials: {
          hasServiceAccountKey,
          hasAppCredentials,
          credentialType: hasServiceAccountKey 
            ? 'Service Account Key' 
            : process.env.GOOGLE_APPLICATION_CREDENTIALS 
              ? 'Application Default Credentials' 
              : 'None'
        }
      },
      system: {
        fullyConfigured: isFullyConfigured,
        status: isFullyConfigured ? 'operational' : 'configuration_required',
        message: isFullyConfigured 
          ? 'All systems operational' 
          : 'Firebase Admin SDK configuration required for full functionality'
      },
      recommendations: [] as string[]
    };

    // Add specific recommendations based on configuration status
    if (!hasProjectId) {
      status.recommendations.push('Set NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable');
    }
    
    if (!hasServiceAccountKey && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      status.recommendations.push('Either set FIREBASE_SERVICE_ACCOUNT_KEY or run: gcloud auth application-default login');
    }
    
    if (!hasAdminSDK) {
      status.recommendations.push('Firebase Admin SDK failed to initialize - check credentials and project ID');
    }

    return NextResponse.json(status);
    
  } catch (error: any) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      system: {
        fullyConfigured: false,
        status: 'error',
        message: 'System status check failed',
        error: error.message
      },
      firebase: {
        adminSDK: {
          configured: false,
          initialized: false,
          error: error.message
        }
      },
      recommendations: [
        'Check server logs for detailed error information',
        'Verify Firebase configuration and credentials'
      ]
    }, { status: 500 });
  }
}