# Firebase Service Account Setup Guide

## The Issue
Your Firebase Admin SDK is configured but missing service account credentials, causing "Missing or insufficient permissions" errors.

## Quick Fix Steps

### 1. Generate Service Account Key
1. Go to: https://console.firebase.google.com/project/master-photocopy/settings/serviceaccounts/adminsdk
2. Click **"Generate new private key"**
3. Click **"Generate key"** in the popup
4. Save the downloaded JSON file (e.g., `master-photocopy-firebase-adminsdk.json`)

### 2. Add to Environment Variables

**Option A: Add to .env file (Recommended for development)**
```bash
# Add this line to your .env file
FIREBASE_SERVICE_ACCOUNT_KEY='PASTE_YOUR_COMPLETE_JSON_HERE'
```

**Option B: Export as environment variable (Production)**
```bash
export FIREBASE_SERVICE_ACCOUNT_KEY='PASTE_YOUR_COMPLETE_JSON_HERE'
```

### 3. Format the JSON properly
The JSON should look like this (all on one line in .env):
```json
{"type":"service_account","project_id":"master-photocopy","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-...@master-photocopy.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

### 4. Alternative: Development Authentication
For local development only:
```bash
gcloud auth application-default login
```

## Verification
After setting up, test with:
```bash
curl http://localhost:3000/api/test-firebase-admin
```

## Security Notes
- Never commit service account keys to git
- Use environment variables or secret management
- Restrict service account permissions in production
- Consider using workload identity for cloud deployments