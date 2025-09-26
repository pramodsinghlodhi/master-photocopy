import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Admin Setup Cloud Function
export const createAdminUser = functions.https.onCall(async (data, context) => {
  try {
    const { email, password, name, secretKey } = data;
    
    // Basic security check - you should use a proper secret in production
    if (!secretKey || secretKey !== "master-photocopy-admin-setup-2024") {
      throw new functions.https.HttpsError('permission-denied', 'Invalid secret key');
    }

    if (!email || !password || !name) {
      throw new functions.https.HttpsError('invalid-argument', 'Email, password, and name are required');
    }

    if (password.length < 6) {
      throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 6 characters');
    }

    const auth = admin.auth();
    const db = admin.firestore();

    // Check if user already exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log('User already exists, updating admin privileges...');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Create new user
        userRecord = await auth.createUser({
          email: email,
          password: password,
          displayName: name,
          emailVerified: true
        });
        console.log('New user created:', userRecord.uid);
      } else {
        throw error;
      }
    }

    // Set admin custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'admin',
      admin: true,
      permissions: ['read', 'write', 'delete', 'manage_users', 'manage_system']
    });

    // Create/update user document in Firestore
    const userData = {
      uid: userRecord.uid,
      email: email,
      name: name,
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'manage_users', 'manage_system'],
      isActive: true,
      createdAt: userRecord.metadata.creationTime || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: null,
      profileComplete: true
    };

    await db.collection('users').doc(userRecord.uid).set(userData, { merge: true });

    // Create/update admin settings
    const adminSettings = {
      createdBy: userRecord.uid,
      updatedAt: new Date().toISOString(),
      systemVersion: '1.0.0',
      maintenanceMode: false,
      adminUsers: admin.firestore.FieldValue.arrayUnion(userRecord.uid)
    };

    await db.collection('settings').doc('admin').set(adminSettings, { merge: true });

    return {
      success: true,
      message: 'Admin user created/updated successfully',
      userId: userRecord.uid,
      email: email,
      name: name
    };

  } catch (error: any) {
    console.error('Error creating admin user:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to create admin user: ' + error.message);
  }
});

// Function to update existing user to admin
export const makeUserAdmin = functions.https.onCall(async (data, context) => {
  // Only existing admins can make other users admin
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  try {
    const { userId } = data;
    
    if (!userId) {
      throw new functions.https.HttpsError('invalid-argument', 'User ID is required');
    }

    const auth = admin.auth();
    const db = admin.firestore();

    // Set admin custom claims
    await auth.setCustomUserClaims(userId, {
      role: 'admin',
      admin: true,
      permissions: ['read', 'write', 'delete', 'manage_users', 'manage_system']
    });

    // Update user document in Firestore
    await db.collection('users').doc(userId).update({
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'manage_users', 'manage_system'],
      updatedAt: new Date().toISOString()
    });

    // Update admin settings
    await db.collection('settings').doc('admin').update({
      adminUsers: admin.firestore.FieldValue.arrayUnion(userId),
      updatedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: 'User promoted to admin successfully',
      userId: userId
    };

  } catch (error: any) {
    console.error('Error making user admin:', error);
    throw new functions.https.HttpsError('internal', 'Failed to promote user to admin: ' + error.message);
  }
});

// Function to list all admin users (admin only)
export const listAdminUsers = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  try {
    const db = admin.firestore();
    
    const adminUsersSnapshot = await db.collection('users')
      .where('role', '==', 'admin')
      .get();

    const adminUsers = adminUsersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      adminUsers: adminUsers
    };

  } catch (error: any) {
    console.error('Error listing admin users:', error);
    throw new functions.https.HttpsError('internal', 'Failed to list admin users: ' + error.message);
  }
});
