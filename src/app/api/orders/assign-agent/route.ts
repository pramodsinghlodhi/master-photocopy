import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';

// POST /api/orders/assign-agent - Assign agent to order for own delivery
export async function POST(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();
    const { orderId, agentId, assignedBy } = await request.json();

    // Validate required fields
    if (!orderId || !agentId) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId and agentId are required' },
        { status: 400 }
      );
    }

    // Verify order exists
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orderDoc.data();
    
    // Check if order is already assigned
    if (order?.assignedAgentId) {
      return NextResponse.json(
        { error: 'Order is already assigned to an agent' },
        { status: 400 }
      );
    }

    // Check if order is for own delivery
    if (order?.delivery?.type !== 'own') {
      return NextResponse.json(
        { error: 'Can only assign agents to own delivery orders' },
        { status: 400 }
      );
    }

    // Verify agent exists and is active
    const agentDoc = await db.collection('agents').doc(agentId).get();
    if (!agentDoc.exists) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    const agent = agentDoc.data();
    if (!agent?.approved || agent?.status === 'inactive') {
      return NextResponse.json(
        { error: 'Agent is not active or not approved' },
        { status: 400 }
      );
    }

    // Create batch to update both order and agent
    const batch = db.batch();
    const currentTimestamp = new Date();

    // Update order
    const orderRef = db.collection('orders').doc(orderId);
    batch.update(orderRef, {
      assignedAgentId: agentId,
      status: order?.status === 'Pending' ? 'Processing' : order?.status,
      timeline: [...(order?.timeline || []), {
        ts: currentTimestamp,
        actor: assignedBy || 'admin',
        action: 'agent_assigned',
        note: `Order assigned to agent ${agent?.first_name} ${agent?.last_name}`
      }],
      updatedAt: new Date(),
      assignedAt: currentTimestamp
    });

    // Update agent status and performance
    const agentRef = db.collection('agents').doc(agentId);
    batch.update(agentRef, {
      status: 'busy',
      current_order_id: orderId,
      assignedAt: currentTimestamp,
      'performance.orders_assigned': (agent?.performance?.orders_assigned || 0) + 1,
      updatedAt: currentTimestamp
    });

    // Commit the batch
    await batch.commit();

    // Get updated order and agent data
    const updatedOrderDoc = await db.collection('orders').doc(orderId).get();
    const updatedOrder = { id: updatedOrderDoc.id, ...updatedOrderDoc.data() };

    // TODO: Send notification to agent
    // This would integrate with the notification service
    console.log(`Order ${orderId} assigned to agent ${agentId}`);

    return NextResponse.json({
      success: true,
      message: 'Order assigned to agent successfully',
      data: {
        order: updatedOrder,
        agent: {
          id: agentId,
          name: `${agent?.first_name} ${agent?.last_name}`,
          phone: agent?.phone
        }
      }
    });

  } catch (error: any) {
    console.error('Error assigning agent to order:', error);
    return NextResponse.json(
      { 
        error: 'Failed to assign agent to order',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// PUT /api/orders/assign-agent - Bulk assign agent to multiple orders
export async function PUT(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();
    const { orderIds, agentId, assignedBy } = await request.json();

    // Validate required fields
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0 || !agentId) {
      return NextResponse.json(
        { error: 'Missing required fields: orderIds (array) and agentId are required' },
        { status: 400 }
      );
    }

    // Verify agent exists and is active
    const agentDoc = await db.collection('agents').doc(agentId).get();
    if (!agentDoc.exists) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    const agent = agentDoc.data();
    if (!agent?.approved || agent?.status === 'inactive') {
      return NextResponse.json(
        { error: 'Agent is not active or not approved' },
        { status: 400 }
      );
    }

    // Get all orders to validate
    const orderPromises = orderIds.map(orderId => 
      db.collection('orders').doc(orderId).get()
    );
    const orderDocs = await Promise.all(orderPromises);

    // Validate orders
    const validOrders: any[] = [];
    const errors: string[] = [];

    orderDocs.forEach((doc, index) => {
      const orderId = orderIds[index];
      if (!doc.exists) {
        errors.push(`Order ${orderId} not found`);
        return;
      }

      const order = doc.data();
      if (order?.assignedAgentId) {
        errors.push(`Order ${orderId} is already assigned`);
        return;
      }

      if (order?.delivery?.type !== 'own') {
        errors.push(`Order ${orderId} is not for own delivery`);
        return;
      }

      validOrders.push({ id: orderId, data: order });
    });

    if (errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some orders cannot be assigned',
          details: errors 
        },
        { status: 400 }
      );
    }

    if (validOrders.length === 0) {
      return NextResponse.json(
        { error: 'No valid orders to assign' },
        { status: 400 }
      );
    }

    // Create batch for bulk assignment
    const batch = db.batch();
    const currentTimestamp = new Date();
    const assignedOrders: any[] = [];

    // Update all valid orders
    validOrders.forEach(({ id: orderId, data: order }) => {
      const orderRef = db.collection('orders').doc(orderId);
      batch.update(orderRef, {
        assignedAgentId: agentId,
        status: order?.status === 'Pending' ? 'Processing' : order?.status,
        timeline: [...(order?.timeline || []), {
          ts: currentTimestamp,
          actor: assignedBy || 'admin',
          action: 'agent_assigned',
          note: `Order bulk assigned to agent ${agent?.first_name} ${agent?.last_name}`
        }],
        updatedAt: currentTimestamp,
        assignedAt: currentTimestamp
      });
      assignedOrders.push(orderId);
    });

    // Update agent with multiple orders (for now, we'll just update the count)
    // In a real scenario, you might want to handle multiple order assignments differently
    const agentRef = db.collection('agents').doc(agentId);
    batch.update(agentRef, {
      status: 'busy',
      assignedAt: currentTimestamp,
      'performance.orders_assigned': (agent?.performance?.orders_assigned || 0) + validOrders.length,
      updatedAt: currentTimestamp,
      // Store multiple assigned orders
      assigned_orders: validOrders.map(o => o.id)
    });

    // Commit the batch
    await batch.commit();

    // TODO: Send bulk notification to agent
    console.log(`${validOrders.length} orders assigned to agent ${agentId}`);

    return NextResponse.json({
      success: true,
      message: `${validOrders.length} orders assigned to agent successfully`,
      data: {
        assignedOrdersCount: validOrders.length,
        assignedOrders,
        agent: {
          id: agentId,
          name: `${agent?.first_name} ${agent?.last_name}`,
          phone: agent?.phone
        }
      }
    });

  } catch (error: any) {
    console.error('Error bulk assigning agent to orders:', error);
    return NextResponse.json(
      { 
        error: 'Failed to bulk assign agent to orders',
        details: error.message 
      },
      { status: 500 }
    );
  }
}