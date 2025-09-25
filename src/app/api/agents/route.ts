import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';

export interface Agent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  phone?: string; // Support both phone formats
  is_active: boolean;
  status?: 'available' | 'busy' | 'offline' | 'inactive';
  approved?: boolean;
  verification_status?: string;
  created_at: string;
  updated_at: string;
  assigned_orders_count?: number;
  performance?: {
    orders_assigned: number;
    deliveries_completed: number;
    average_rating: number;
    total_earnings: number;
  };
  location?: {
    latitude: number | null;
    longitude: number | null;
    last_updated: any;
  };
  city?: string;
  state?: string;
  current_order_id?: string;
  assignedAt?: any;
}

// GET /api/agents - Fetch all agents with enhanced filtering
export async function GET(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    const available = searchParams.get('available') === 'true';
    const approved = searchParams.get('approved');
    const status = searchParams.get('status');
    const city = searchParams.get('city');

    let agentsQuery = db.collection('agents').orderBy('created_at', 'desc');

    // Legacy support for is_active field
    if (activeOnly) {
      agentsQuery = agentsQuery.where('is_active', '==', true);
    }

    // New status-based filtering
    if (available) {
      // Get available agents (approved, active status)
      agentsQuery = agentsQuery.where('approved', '==', true);
      if (!status) {
        agentsQuery = agentsQuery.where('status', '==', 'available');
      }
    }

    if (approved !== null && approved !== undefined) {
      agentsQuery = agentsQuery.where('approved', '==', approved === 'true');
    }

    if (status && status !== 'all') {
      agentsQuery = agentsQuery.where('status', '==', status);
    }

    if (city && city !== 'all') {
      agentsQuery = agentsQuery.where('city', '==', city);
    }

    const querySnapshot = await agentsQuery.get();
    const agents: Agent[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      agents.push({
        id: doc.id,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone_number: data.phone_number || data.phone || '',
        phone: data.phone || data.phone_number || '',
        is_active: data.is_active ?? (data.status !== 'inactive'),
        status: data.status || (data.is_active ? 'available' : 'inactive'),
        approved: data.approved ?? data.is_active,
        verification_status: data.verification_status || 'approved',
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at || data.registeredAt?.toDate?.()?.toISOString(),
        updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at || data.updatedAt?.toDate?.()?.toISOString(),
        performance: data.performance || {
          orders_assigned: 0,
          deliveries_completed: 0,
          average_rating: 0,
          total_earnings: 0
        },
        location: data.location,
        city: data.city,
        state: data.state,
        current_order_id: data.current_order_id,
        assignedAt: data.assignedAt
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
      data: agents,
      filters: {
        active: activeOnly,
        available,
        approved,
        status,
        city
      }
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