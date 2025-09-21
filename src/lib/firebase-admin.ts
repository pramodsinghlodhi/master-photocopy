// src/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

let firebaseAdminApp: admin.app.App | null = null;

export function getFirebaseAdminApp() {
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  try {
    // Check if we have service account credentials
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Use service account key (production)
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      firebaseAdminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
      });
    } else if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      // Use default credentials (development - requires gcloud auth)
      firebaseAdminApp = admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
      });
    } else {
      throw new Error('Firebase project ID not configured');
    }

    console.log('Firebase Admin SDK initialized successfully');
    return firebaseAdminApp;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    return null;
  }
}

export function getFirebaseAdminDB() {
  const app = getFirebaseAdminApp();
  if (!app) {
    throw new Error('Firebase Admin SDK not initialized');
  }
  return admin.firestore(app);
}

export function getFirebaseAdminStorage() {
  const app = getFirebaseAdminApp();
  if (!app) {
    throw new Error('Firebase Admin SDK not initialized');
  }
  return admin.storage(app);
}

export { admin };