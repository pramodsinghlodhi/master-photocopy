# Firebase Admin SDK Configuration Fix

## Problem
The Firebase Admin SDK is not properly configured, causing the files API and invoice API to fail.

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Firebase Admin SDK Configuration
FIREBASE_ADMIN_PROJECT_ID=master-photocopy
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@master-photocopy.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# OR use service account JSON (preferred for production)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"master-photocopy",...}
```

## Steps to Configure:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your `master-photocopy` project
3. Go to Project Settings > Service Accounts
4. Generate a new private key (JSON format)
5. Either:
   - Use the entire JSON as `FIREBASE_SERVICE_ACCOUNT_KEY`
   - OR extract individual values for separate environment variables

## Test Configuration:

1. Visit `/test-firebase` page to test connection
2. Try fetching files for a specific order ID
3. Check if invoice generation works

## Current Features Working:
- ✅ Invoice template component created
- ✅ Invoice API endpoint created  
- ✅ Invoice page with print functionality
- ✅ Order details page with invoice button
- ✅ Enhanced error handling in file fetching

## Next Steps:
1. Configure Firebase Admin SDK properly
2. Test file upload/download functionality
3. Verify invoice generation with real order data