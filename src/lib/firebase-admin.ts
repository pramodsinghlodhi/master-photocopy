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
        storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebasestorage.app`,
      });
    } else if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      // Use default credentials (development - requires gcloud auth)
      firebaseAdminApp = admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebasestorage.app`,
      });
    } else {
      throw new Error('Firebase project ID not configured');
    }

    console.log('Firebase Admin SDK initialized successfully');
    return firebaseAdminApp;
  } catch (error: any) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    return null;
  }
}

export function getFirebaseAdminDB() {
  try {
    const app = getFirebaseAdminApp();
    if (!app) {
      throw new Error('Firebase Admin SDK not initialized - Missing service account credentials. Please configure FIREBASE_SERVICE_ACCOUNT_KEY environment variable or run: gcloud auth application-default login');
    }
    
    const db = admin.firestore(app);
    console.log('Firebase Admin Firestore instance obtained');
    return db;
  } catch (error: any) {
    console.error('Error getting Firebase Admin DB:', error);
    throw error;
  }
}

export function getFirebaseAdminStorage() {
  const app = getFirebaseAdminApp();
  if (!app) {
    throw new Error('Firebase Admin SDK not initialized');
  }
  return admin.storage(app);
}

export { admin };