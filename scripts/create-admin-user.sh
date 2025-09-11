#!/bin/bash

# Admin User Setup Script for Master Photocopy
# This script helps create the first admin user in the system

echo "🔐 Master Photocopy - Admin User Setup"
echo "======================================"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "   npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "❌ You are not logged in to Firebase. Please login first:"
    echo "   firebase login"
    exit 1
fi

echo "✅ Firebase CLI is ready"
echo ""

# Get project ID
PROJECT_ID=$(firebase use 2>/dev/null | head -1)
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "Error: No project active. Run with" ]; then
    echo "❌ No active Firebase project found. Please set one:"
    echo "   firebase use --add"
    exit 1
fi

echo "📋 Active Project: $PROJECT_ID"
echo ""

# Prompt for admin email
read -p "📧 Enter admin email address: " ADMIN_EMAIL
if [ -z "$ADMIN_EMAIL" ]; then
    echo "❌ Email address is required"
    exit 1
fi

# Prompt for admin password
read -s -p "🔑 Enter admin password (min 6 characters): " ADMIN_PASSWORD
echo ""
if [ ${#ADMIN_PASSWORD} -lt 6 ]; then
    echo "❌ Password must be at least 6 characters long"
    exit 1
fi

# Prompt for admin name
read -p "👤 Enter admin full name: " ADMIN_NAME
if [ -z "$ADMIN_NAME" ]; then
    ADMIN_NAME="Administrator"
fi

echo ""
echo "📝 Creating admin user..."
echo "   Email: $ADMIN_EMAIL"
echo "   Name: $ADMIN_NAME"
echo "   Role: Admin"
echo ""

# Create the admin user setup script
cat > temp_admin_setup.js << EOF
const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: '$PROJECT_ID'
  });
}

const auth = getAuth();
const db = getFirestore();

async function createAdminUser() {
  try {
    console.log('🔄 Creating admin user...');
    
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: '$ADMIN_EMAIL',
      password: '$ADMIN_PASSWORD',
      displayName: '$ADMIN_NAME',
      emailVerified: true
    });
    
    console.log('✅ User created in Firebase Auth:', userRecord.uid);
    
    // Set admin custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'admin',
      admin: true,
      permissions: ['read', 'write', 'delete', 'manage_users', 'manage_system']
    });
    
    console.log('✅ Admin privileges set');
    
    // Create user document in Firestore
    const userData = {
      uid: userRecord.uid,
      email: '$ADMIN_EMAIL',
      name: '$ADMIN_NAME',
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'manage_users', 'manage_system'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
      profileComplete: true
    };
    
    await db.collection('users').doc(userRecord.uid).set(userData);
    console.log('✅ User document created in Firestore');
    
    // Create admin settings document
    const adminSettings = {
      createdBy: userRecord.uid,
      createdAt: new Date(),
      systemVersion: '1.0.0',
      maintenanceMode: false,
      adminUsers: [userRecord.uid]
    };
    
    await db.collection('settings').doc('admin').set(adminSettings);
    console.log('✅ Admin settings initialized');
    
    console.log('');
    console.log('🎉 Admin user created successfully!');
    console.log('📧 Email:', '$ADMIN_EMAIL');
    console.log('👤 Name:', '$ADMIN_NAME');
    console.log('🔑 UID:', userRecord.uid);
    console.log('');
    console.log('🔗 You can now access admin pages:');
    console.log('   • Configuration: https://master-photocopy--master-photocopy.us-central1.hosted.app/config');
    console.log('   • Installation: https://master-photocopy--master-photocopy.us-central1.hosted.app/install');
    console.log('   • Admin Dashboard: https://master-photocopy--master-photocopy.us-central1.hosted.app/admin');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    
    if (error.code === 'auth/email-already-exists') {
      console.log('');
      console.log('ℹ️  User already exists. Updating admin privileges...');
      
      try {
        const userRecord = await auth.getUserByEmail('$ADMIN_EMAIL');
        
        // Set admin custom claims
        await auth.setCustomUserClaims(userRecord.uid, {
          role: 'admin',
          admin: true,
          permissions: ['read', 'write', 'delete', 'manage_users', 'manage_system']
        });
        
        // Update user document in Firestore
        await db.collection('users').doc(userRecord.uid).set({
          uid: userRecord.uid,
          email: '$ADMIN_EMAIL',
          name: '$ADMIN_NAME',
          role: 'admin',
          permissions: ['read', 'write', 'delete', 'manage_users', 'manage_system'],
          isActive: true,
          updatedAt: new Date()
        }, { merge: true });
        
        console.log('✅ Existing user updated with admin privileges');
        console.log('🔑 UID:', userRecord.uid);
        
      } catch (updateError) {
        console.error('❌ Error updating existing user:', updateError);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
}

createAdminUser();
EOF

# Run the admin setup script
echo "🚀 Executing admin user creation..."
GOOGLE_APPLICATION_CREDENTIALS="" node temp_admin_setup.js

# Clean up temporary file
rm -f temp_admin_setup.js

echo ""
echo "✅ Admin setup complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Login with the admin credentials at: https://master-photocopy--master-photocopy.us-central1.hosted.app/login"
echo "   2. Access configuration page: https://master-photocopy--master-photocopy.us-central1.hosted.app/config"
echo "   3. Access installation page: https://master-photocopy--master-photocopy.us-central1.hosted.app/install"
echo "   4. Go to admin dashboard: https://master-photocopy--master-photocopy.us-central1.hosted.app/admin"
echo ""
echo "🔐 Both /config and /install pages are now protected and require admin authentication."
