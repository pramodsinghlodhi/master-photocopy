import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';

// POST /api/orders/unassign-agent - Unassign agent from order
export async function POST(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();
    const { orderId, reason, unassignedBy } = await request.json();

    // Validate required fields
    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing required field: orderId' },
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
    
    // Check if order is assigned
    if (!order?.assignedAgentId) {
      return NextResponse.json(
        { error: 'Order is not currently assigned to any agent' },
        { status: 400 }
      );
    }

    const agentId = order.assignedAgentId;

    // Get agent data
    const agentDoc = await db.collection('agents').doc(agentId).get();
    const agent = agentDoc.data();

    // Create batch to update both order and agent
    const batch = db.batch();
    const currentTimestamp = new Date();

    // Update order - remove agent assignment
    const orderRef = db.collection('orders').doc(orderId);
    batch.update(orderRef, {
      assignedAgentId: null,
      status: order?.status === 'Processing' ? 'Pending' : order?.status,
      timeline: [...(order?.timeline || []), {
        ts: currentTimestamp,
        actor: unassignedBy || 'admin',
        action: 'agent_unassigned',
        note: `Agent ${agent?.first_name} ${agent?.last_name} unassigned${reason ? ` - Reason: ${reason}` : ''}`
      }],
      updatedAt: currentTimestamp,
      unassignedAt: currentTimestamp,
      unassignedReason: reason || 'No reason provided'
    });

    // Update agent status - make available if this was their current order
    if (agent && agent.current_order_id === orderId) {
      const agentRef = db.collection('agents').doc(agentId);
      batch.update(agentRef, {
        status: 'available',
        current_order_id: null,
        updatedAt: currentTimestamp
      });
    }

    // Commit the batch
    await batch.commit();

    // Get updated order data
    const updatedOrderDoc = await db.collection('orders').doc(orderId).get();
    const updatedOrder = { id: updatedOrderDoc.id, ...updatedOrderDoc.data() };

    return NextResponse.json({
      success: true,
      message: 'Agent unassigned from order successfully',
      data: {
        order: updatedOrder,
        previousAgent: {
          id: agentId,
          name: agent ? `${agent.first_name} ${agent.last_name}` : 'Unknown Agent',
          phone: agent?.phone || agent?.phone_number
        },
        reason: reason || 'No reason provided'
      }
    });

  } catch (error: any) {
    console.error('Error unassigning agent from order:', error);
    return NextResponse.json(
      { 
        error: 'Failed to unassign agent from order',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// PUT /api/orders/unassign-agent - Bulk unassign agent from multiple orders
export async function PUT(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();
    const { orderIds, reason, unassignedBy } = await request.json();

    // Validate required fields
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: orderIds (array)' },
        { status: 400 }
      );
    }

    // Get all orders to validate
    const orderPromises = orderIds.map(orderId => 
      db.collection('orders').doc(orderId).get()
    );
    const orderDocs = await Promise.all(orderPromises);

    // Validate orders and collect agent assignments
    const validOrders: any[] = [];
    const agentOrderMap: { [agentId: string]: string[] } = {};
    const errors: string[] = [];

    orderDocs.forEach((doc, index) => {
      const orderId = orderIds[index];
      if (!doc.exists) {
        errors.push(`Order ${orderId} not found`);
        return;
      }

      const order = doc.data();
      if (!order?.assignedAgentId) {
        errors.push(`Order ${orderId} is not assigned to any agent`);
        return;
      }

      validOrders.push({ id: orderId, data: order });
      
      // Group orders by agent
      const agentId = order.assignedAgentId;
      if (!agentOrderMap[agentId]) {
        agentOrderMap[agentId] = [];
      }
      agentOrderMap[agentId].push(orderId);
    });

    if (validOrders.length === 0) {
      return NextResponse.json(
        { 
          error: 'No valid orders to unassign',
          details: errors 
        },
        { status: 400 }
      );
    }

    // Get agent data for all affected agents
    const affectedAgentIds = Object.keys(agentOrderMap);
    const agentPromises = affectedAgentIds.map(agentId => 
      db.collection('agents').doc(agentId).get()
    );
    const agentDocs = await Promise.all(agentPromises);
    const agents: { [agentId: string]: any } = {};
    
    agentDocs.forEach((doc, index) => {
      if (doc.exists) {
        agents[affectedAgentIds[index]] = doc.data();
      }
    });

    // Create batch for bulk unassignment
    const batch = db.batch();
    const currentTimestamp = new Date();
    const unassignedOrders: string[] = [];

    // Update all valid orders
    validOrders.forEach(({ id: orderId, data: order }) => {
      const orderRef = db.collection('orders').doc(orderId);
      const agent = agents[order.assignedAgentId];
      
      batch.update(orderRef, {
        assignedAgentId: null,
        status: order?.status === 'Processing' ? 'Pending' : order?.status,
        timeline: [...(order?.timeline || []), {
          ts: currentTimestamp,
          actor: unassignedBy || 'admin',
          action: 'agent_unassigned',
          note: `Agent ${agent?.first_name} ${agent?.last_name} bulk unassigned${reason ? ` - Reason: ${reason}` : ''}`
        }],
        updatedAt: currentTimestamp,
        unassignedAt: currentTimestamp,
        unassignedReason: reason || 'Bulk unassignment'
      });
      unassignedOrders.push(orderId);
    });

    // Update affected agents
    Object.entries(agentOrderMap).forEach(([agentId, orderIds]) => {
      const agent = agents[agentId];
      if (agent) {
        const agentRef = db.collection('agents').doc(agentId);
        
        // If agent only has one of the orders being unassigned, make them available
        if (orderIds.includes(agent.current_order_id)) {
          batch.update(agentRef, {
            status: 'available',
            current_order_id: null,
            updatedAt: currentTimestamp
          });
        } else {
          // Just update the timestamp
          batch.update(agentRef, {
            updatedAt: currentTimestamp
          });
        }
      }
    });

    // Commit the batch
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `${validOrders.length} orders unassigned successfully`,
      data: {
        unassignedOrdersCount: validOrders.length,
        unassignedOrders,
        affectedAgents: affectedAgentIds.map(agentId => ({
          id: agentId,
          name: agents[agentId] ? `${agents[agentId].first_name} ${agents[agentId].last_name}` : 'Unknown Agent',
          orderCount: agentOrderMap[agentId].length
        })),
        reason: reason || 'Bulk unassignment',
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error: any) {
    console.error('Error bulk unassigning agents from orders:', error);
    return NextResponse.json(
      { 
        error: 'Failed to bulk unassign agents from orders',
        details: error.message 
      },
      { status: 500 }
    );
  }
}