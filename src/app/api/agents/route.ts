import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';

export interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  assigned_orders_count?: number;
}

// GET /api/agents - Fetch all agents
export async function GET(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    let agentsQuery = db.collection('agents').orderBy('created_at', 'desc');

    if (activeOnly) {
      agentsQuery = agentsQuery.where('is_active', '==', true);
    }

    const querySnapshot = await agentsQuery.get();
    const agents: Agent[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      agents.push({
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
        updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at,
      } as Agent);
    });

    // Get assigned orders count for each agent
    if (agents.length > 0) {
      for (const agent of agents) {
        const assignedOrdersSnapshot = await db.collection('orders')
          .where('assignedAgentId', '==', agent.id)
          .where('status', 'in', ['Processing', 'Shipped', 'Out for Delivery'])
          .get();
        agent.assigned_orders_count = assignedOrdersSnapshot.size;
      }
    }

    return NextResponse.json({
      success: true,
      data: agents
    });

  } catch (error: any) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { 
        error: 'Firebase Admin SDK required for server-side access. Please configure service account credentials.',
        details: error.message 
      },
      { status: 403 }
    );
  }
}

// POST /api/agents - Create new agent
export async function POST(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();

    const agentData = await request.json();

    // Validate required fields
    if (!agentData.first_name || !agentData.last_name || !agentData.email || !agentData.phone_number) {
      return NextResponse.json(
        { error: 'Missing required fields: first_name, last_name, email, phone_number' },
        { status: 400 }
      );
    }

    // Check if agent with same email already exists
    const existingAgentSnapshot = await db.collection('agents')
      .where('email', '==', agentData.email)
      .get();
    
    if (!existingAgentSnapshot.empty) {
      return NextResponse.json(
        { error: 'Agent with this email already exists' },
        { status: 400 }
      );
    }

    const newAgent = {
      first_name: agentData.first_name,
      last_name: agentData.last_name,
      email: agentData.email,
      phone_number: agentData.phone_number,
      is_active: agentData.is_active ?? true,
      created_at: new Date(),
      updated_at: new Date()
    };

    const docRef = await db.collection('agents').add(newAgent);
    
    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...newAgent,
        created_at: newAgent.created_at.toISOString(),
        updated_at: newAgent.updated_at.toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { 
        error: 'Firebase Admin SDK required for server-side access. Please configure service account credentials.',
        details: error.message 
      },
      { status: 403 }
    );
  }
}