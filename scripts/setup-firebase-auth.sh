#!/bin/bash

# Firebase Authentication Setup Script
echo "🔥 Firebase Authentication Setup for Master Photocopy"
echo "=================================================="

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Installing..."
    npm install -g firebase-tools
else
    echo "✅ Firebase CLI is already installed"
fi

# Check if user is logged in
if ! firebase login:list | grep -q "No users found"; then
    echo "✅ Firebase CLI is already logged in"
else
    echo "🔐 Logging into Firebase..."
    firebase login
fi

# Set the project
echo "🔧 Setting Firebase project to master-photocopy..."
firebase use master-photocopy

# Check project status
echo "📊 Project status:"
firebase projects:list | grep master-photocopy || echo "❌ Project master-photocopy not found"

# Set up Application Default Credentials for development
echo "🔑 Setting up Application Default Credentials..."
echo "This allows the Firebase Admin SDK to authenticate automatically in development."
echo ""
echo "Run the following command:"
echo "gcloud auth application-default login"
echo ""

# Deploy Firestore indexes
echo "📄 Deploying Firestore indexes..."
firebase deploy --only firestore:indexes

# Deploy Firestore rules
echo "🔒 Deploying Firestore rules..."
firebase deploy --only firestore:rules

echo ""
echo "🎉 Firebase setup complete!"
echo ""
echo "For production deployment, you'll need to:"
echo "1. Generate a service account key"
echo "2. Add it to FIREBASE_SERVICE_ACCOUNT_KEY environment variable"
echo "3. Update your hosting/deployment platform with the key"
echo ""
echo "For development, make sure to run:"
echo "gcloud auth application-default login"
echo ""