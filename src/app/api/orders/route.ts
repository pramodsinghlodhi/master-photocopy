import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';
import { Order } from '@/lib/types';

// GET /api/orders - Fetch orders with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('paymentMethod');
    const deliveryType = searchParams.get('deliveryType');
    const urgent = searchParams.get('urgent');
    const agentId = searchParams.get('agentId');
    const lastDocId = searchParams.get('lastDocId');

    let ordersQuery = db.collection('orders').orderBy('createdAt', 'desc');

    // Apply filters
    if (status) {
      ordersQuery = ordersQuery.where('status', '==', status);
    }
    if (paymentMethod) {
      ordersQuery = ordersQuery.where('payment.method', '==', paymentMethod);
    }
    if (deliveryType) {
      ordersQuery = ordersQuery.where('delivery.type', '==', deliveryType);
    }
    if (urgent === 'true') {
      ordersQuery = ordersQuery.where('urgent', '==', true);
    }
    if (agentId) {
      ordersQuery = ordersQuery.where('assignedAgentId', '==', agentId);
    }

    // Apply pagination
    if (lastDocId) {
      const lastDoc = await db.collection('orders').doc(lastDocId).get();
      if (lastDoc.exists) {
        ordersQuery = ordersQuery.startAfter(lastDoc);
      }
    }

    ordersQuery = ordersQuery.limit(pageSize);

    const querySnapshot = await ordersQuery.get();
    const orders: Order[] = [];
    let lastDocSnapshot: any = undefined;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        ...data,
        // Ensure proper date handling for Admin SDK
        date: data.date || data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      } as Order);
      lastDocSnapshot = doc;
    });

    // Get total count for pagination (this is expensive, consider caching)
    const totalSnapshot = await db.collection('orders').get();
    const total = totalSnapshot.size;

    return NextResponse.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
          hasNext: orders.length === pageSize,
          lastDocId: lastDocSnapshot?.id || null
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching orders:', error);
    
    // Specific error handling for Firebase Admin SDK issues
    if (error.message && error.message.includes('Firebase Admin SDK not initialized')) {
      return NextResponse.json(
        { 
          error: 'Firebase Admin SDK Configuration Required',
          details: 'Server-side Firebase access requires either: 1) FIREBASE_SERVICE_ACCOUNT_KEY environment variable with service account JSON, or 2) Google Cloud application default credentials (run: gcloud auth application-default login)',
          code: 'ADMIN_SDK_NOT_CONFIGURED'
        },
        { status: 503 } // Service Unavailable
      );
    }
    
    if (error.message && (error.message.includes('permission-denied') || error.message.includes('PERMISSION_DENIED'))) {
      return NextResponse.json(
        { 
          error: 'Firebase Permission Denied',
          details: 'Firebase Admin SDK has insufficient permissions. Please check service account permissions or run: gcloud auth application-default login',
          code: 'PERMISSION_DENIED'
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch orders',
        details: error.message,
        code: 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();

    const orderData = await request.json();

    // Validate required fields
    if (!orderData.customer || !orderData.items || !orderData.totals) {
      return NextResponse.json(
        { error: 'Missing required fields: customer, items, totals' },
        { status: 400 }
      );
    }

    // Generate order ID
    const orderId = `MP${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const newOrder: Partial<Order> = {
      orderId,
      status: 'Pending',
      urgent: false,
      date: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      timeline: [{
        status: 'Pending',
        timestamp: new Date().toISOString(),
        description: 'Order created',
        updatedBy: 'system'
      }],
      delivery: {
        type: 'own'
      },
      payment: {
        method: 'cod',
        status: 'pending'
      },
      ...orderData
    };

    const docRef = await db.collection('orders').add(newOrder);
    
    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...newOrder
      }
    });

  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { 
        error: 'Firebase Admin SDK required for server-side access. Please configure service account credentials.',
        details: error.message 
      },
      { status: 403 }
    );
  }
}