import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';

// POST /api/ads/analytics - Track ad clicks and impressions
export async function POST(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();
    const { adId, type, metadata } = await request.json();

    if (!adId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: adId, type' },
        { status: 400 }
      );
    }

    if (!['click', 'impression'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "click" or "impression"' },
        { status: 400 }
      );
    }

    // Check if ad exists
    const adDoc = await db.collection('ads').doc(adId).get();
    if (!adDoc.exists) {
      return NextResponse.json(
        { error: 'Ad not found' },
        { status: 404 }
      );
    }

    // Update counter in the ad document
    const fieldName = type === 'click' ? 'clickCount' : 'impressionCount';
    const currentCount = adDoc.data()?.[fieldName] || 0;
    
    await db.collection('ads').doc(adId).update({
      [fieldName]: currentCount + 1,
      updatedAt: new Date()
    });

    // Log detailed analytics event
    const analyticsEvent = {
      adId,
      type,
      timestamp: new Date(),
      userAgent: request.headers.get('user-agent') || '',
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      referer: request.headers.get('referer') || '',
      metadata: metadata || {}
    };

    await db.collection('adAnalytics').add(analyticsEvent);

    return NextResponse.json({
      success: true,
      message: `${type} tracked successfully`,
      newCount: currentCount + 1
    });

  } catch (error: any) {
    console.error('Error tracking ad analytics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to track ad analytics',
        details: error.message,
        code: 'ANALYTICS_TRACKING_FAILED'
      },
      { status: 500 }
    );
  }
}

// GET /api/ads/analytics - Get ad analytics data
export async function GET(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();
    const { searchParams } = new URL(request.url);
    
    const adId = searchParams.get('adId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type'); // 'click' or 'impression'

    let query = db.collection('adAnalytics').orderBy('timestamp', 'desc');

    // Filter by ad ID
    if (adId) {
      query = query.where('adId', '==', adId);
    }

    // Filter by event type
    if (type && ['click', 'impression'].includes(type)) {
      query = query.where('type', '==', type);
    }

    // Filter by date range
    if (startDate) {
      query = query.where('timestamp', '>=', new Date(startDate));
    }
    if (endDate) {
      query = query.where('timestamp', '<=', new Date(endDate));
    }

    const snapshot = await query.limit(1000).get();
    
    const events = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        adId: data.adId,
        type: data.type,
        timestamp: data.timestamp?.toDate() || new Date(),
        userAgent: data.userAgent,
        ip: data.ip,
        referer: data.referer,
        metadata: data.metadata
      };
    });

    // Generate summary statistics
    const summary = {
      totalEvents: events.length,
      clicks: events.filter(e => e.type === 'click').length,
      impressions: events.filter(e => e.type === 'impression').length,
      uniqueAds: new Set(events.map(e => e.adId)).size,
      dateRange: {
        start: events.length > 0 ? events[events.length - 1].timestamp : null,
        end: events.length > 0 ? events[0].timestamp : null
      }
    };

    // Calculate CTR (Click Through Rate) if we have both clicks and impressions
    const ctr = summary.impressions > 0 ? 
      ((summary.clicks / summary.impressions) * 100).toFixed(2) : '0.00';

    return NextResponse.json({
      success: true,
      data: {
        events,
        summary: {
          ...summary,
          clickThroughRate: `${ctr}%`
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching ad analytics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch ad analytics',
        details: error.message,
        code: 'ANALYTICS_FETCH_FAILED'
      },
      { status: 500 }
    );
  }
}