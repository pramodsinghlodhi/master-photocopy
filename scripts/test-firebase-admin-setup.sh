#!/bin/bash

# Firebase Service Account Setup Script
# This script helps set up Firebase Admin SDK credentials

echo "🔥 Firebase Service Account Setup"
echo "================================="

# Check if we have the project ID
PROJECT_ID="master-photocopy"
echo "📋 Project ID: $PROJECT_ID"

# Check current authentication status
echo ""
echo "🔍 Checking current Firebase Admin SDK status..."

# Check if FIREBASE_SERVICE_ACCOUNT_KEY is set
if [ -z "$FIREBASE_SERVICE_ACCOUNT_KEY" ]; then
    echo "❌ FIREBASE_SERVICE_ACCOUNT_KEY is not set"
    echo ""
    echo "📥 Please follow these steps:"
    echo "1. Go to: https://console.firebase.google.com/project/$PROJECT_ID/settings/serviceaccounts/adminsdk"
    echo "2. Click 'Generate new private key'"
    echo "3. Download the JSON file"
    echo "4. Copy the entire JSON content"
    echo "5. Add to .env file: FIREBASE_SERVICE_ACCOUNT_KEY='paste_json_here'"
    echo ""
    echo "Alternative for development:"
    echo "gcloud auth application-default login"
else
    echo "✅ FIREBASE_SERVICE_ACCOUNT_KEY is set"
    
    # Try to parse the JSON to validate
    echo "$FIREBASE_SERVICE_ACCOUNT_KEY" | python3 -m json.tool > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Service account key is valid JSON"
        
        # Extract project ID from service account
        SA_PROJECT_ID=$(echo "$FIREBASE_SERVICE_ACCOUNT_KEY" | python3 -c "import json,sys; print(json.load(sys.stdin)['project_id'])" 2>/dev/null)
        if [ "$SA_PROJECT_ID" = "$PROJECT_ID" ]; then
            echo "✅ Service account project ID matches"
        else
            echo "❌ Service account project ID mismatch: expected $PROJECT_ID, got $SA_PROJECT_ID"
        fi
    else
        echo "❌ Service account key is not valid JSON"
    fi
fi

echo ""
echo "🧪 Testing Firebase Admin SDK..."

# Test if we can initialize the admin SDK
if command -v node > /dev/null 2>&1; then
    cat > /tmp/test_firebase_admin.js << 'EOF'
const admin = require('firebase-admin');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

try {
    let app;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: 'master-photocopy'
        });
        console.log('✅ Firebase Admin SDK initialized with service account');
    } else {
        app = admin.initializeApp({
            projectId: 'master-photocopy'
        });
        console.log('✅ Firebase Admin SDK initialized with default credentials');
    }
    
    // Test Firestore access
    const db = admin.firestore(app);
    console.log('✅ Firestore instance created successfully');
    
    process.exit(0);
} catch (error) {
    console.error('❌ Firebase Admin SDK error:', error.message);
    process.exit(1);
}
EOF

    cd /Users/pramodsingh/Desktop/masterphotocopy
    node /tmp/test_firebase_admin.js
    RESULT=$?
    
    if [ $RESULT -eq 0 ]; then
        echo "🎉 Firebase Admin SDK is working correctly!"
    else
        echo "💥 Firebase Admin SDK test failed"
    fi
    
    rm -f /tmp/test_firebase_admin.js
else
    echo "⚠️  Node.js not available for testing"
fi

echo ""
echo "📚 For more help, see: scripts/setup-firebase-service-account.md"