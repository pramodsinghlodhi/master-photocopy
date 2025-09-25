import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  preferences?: {
    notifications?: boolean;
    emailUpdates?: boolean;
    smsUpdates?: boolean;
    language?: string;
    theme?: 'light' | 'dark' | 'auto';
  };
  role: 'customer' | 'agent' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  profilePicture?: string;
  wallet?: {
    balance: number;
    currency: string;
    lastUpdated: string;
  };
  loyalty?: {
    points: number;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    joinedAt: string;
  };
}

// GET /api/users/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const profile: UserProfile = {
      uid: userDoc.id,
      email: userData?.email || '',
      displayName: userData?.displayName || userData?.first_name + ' ' + userData?.last_name || '',
      firstName: userData?.firstName || userData?.first_name || '',
      lastName: userData?.lastName || userData?.last_name || '',
      phoneNumber: userData?.phoneNumber || userData?.phone || '',
      address: userData?.address || {},
      preferences: userData?.preferences || {
        notifications: true,
        emailUpdates: true,
        smsUpdates: false,
        language: 'en',
        theme: 'auto'
      },
      role: userData?.role || 'customer',
      isActive: userData?.isActive ?? true,
      createdAt: userData?.createdAt?.toDate?.()?.toISOString() || userData?.createdAt || new Date().toISOString(),
      updatedAt: userData?.updatedAt?.toDate?.()?.toISOString() || userData?.updatedAt || new Date().toISOString(),
      lastLoginAt: userData?.lastLoginAt?.toDate?.()?.toISOString() || userData?.lastLoginAt,
      profilePicture: userData?.profilePicture,
      wallet: userData?.wallet || {
        balance: 0,
        currency: 'INR',
        lastUpdated: new Date().toISOString()
      },
      loyalty: userData?.loyalty || {
        points: 0,
        tier: 'bronze',
        joinedAt: userData?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }
    };

    return NextResponse.json({
      success: true,
      data: profile
    });

  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    
    if (error.message && error.message.includes('Firebase Admin SDK not initialized')) {
      return NextResponse.json(
        { 
          error: 'Server Configuration Error',
          details: 'Firebase Admin SDK not configured. Please contact administrator.',
          code: 'ADMIN_SDK_NOT_CONFIGURED'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch user profile',
        details: error.message,
        code: 'PROFILE_FETCH_FAILED'
      },
      { status: 500 }
    );
  }
}

// POST /api/users/profile - Create new user profile
export async function POST(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();
    const profileData = await request.json();

    // Validate required fields
    if (!profileData.uid || !profileData.email) {
      return NextResponse.json(
        { error: 'Missing required fields: uid, email' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.collection('users').doc(profileData.uid).get();
    if (existingUser.exists) {
      return NextResponse.json(
        { error: 'User profile already exists' },
        { status: 400 }
      );
    }

    const newProfile: Partial<UserProfile> = {
      uid: profileData.uid,
      email: profileData.email,
      displayName: profileData.displayName || profileData.firstName + ' ' + profileData.lastName || '',
      firstName: profileData.firstName || '',
      lastName: profileData.lastName || '',
      phoneNumber: profileData.phoneNumber || '',
      address: profileData.address || {},
      preferences: profileData.preferences || {
        notifications: true,
        emailUpdates: true,
        smsUpdates: false,
        language: 'en',
        theme: 'auto'
      },
      role: profileData.role || 'customer',
      isActive: profileData.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profilePicture: profileData.profilePicture,
      wallet: {
        balance: 0,
        currency: 'INR',
        lastUpdated: new Date().toISOString()
      },
      loyalty: {
        points: 0,
        tier: 'bronze',
        joinedAt: new Date().toISOString()
      }
    };

    await db.collection('users').doc(profileData.uid).set(newProfile);

    return NextResponse.json({
      success: true,
      data: newProfile
    });

  } catch (error: any) {
    console.error('Error creating user profile:', error);
    
    if (error.message && error.message.includes('Firebase Admin SDK not initialized')) {
      return NextResponse.json(
        { 
          error: 'Server Configuration Error',
          details: 'Firebase Admin SDK not configured. Please contact administrator.',
          code: 'ADMIN_SDK_NOT_CONFIGURED'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create user profile',
        details: error.message,
        code: 'PROFILE_CREATION_FAILED'
      },
      { status: 500 }
    );
  }
}

// PUT /api/users/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();
    const updateData = await request.json();

    if (!updateData.uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userRef = db.collection('users').doc(updateData.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prepare update data (exclude uid from updates)
    const { uid, ...updates } = updateData;
    updates.updatedAt = new Date().toISOString();

    await userRef.update(updates);

    // Fetch updated profile
    const updatedDoc = await userRef.get();
    const updatedData = updatedDoc.data();

    return NextResponse.json({
      success: true,
      data: {
        uid: updatedDoc.id,
        ...updatedData
      }
    });

  } catch (error: any) {
    console.error('Error updating user profile:', error);
    
    if (error.message && error.message.includes('Firebase Admin SDK not initialized')) {
      return NextResponse.json(
        { 
          error: 'Server Configuration Error',
          details: 'Firebase Admin SDK not configured. Please contact administrator.',
          code: 'ADMIN_SDK_NOT_CONFIGURED'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update user profile',
        details: error.message,
        code: 'PROFILE_UPDATE_FAILED'
      },
      { status: 500 }
    );
  }
}