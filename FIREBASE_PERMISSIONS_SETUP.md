# Firebase Dashboard API Setup

## Issue
The dashboard APIs are failing with "Missing or insufficient permissions" because:
1. API routes run server-side without user authentication context
2. Firebase Client SDK is being used instead of Admin SDK
3. Firestore rules require authentication

## Root Cause
The current implementation uses Firebase Client SDK in API routes, but API routes run on the server without user authentication context. This causes permission errors even with proper Firestore rules.

## Solutions

### Option 1: Quick Fix - Allow Unauthenticated Read (Development Only)
Temporarily modify your Firestore rules to allow unauthenticated read access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access for development
    match /{document=**} {
      allow read: if true;  // ⚠️ DEVELOPMENT ONLY
      allow write: if request.auth != null;
    }
  }
}
```

**⚠️ WARNING: This allows anyone to read your database. Only use for development/testing!**

### Option 2: Proper Solution - Firebase Admin SDK (Recommended)
Configure Firebase Admin SDK for server-side access:

1. **Get Service Account Key:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file

2. **Add Environment Variables:**
   Add to your `.env.local` file:
   ```
   FIREBASE_ADMIN_TYPE=service_account
   FIREBASE_ADMIN_PROJECT_ID=your-project-id
   FIREBASE_ADMIN_PRIVATE_KEY_ID=your-private-key-id
   FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key\n-----END PRIVATE KEY-----\n"
   FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account-email
   FIREBASE_ADMIN_CLIENT_ID=your-client-id
   FIREBASE_ADMIN_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   FIREBASE_ADMIN_TOKEN_URI=https://oauth2.googleapis.com/token
   ```

3. **Update Firebase Config:**
   Create `src/lib/firebase-admin.ts`:
   ```typescript
   import { initializeApp, getApps, cert } from 'firebase-admin/app';
   import { getFirestore } from 'firebase-admin/firestore';

   if (!getApps().length) {
     initializeApp({
       credential: cert({
         type: process.env.FIREBASE_ADMIN_TYPE,
         projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
         privateKeyId: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
         privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
         clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
         clientId: process.env.FIREBASE_ADMIN_CLIENT_ID,
         authUri: process.env.FIREBASE_ADMIN_AUTH_URI,
         tokenUri: process.env.FIREBASE_ADMIN_TOKEN_URI,
       })
     });
   }

   export const adminDb = getFirestore();
   ```

4. **Update API Routes:**
   Replace `import { db } from '@/lib/firebase'` with `import { adminDb as db } from '@/lib/firebase-admin'`

### Option 3: Client-Side Data Fetching
Move data fetching to the client-side where user authentication is available:

1. Remove API routes
2. Fetch data directly in React components using Firebase Client SDK
3. Ensure users are authenticated before accessing dashboard

## Quick Test Steps

**For Option 1 (Quick Fix):**
1. Update Firestore rules in Firebase Console
2. Refresh dashboard page
3. Data should load (shows real data if available, empty charts if no data)

**For Option 2 (Admin SDK):**
1. Set up service account and environment variables
2. Update Firebase imports in API routes  
3. Test dashboard functionality

## Current Status

The dashboard is now working with:
- ✅ **Graceful Error Handling**: Shows empty data instead of crashing
- ✅ **Fallback Mode**: Clear warning message about Firebase setup
- ✅ **User Experience**: Dashboard loads and is functional
- ✅ **Development Ready**: Easy to fix with rule changes

## Production Recommendations

1. **Use Option 2** (Firebase Admin SDK) for production
2. **Implement proper security rules** based on user roles
3. **Add authentication verification** in API routes
4. **Monitor API usage** and implement rate limiting

## Need Help?

1. Check browser console for detailed error messages
2. Verify Firebase project configuration in console
3. Test with simple Firestore rules first
4. Ensure `.env.local` file is properly configured (Option 2)