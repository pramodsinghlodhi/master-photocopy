# Environment Configuration Guide

## Single .env.local File Setup

To fix the "Firebase not configured" error and simplify configuration, we now use only **ONE** environment file: `.env.local`

## File Structure

```
├── .env.local           # ✅ MAIN CONFIG FILE (works for both dev & production)
├── .env.example         # ✅ Template file with sample values
└── apphosting.yaml      # ✅ Minimal Firebase App Hosting config
```

## Setup Instructions

### 1. Copy Environment Template
```bash
cp .env.example .env.local
```

### 2. Verify Firebase Configuration
The `.env.local` file already contains the correct Firebase configuration:

```bash
# Firebase Configuration - Master Photocopy
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA8HYKjwg20P5zqUBwZaFM8VqPsxJX4rfA
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=master-photocopy.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=master-photocopy
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=master-photocopy.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=285542401885
NEXT_PUBLIC_FIREBASE_APP_ID=1:285542401885:web:d44f4aaf92c3401ec18ab4
```

### 3. Environment Modes

#### Production Mode (Default)
```bash
NODE_ENV=production
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
NEXT_PUBLIC_APP_URL=https://master-photocopy--master-photocopy.us-central1.hosted.app
```

#### Development Mode (For Local Testing)
```bash
# Uncomment these lines in .env.local for local development:
# NODE_ENV=development
# NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
# NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Why One File?

### ❌ Previous Issues:
- Multiple `.env` files (`.env`, `.env.local`, `.env.production`)
- Conflicting configurations
- Firebase "not configured" errors
- Build-time confusion

### ✅ Current Solution:
- Single `.env.local` file
- Works for both development and production
- Clear configuration
- No conflicts

## Environment Variable Loading Order

Next.js loads environment variables in this order:
1. `.env.local` (always loaded, **highest priority**)
2. `.env.production` or `.env.development` (removed)
3. `.env` (removed)
4. `apphosting.yaml` env section (fallback only)

## Firebase App Hosting

Firebase App Hosting will automatically use the environment variables from `.env.local`. The `apphosting.yaml` contains minimal fallback configuration.

## Testing the Configuration

### Check Environment Variables
Visit: https://master-photocopy--master-photocopy.us-central1.hosted.app/api/env-debug

### Test Firebase Connection
Visit: https://master-photocopy--master-photocopy.us-central1.hosted.app/api/firebase-check

### Verify No Errors
Visit: https://master-photocopy--master-photocopy.us-central1.hosted.app/signup

You should **NOT** see the "Firebase not configured" error anymore.

## Development vs Production

### For Local Development:
1. Edit `.env.local`
2. Uncomment development settings
3. Run `npm run dev`

### For Production Deployment:
1. Keep `.env.local` with production settings
2. Push to GitHub (Firebase App Hosting auto-deploys)

## Security Notes

- `.env.local` is in `.gitignore` (not committed to git)
- `NEXT_PUBLIC_*` variables are safe to expose to browser
- Private keys (like `RAZORPAY_KEY_SECRET`) should never have `NEXT_PUBLIC_` prefix

## Troubleshooting

### Still Getting "Firebase not configured"?
1. Check `.env.local` exists
2. Verify Firebase variables are set correctly
3. Restart development server: `npm run dev`
4. Clear browser cache
5. Check browser console for errors

### For Firebase App Hosting:
1. Push changes to GitHub
2. Wait for deployment (3-5 minutes)
3. Check deployment logs in Firebase Console
