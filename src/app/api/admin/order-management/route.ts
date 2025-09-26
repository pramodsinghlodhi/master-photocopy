import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';
import { OrderManagementService } from '@/lib/order-management';
import { Order, Agent } from '@/lib/types';
import { AgentStatus } from '@/types/order-management';

export async function GET(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    switch (action) {
      case 'available-agents': {
        // Get all active agents with their current status
        const [agentsSnapshot, statusSnapshot] = await Promise.all([
          db.collection('agents').where('status', '==', 'active').get(),
          db.collection('agent_status').get()
        ]);

        const agents: Agent[] = agentsSnapshot.docs.map((doc: any) => ({
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        } as Agent));

        const agentStatuses: AgentStatus[] = statusSnapshot.docs.map((doc: any) => ({
          ...doc.data(),
          lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
          lastCheckIn: doc.data().lastCheckIn?.toDate(),
          lastCheckOut: doc.data().lastCheckOut?.toDate(),
        } as AgentStatus));

        const workloads = OrderManagementService.getAgentWorkloads(agents, agentStatuses);

        return NextResponse.json({
          success: true,
          agents,
          workloads,
          totalActive: agents.length,
          totalCapacity: agentStatuses.reduce((sum, status) => sum + (status.workloadCapacity || 0), 0),
          currentLoad: agentStatuses.reduce((sum, status) => sum + (status.currentWorkload || 0), 0)
        });
      }

      case 'orders-with-details': {
        const limit = parseInt(searchParams.get('limit') || '50');
        const status = searchParams.get('status');
        const agentId = searchParams.get('agentId');

        // Build query
        let ordersQuery = db.collection('orders').orderBy('createdAt', 'desc');
        
        if (status && status !== 'all') {
          ordersQuery = ordersQuery.where('status', '==', status);
        }

        if (agentId) {
          ordersQuery = ordersQuery.where('assignedAgentId', '==', agentId);
        }

        const ordersSnapshot = await ordersQuery.limit(limit).get();
        
        const orders: Order[] = ordersSnapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        } as Order));

        // Get assignments for these orders
        const orderIds = orders.map(order => order.id);
        const assignmentsSnapshot = await db.collection('order_assignments')
          .where('orderId', 'in', orderIds)
          .get();

        const assignments = new Map();
        assignmentsSnapshot.docs.forEach((doc: any) => {
          assignments.set(doc.data().orderId, {
            ...doc.data(),
            assignedAt: doc.data().assignedAt?.toDate(),
            acceptedAt: doc.data().acceptedAt?.toDate(),
            completedAt: doc.data().completedAt?.toDate(),
          });
        });

        const ordersWithDetails = orders.map(order => ({
          ...order,
          assignment: assignments.get(order.id) || null,
        }));

        return NextResponse.json({
          success: true,
          orders: ordersWithDetails,
          total: ordersWithDetails.length,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Order management API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'assign-order': {
        const { orderId, agentId, assignedBy, notes, autoAssign } = body;

        if (autoAssign) {
          // Get available agents and current statuses
          const [agentsSnapshot, statusSnapshot, orderDoc] = await Promise.all([
            db.collection('agents').where('status', '==', 'active').get(),
            db.collection('agent_status').get(),
            db.collection('orders').doc(orderId).get()
          ]);

          if (!orderDoc.exists) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
          }

          const order = { id: orderDoc.id, ...orderDoc.data() } as Order;
          const agents: Agent[] = agentsSnapshot.docs.map((doc: any) => ({
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          } as Agent));

          const agentStatuses: AgentStatus[] = statusSnapshot.docs.map((doc: any) => ({
            ...doc.data(),
            lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
          } as AgentStatus));

          // Find best agent
          const bestAgent = OrderManagementService.findBestAgent(
            agents,
            agentStatuses,
            order
          );

          if (!bestAgent) {
            return NextResponse.json({ 
              error: 'No available agents found for assignment' 
            }, { status: 400 });
          }

          const selectedAgentId = bestAgent.agentId;
          const assignment = OrderManagementService.createOrderAssignment(
            orderId,
            selectedAgentId,
            assignedBy,
            notes || 'Auto-assigned by system'
          );

          // Create assignment and update order
          const batch = db.batch();
          const assignmentRef = db.collection('order_assignments').doc();
          const orderRef = db.collection('orders').doc(orderId);
          const statusRef = db.collection('agent_status').doc(selectedAgentId);

          batch.set(assignmentRef, assignment);
          batch.update(orderRef, {
            assignedAgentId: selectedAgentId,
            status: 'Processing',
            updatedAt: new Date()
          });

          // Update agent workload
          const agentStatus = agentStatuses.find(s => s.agentId === selectedAgentId);
          if (agentStatus) {
            batch.update(statusRef, {
              currentWorkload: (agentStatus.currentWorkload || 0) + 1,
              lastUpdated: new Date()
            });
          }

          await batch.commit();

          return NextResponse.json({
            success: true,
            assignedAgentId: selectedAgentId,
            agentName: `${bestAgent.first_name} ${bestAgent.last_name}`,
            assignment
          });
        } else {
          // Manual assignment
          if (!agentId) {
            return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
          }

          // Verify agent availability
          const [agentDoc, statusDoc] = await Promise.all([
            db.collection('agents').doc(agentId).get(),
            db.collection('agent_status').doc(agentId).get()
          ]);

          if (!agentDoc.exists) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
          }

          const agent = { ...agentDoc.data() } as Agent;
          const status = statusDoc.exists ? { ...statusDoc.data() } as AgentStatus : null;

          if (!OrderManagementService.canAssignToAgent(agent, status!)) {
            return NextResponse.json({ 
              error: 'Agent is not available for assignment' 
            }, { status: 400 });
          }

          const assignment = OrderManagementService.createOrderAssignment(
            orderId,
            agentId,
            assignedBy,
            notes
          );

          // Create assignment and update order
          const batch = db.batch();
          const assignmentRef = db.collection('order_assignments').doc();
          const orderRef = db.collection('orders').doc(orderId);
          const statusRef = db.collection('agent_status').doc(agentId);

          batch.set(assignmentRef, assignment);
          batch.update(orderRef, {
            assignedAgentId: agentId,
            status: 'Processing',
            updatedAt: new Date()
          });

          // Update agent workload
          if (status) {
            batch.update(statusRef, {
              currentWorkload: (status.currentWorkload || 0) + 1,
              lastUpdated: new Date()
            });
          }

          await batch.commit();

          return NextResponse.json({
            success: true,
            assignedAgentId: agentId,
            agentName: `${agent.first_name} ${agent.last_name}`,
            assignment
          });
        }
      }

      case 'update-assignment-status': {
        const { orderId, agentId, status, notes } = body;

        const assignmentSnapshot = await db.collection('order_assignments')
          .where('orderId', '==', orderId)
          .where('agentId', '==', agentId)
          .limit(1)
          .get();

        if (assignmentSnapshot.empty) {
          return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
        }

        const assignmentDoc = assignmentSnapshot.docs[0];
        const updateData: any = {
          status,
          lastUpdated: new Date()
        };

        if (notes) updateData.notes = notes;
        if (status === 'accepted') updateData.acceptedAt = new Date();
        if (status === 'completed') updateData.completedAt = new Date();

        await assignmentDoc.ref.update(updateData);

        // Update order status if needed
        if (status === 'accepted') {
          await db.collection('orders').doc(orderId).update({
            status: 'Out for Delivery',
            updatedAt: new Date()
          });
        } else if (status === 'completed') {
          await db.collection('orders').doc(orderId).update({
            status: 'Delivered',
            updatedAt: new Date()
          });

          // Reduce agent workload
          const statusRef = db.collection('agent_status').doc(agentId);
          const statusDoc = await statusRef.get();
          if (statusDoc.exists) {
            const currentWorkload = statusDoc.data()?.currentWorkload || 0;
            await statusRef.update({
              currentWorkload: Math.max(0, currentWorkload - 1),
              lastUpdated: new Date()
            });
          }
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Order assignment error:', error);
    return NextResponse.json(
      { error: 'Failed to process assignment' },
      { status: 500 }
    );
  }
}