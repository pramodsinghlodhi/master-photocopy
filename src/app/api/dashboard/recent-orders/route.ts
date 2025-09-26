import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();

    const { searchParams } = new URL(request.url);
    const limitCount = parseInt(searchParams.get('limit') || '5');

    // Fetch recent orders
    const ordersSnapshot = await db.collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(limitCount)
      .get();
    
    const recentOrders = ordersSnapshot.docs.map((doc) => {
      const order = doc.data();
      
      return {
        id: order.orderId || doc.id,
        user: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() || 
              order.customer?.email || 
              order.customer?.phone_number || 
              'Unknown Customer',
        status: order.status,
        total: order.totals?.total || 0,
        date: order.createdAt?.toDate() || new Date(order.date),
        customer: {
          email: order.customer?.email,
          phone: order.customer?.phone_number || order.customer?.phone,
          address: order.customer?.address
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: recentOrders
    });

  } catch (error: any) {
    console.error('Recent orders error:', error);
    
    return NextResponse.json(
      { 
        error: 'Firebase Admin SDK required for server-side access. Please configure service account credentials.',
        details: 'API routes need Firebase Admin SDK to access Firestore from the server.'
      },
      { status: 403 }
    );
  }
}