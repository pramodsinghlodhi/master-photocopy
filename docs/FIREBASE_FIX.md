# Firebase Authentication Setup for Master Photocopy

## The Issue
You're seeing console errors like:
```
Failed to fetch order files: {}
```

This happens because Firebase Admin SDK requires authentication to access Firestore database and Cloud Storage.

## Quick Fix for Development

### Option 1: Use Google Cloud CLI (Recommended for Development)

1. **Install Google Cloud CLI** (if not already installed):
   ```bash
   # On macOS
   brew install google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Authenticate with Google Cloud**:
   ```bash
   gcloud auth application-default login
   ```
   
   This will open a browser window. Sign in with the Google account that has access to your `master-photocopy` Firebase project.

3. **Set the project**:
   ```bash
   gcloud config set project master-photocopy
   ```

4. **Restart your development server**:
   ```bash
   npm run dev
   ```

### Option 2: Use Service Account Key (For Production)

1. **Generate Service Account Key**:
   - Go to [Firebase Console](https://console.firebase.google.com/project/master-photocopy)
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Download the JSON file

2. **Add to Environment Variables**:
   - Copy the entire JSON content
   - Add to your `.env.local` file:
   ```bash
   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"master-photocopy",...}
   ```

3. **Restart your development server**:
   ```bash
   npm run dev
   ```

## Verification

After setup, you should see in your terminal:
```
✅ Firebase Admin SDK initialized successfully
✅ Firebase Admin DB instance obtained
✅ Firebase Admin Firestore instance obtained
```

And the "Failed to fetch order files" error should be resolved.

## Troubleshooting

### Error: "permission-denied"
- Make sure you're authenticated with the correct Google account
- Verify the account has access to the `master-photocopy` project

### Error: "FAILED_PRECONDITION: The query requires an index"
- Firestore indexes have been deployed, but may take a few minutes to become active
- Wait 5-10 minutes and try again

### Error: "Firebase Admin SDK not initialized"
- Check if `NEXT_PUBLIC_FIREBASE_PROJECT_ID` is set in `.env.local`
- Verify authentication setup from Option 1 or 2 above

### Still having issues?
1. Check your `.env.local` file has all required variables
2. Verify you're using the correct Firebase project ID
3. Make sure your Firestore security rules allow admin access
4. Try clearing browser cache and restarting the dev server

## Files Fixed
- ✅ Fixed Next.js 15 async params issue in API routes
- ✅ Added better error handling with fallback queries
- ✅ Deployed Firestore indexes for orderFiles collection
- ✅ Enhanced error messages for debugging