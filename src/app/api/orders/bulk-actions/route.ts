import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, writeBatch, getDoc } from 'firebase/firestore';

// POST /api/orders/bulk-actions - Perform bulk actions on orders
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: 'Firebase not initialized' },
        { status: 500 }
      );
    }

    const { action, orderIds, data } = await request.json();

    if (!action || !orderIds || !Array.isArray(orderIds)) {
      return NextResponse.json(
        { error: 'Missing required fields: action, orderIds' },
        { status: 400 }
      );
    }

    const batch = writeBatch(db);
    const results = [];

    switch (action) {
      case 'assign_agent':
        if (!data?.agentId) {
          return NextResponse.json(
            { error: 'Agent ID is required for assign_agent action' },
            { status: 400 }
          );
        }

        for (const orderId of orderIds) {
          const orderRef = doc(db, 'orders', orderId);
          const orderDoc = await getDoc(orderRef);
          
          if (orderDoc.exists()) {
            const currentData = orderDoc.data();
            const currentTimeline = currentData.timeline || [];
            
            batch.update(orderRef, {
              assignedAgentId: data.agentId,
              updatedAt: new Date(),
              timeline: [
                ...currentTimeline,
                {
                  status: currentData.status,
                  timestamp: new Date().toISOString(),
                  description: `Order assigned to agent`,
                  updatedBy: data.updatedBy || 'admin'
                }
              ]
            });
            results.push({ orderId, success: true });
          } else {
            results.push({ orderId, success: false, error: 'Order not found' });
          }
        }
        break;

      case 'update_status':
        if (!data?.status) {
          return NextResponse.json(
            { error: 'Status is required for update_status action' },
            { status: 400 }
          );
        }

        for (const orderId of orderIds) {
          const orderRef = doc(db, 'orders', orderId);
          const orderDoc = await getDoc(orderRef);
          
          if (orderDoc.exists()) {
            const currentData = orderDoc.data();
            const currentTimeline = currentData.timeline || [];
            
            batch.update(orderRef, {
              status: data.status,
              updatedAt: new Date(),
              timeline: [
                ...currentTimeline,
                {
                  status: data.status,
                  timestamp: new Date().toISOString(),
                  description: data.statusNote || `Bulk status update to ${data.status}`,
                  updatedBy: data.updatedBy || 'admin'
                }
              ]
            });
            results.push({ orderId, success: true });
          } else {
            results.push({ orderId, success: false, error: 'Order not found' });
          }
        }
        break;

      case 'update_delivery_type':
        if (!data?.deliveryType) {
          return NextResponse.json(
            { error: 'Delivery type is required for update_delivery_type action' },
            { status: 400 }
          );
        }

        for (const orderId of orderIds) {
          const orderRef = doc(db, 'orders', orderId);
          const orderDoc = await getDoc(orderRef);
          
          if (orderDoc.exists()) {
            const currentData = orderDoc.data();
            const currentDelivery = currentData.delivery || {};
            
            batch.update(orderRef, {
              delivery: {
                ...currentDelivery,
                type: data.deliveryType
              },
              updatedAt: new Date()
            });
            results.push({ orderId, success: true });
          } else {
            results.push({ orderId, success: false, error: 'Order not found' });
          }
        }
        break;

      case 'mark_urgent':
        for (const orderId of orderIds) {
          const orderRef = doc(db, 'orders', orderId);
          const orderDoc = await getDoc(orderRef);
          
          if (orderDoc.exists()) {
            batch.update(orderRef, {
              urgent: data?.urgent ?? true,
              updatedAt: new Date()
            });
            results.push({ orderId, success: true });
          } else {
            results.push({ orderId, success: false, error: 'Order not found' });
          }
        }
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported action: ${action}` },
          { status: 400 }
        );
    }

    // Commit the batch
    await batch.commit();

    return NextResponse.json({
      success: true,
      data: {
        action,
        processed: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }
    });

  } catch (error: any) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform bulk action',
        details: error.message 
      },
      { status: 500 }
    );
  }
}