import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';
import { AgentStatus } from '@/types/order-management';
import { Agent } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const agentId = searchParams.get('agentId');

    switch (action) {
      case 'agent-status': {
        if (!agentId) {
          return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
        }

        const [agentDoc, statusDoc] = await Promise.all([
          db.collection('agents').doc(agentId).get(),
          db.collection('agent_status').doc(agentId).get()
        ]);

        if (!agentDoc.exists) {
          return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        const agent = { ...agentDoc.data() } as Agent;
        const status = statusDoc.exists ? {
          ...statusDoc.data(),
          lastUpdated: statusDoc.data()?.lastUpdated?.toDate() || new Date(),
          lastCheckIn: statusDoc.data()?.lastCheckIn?.toDate(),
          lastCheckOut: statusDoc.data()?.lastCheckOut?.toDate(),
        } as AgentStatus : null;

        return NextResponse.json({
          success: true,
          agent,
          status
        });
      }

      case 'all-agent-status': {
        const [agentsSnapshot, statusSnapshot] = await Promise.all([
          db.collection('agents').get(),
          db.collection('agent_status').get()
        ]);

        const agents: Agent[] = agentsSnapshot.docs.map((doc: any) => ({
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        } as Agent));

        const statusMap = new Map();
        statusSnapshot.docs.forEach((doc: any) => {
          statusMap.set(doc.id, {
            ...doc.data(),
            lastUpdated: doc.data().lastUpdated?.toDate(),
            lastCheckIn: doc.data().lastCheckIn?.toDate(),
            lastCheckOut: doc.data().lastCheckOut?.toDate(),
          });
        });

        const agentsWithStatus = agents.map(agent => ({
          agent,
          status: statusMap.get(agent.agentId) || null
        }));

        return NextResponse.json({
          success: true,
          agentsWithStatus,
          summary: {
            total: agents.length,
            active: agentsWithStatus.filter(a => a.status?.status === 'active').length,
            inactive: agentsWithStatus.filter(a => a.status?.status === 'inactive').length,
            suspended: agentsWithStatus.filter(a => a.status?.status === 'suspended').length,
            checkedIn: agentsWithStatus.filter(a => a.status?.checkedIn === true).length,
          }
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Agent status API error:', error);
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
    const { action, agentId } = body;

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
    }

    const statusRef = db.collection('agent_status').doc(agentId);
    const statusDoc = await statusRef.get();

    switch (action) {
      case 'activate': {
        const { updatedBy, workloadCapacity = 5 } = body;

        const statusData: Partial<AgentStatus> = {
          agentId,
          status: 'active',
          workloadCapacity,
          currentWorkload: 0,
          lastUpdated: new Date(),
          updatedBy
        };

        if (statusDoc.exists) {
          await statusRef.update(statusData);
        } else {
          await statusRef.set({
            ...statusData,
            checkedIn: false,
            location: null,
            notes: ''
          });
        }

        // Also update agent status in agents collection
        await db.collection('agents').doc(agentId).update({
          status: 'active',
          updatedAt: new Date()
        });

        return NextResponse.json({ 
          success: true, 
          message: 'Agent activated successfully' 
        });
      }

      case 'suspend': {
        const { updatedBy, reason } = body;

        if (!statusDoc.exists) {
          return NextResponse.json({ 
            error: 'Agent status not found' 
          }, { status: 404 });
        }

        await statusRef.update({
          status: 'suspended',
          lastUpdated: new Date(),
          updatedBy,
          notes: reason || 'Suspended by admin'
        });

        // Also update agent status in agents collection
        await db.collection('agents').doc(agentId).update({
          status: 'suspended',
          updatedAt: new Date()
        });

        return NextResponse.json({ 
          success: true, 
          message: 'Agent suspended successfully' 
        });
      }

      case 'update-capacity': {
        const { workloadCapacity, updatedBy } = body;

        if (!statusDoc.exists) {
          return NextResponse.json({ 
            error: 'Agent status not found' 
          }, { status: 404 });
        }

        if (workloadCapacity < 1 || workloadCapacity > 20) {
          return NextResponse.json({ 
            error: 'Workload capacity must be between 1 and 20' 
          }, { status: 400 });
        }

        await statusRef.update({
          workloadCapacity,
          lastUpdated: new Date(),
          updatedBy
        });

        return NextResponse.json({ 
          success: true, 
          message: 'Workload capacity updated successfully' 
        });
      }

      case 'update-location': {
        const { lat, lng } = body;

        if (!statusDoc.exists) {
          return NextResponse.json({ 
            error: 'Agent status not found' 
          }, { status: 404 });
        }

        await statusRef.update({
          location: { lat, lng },
          lastUpdated: new Date()
        });

        return NextResponse.json({ 
          success: true, 
          message: 'Location updated successfully' 
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Agent status update error:', error);
    return NextResponse.json(
      { error: 'Failed to update agent status' },
      { status: 500 }
    );
  }
}