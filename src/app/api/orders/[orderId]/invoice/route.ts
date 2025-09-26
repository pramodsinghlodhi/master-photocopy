import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';

const db = getFirebaseAdminDB();

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;
    
    // Check authentication
    const user = getUserFromRequest(request);
    if (!user || !user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get order from Firestore
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = orderDoc.data();
    
    // Verify user owns this order or is admin
    const isAdmin = user.role === 'admin';
    const isOwner = orderData?.userId === user.id;
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Return order data for invoice generation
    const invoiceData = {
      orderId: orderDoc.id,
      ...orderData,
      createdAt: orderData?.createdAt?.toDate?.()?.toISOString() || orderData?.createdAt,
      updatedAt: orderData?.updatedAt?.toDate?.()?.toISOString() || orderData?.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: invoiceData
    });

  } catch (error: any) {
    console.error('Error generating invoice data:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice data' },
      { status: 500 }
    );
  }
}