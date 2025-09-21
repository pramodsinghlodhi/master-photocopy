// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if all required firebase config keys are present
const isFirebaseConfigured = 
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId &&
    !firebaseConfig.apiKey.includes('YOUR_');

// Check if we should use emulators
const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

// Initialize Firebase App
let app: FirebaseApp | null = null;

if (isFirebaseConfigured) {
    try {
        // Get existing app or create new one
        app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    } catch (error) {
        console.error('Error initializing Firebase app:', error);
        app = null;
    }
}

// Initialize Firebase services only if app is available
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: any = null;

if (app) {
    try {
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
    } catch (error) {
        console.error('Error initializing Firebase services:', error);
    }
}

// Flag to track if emulators are already connected
let emulatorsConnected = false;

// Connect to emulators if in development and browser environment
if (app && auth && db && storage && useEmulator && typeof window !== 'undefined' && !emulatorsConnected) {
    try {
        // Connect to Firestore emulator
        connectFirestoreEmulator(db, 'localhost', 8080);
        
        // Connect to Auth emulator
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        
        // Connect to Storage emulator
        connectStorageEmulator(storage, 'localhost', 9199);
        
        emulatorsConnected = true;
        console.log('Connected to Firebase emulators');
    } catch (error) {
        console.warn('Emulators already connected or failed to connect:', error);
    }
}

export { app, auth, db, storage, isFirebaseConfigured };
