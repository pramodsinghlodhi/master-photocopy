import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';
import { Order } from '@/lib/types';

// GET /api/orders/[id] - Fetch single order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getFirebaseAdminDB();
    const { id } = params;

    const orderDoc = await db.collection('orders').doc(id).get();

    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const data = orderDoc.data();
    const order: Order = {
      id: orderDoc.id,
      ...data,
      date: data?.date || data?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      createdAt: data?.createdAt?.toDate?.()?.toISOString() || data?.createdAt,
      updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || data?.updatedAt,
    } as Order;

    return NextResponse.json({
      success: true,
      data: order
    });

  } catch (error: any) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { 
        error: 'Firebase Admin SDK required for server-side access. Please configure service account credentials.',
        details: error.message 
      },
      { status: 403 }
    );
  }
}

// PUT /api/orders/[id] - Update order
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getFirebaseAdminDB();
    const { id } = params;
    const updateData = await request.json();

    // Check if order exists
    const orderDoc = await db.collection('orders').doc(id).get();
    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Add timestamp to update
    const finalUpdateData = {
      ...updateData,
      updatedAt: new Date()
    };

    // If status is being updated, add to timeline
    if (updateData.status) {
      const currentData = orderDoc.data();
      const currentTimeline = currentData?.timeline || [];
      
      finalUpdateData.timeline = [
        ...currentTimeline,
        {
          status: updateData.status,
          timestamp: new Date().toISOString(),
          description: updateData.statusNote || `Status updated to ${updateData.status}`,
          updatedBy: updateData.updatedBy || 'admin'
        }
      ];
    }

    await db.collection('orders').doc(id).update(finalUpdateData);

    // Fetch updated order
    const updatedDoc = await db.collection('orders').doc(id).get();
    const data = updatedDoc.data();
    const order: Order = {
      id: updatedDoc.id,
      ...data,
      date: data?.date || data?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      createdAt: data?.createdAt?.toDate?.()?.toISOString() || data?.createdAt,
      updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || data?.updatedAt,
    } as Order;

    return NextResponse.json({
      success: true,
      data: order
    });

  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { 
        error: 'Firebase Admin SDK required for server-side access. Please configure service account credentials.',
        details: error.message 
      },
      { status: 403 }
    );
  }
}

// DELETE /api/orders/[id] - Delete order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getFirebaseAdminDB();
    const { id } = params;

    // Check if order exists
    const orderDoc = await db.collection('orders').doc(id).get();
    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: `Order with ID '${id}' not found` },
        { status: 404 }
      );
    }

    // Delete the order
    await db.collection('orders').doc(id).delete();

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { 
        error: 'Firebase Admin SDK required for server-side access. Please configure service account credentials.',
        details: error.message 
      },
      { status: 403 }
    );
  }
}