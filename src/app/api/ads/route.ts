import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';

export interface AdBanner {
  id: string;
  title: string;
  imageURL: string;
  redirectURL: string;
  width: number;
  height: number;
  isActive: boolean;
  priority: number;
  startDate?: Date;
  endDate?: Date;
  clickCount: number;
  impressionCount: number;
  targetAudience?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// GET /api/ads - Fetch all ad banners
export async function GET(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();
    const { searchParams } = new URL(request.url);
    
    const activeOnly = searchParams.get('active') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = db.collection('ads').orderBy('priority', 'desc').orderBy('createdAt', 'desc');
    
    if (activeOnly) {
      query = query.where('isActive', '==', true);
      
      // Filter by date range if specified
      const now = new Date();
      query = query.where('startDate', '<=', now);
    }

    const snapshot = await query.limit(limit).get();
    
    const ads: AdBanner[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      startDate: doc.data().startDate?.toDate(),
      endDate: doc.data().endDate?.toDate()
    })) as AdBanner[];

    // Filter by end date if needed
    const filteredAds = activeOnly 
      ? ads.filter(ad => !ad.endDate || ad.endDate > new Date())
      : ads;

    return NextResponse.json({
      success: true,
      data: filteredAds,
      total: filteredAds.length
    });

  } catch (error: any) {
    console.error('Error fetching ads:', error);
    
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
        error: 'Failed to fetch ads',
        details: error.message,
        code: 'ADS_FETCH_FAILED'
      },
      { status: 500 }
    );
  }
}

// POST /api/ads - Create new ad banner
export async function POST(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();
    const adData = await request.json();

    // Validate required fields
    if (!adData.title || !adData.imageURL || !adData.redirectURL) {
      return NextResponse.json(
        { error: 'Missing required fields: title, imageURL, redirectURL' },
        { status: 400 }
      );
    }

    // Validate dimensions
    if (!adData.width || !adData.height || adData.width <= 0 || adData.height <= 0) {
      return NextResponse.json(
        { error: 'Invalid dimensions: width and height must be positive numbers' },
        { status: 400 }
      );
    }

    // Validate URL formats
    try {
      new URL(adData.imageURL);
      // redirectURL can be relative or absolute
      if (adData.redirectURL.startsWith('http')) {
        new URL(adData.redirectURL);
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format for imageURL or redirectURL' },
        { status: 400 }
      );
    }

    // Get the highest priority for new ads
    const existingAdsSnapshot = await db.collection('ads').orderBy('priority', 'desc').limit(1).get();
    const highestPriority = existingAdsSnapshot.empty ? 0 : existingAdsSnapshot.docs[0].data().priority || 0;

    // Create ad banner data
    const newAd: Omit<AdBanner, 'id'> = {
      title: adData.title.trim(),
      imageURL: adData.imageURL.trim(),
      redirectURL: adData.redirectURL.trim(),
      width: parseInt(adData.width),
      height: parseInt(adData.height),
      isActive: adData.isActive ?? true,
      priority: (adData.priority ?? highestPriority) + 1,
      startDate: adData.startDate ? new Date(adData.startDate) : new Date(),
      endDate: adData.endDate ? new Date(adData.endDate) : undefined,
      clickCount: 0,
      impressionCount: 0,
      targetAudience: adData.targetAudience || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: adData.createdBy || 'admin' // In production, get from auth token
    };

    const docRef = await db.collection('ads').add(newAd);

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...newAd
      },
      message: 'Ad banner created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating ad:', error);
    
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
        error: 'Failed to create ad banner',
        details: error.message,
        code: 'AD_CREATION_FAILED'
      },
      { status: 500 }
    );
  }
}

// PUT /api/ads - Update ad banner
export async function PUT(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();
    const updateData = await request.json();
    const { id, ...adData } = updateData;

    if (!id) {
      return NextResponse.json(
        { error: 'Ad ID is required for update' },
        { status: 400 }
      );
    }

    // Check if ad exists
    const adDoc = await db.collection('ads').doc(id).get();
    if (!adDoc.exists) {
      return NextResponse.json(
        { error: 'Ad banner not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateFields: any = {
      ...adData,
      updatedAt: new Date()
    };

    // Convert date strings to Date objects
    if (updateFields.startDate) {
      updateFields.startDate = new Date(updateFields.startDate);
    }
    if (updateFields.endDate) {
      updateFields.endDate = new Date(updateFields.endDate);
    }

    // Ensure numeric fields
    if (updateFields.width) updateFields.width = parseInt(updateFields.width);
    if (updateFields.height) updateFields.height = parseInt(updateFields.height);
    if (updateFields.priority !== undefined) updateFields.priority = parseInt(updateFields.priority);

    await db.collection('ads').doc(id).update(updateFields);

    // Get updated document
    const updatedDoc = await db.collection('ads').doc(id).get();
    const updatedData = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      createdAt: updatedDoc.data()?.createdAt?.toDate(),
      updatedAt: updatedDoc.data()?.updatedAt?.toDate(),
      startDate: updatedDoc.data()?.startDate?.toDate(),
      endDate: updatedDoc.data()?.endDate?.toDate()
    };

    return NextResponse.json({
      success: true,
      data: updatedData,
      message: 'Ad banner updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating ad:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update ad banner',
        details: error.message,
        code: 'AD_UPDATE_FAILED'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/ads - Delete ad banner
export async function DELETE(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Ad ID is required for deletion' },
        { status: 400 }
      );
    }

    // Check if ad exists
    const adDoc = await db.collection('ads').doc(id).get();
    if (!adDoc.exists) {
      return NextResponse.json(
        { error: 'Ad banner not found' },
        { status: 404 }
      );
    }

    await db.collection('ads').doc(id).delete();

    return NextResponse.json({
      success: true,
      message: 'Ad banner deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting ad:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete ad banner',
        details: error.message,
        code: 'AD_DELETION_FAILED'
      },
      { status: 500 }
    );
  }
}