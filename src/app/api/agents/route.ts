import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';

export interface Agent {
  id: string;
  agentId?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  phone?: string; // Support both phone formats
  password?: string;
  is_active: boolean;
  status?: 'available' | 'busy' | 'offline' | 'inactive' | 'pending' | 'active' | 'suspended';
  approved?: boolean;
  verification_status?: string;
  created_at: string;
  updated_at: string;
  assigned_orders_count?: number;
  // Enhanced profile fields
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  vehicle?: {
    type: 'bike' | 'car' | 'bicycle' | 'scooter';
    number: string;
    model?: string;
    color?: string;
  };
  documents?: {
    idProofUrl?: string;
    addressProofUrl?: string;
    vehicleProofUrl?: string;
    licenseUrl?: string;
  };
  onboarding?: {
    completed: boolean;
    approvedAt?: Date;
    approvedBy?: string;
    notes?: string;
  };
  performance?: {
    orders_assigned: number;
    deliveries_completed: number;
    average_rating: number;
    total_earnings: number;
    completionRate?: number;
    averageDeliveryTime?: number; // in minutes
  };
  location?: {
    latitude: number | null;
    longitude: number | null;
    last_updated: any;
    address?: string;
  };
  availability?: {
    isOnline: boolean;
    lastSeen?: Date;
    workingHours?: {
      start: string; // "09:00"
      end: string;   // "18:00"
      days: string[]; // ["monday", "tuesday", ...]
    };
  };
  bankDetails?: {
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
    bankName?: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
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

// POST /api/agents - Create new agent with comprehensive profile
export async function POST(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();

    const agentData = await request.json();

    // Validate required fields
    if (!agentData.first_name || !agentData.last_name || !agentData.phone_number) {
      return NextResponse.json(
        { error: 'Missing required fields: first_name, last_name, phone_number' },
        { status: 400 }
      );
    }

    // Check if agent with same phone number already exists
    const existingAgentSnapshot = await db.collection('agents')
      .where('phone_number', '==', agentData.phone_number)
      .get();
    
    if (!existingAgentSnapshot.empty) {
      return NextResponse.json(
        { error: 'Agent with this phone number already exists' },
        { status: 400 }
      );
    }

    // Check if agent with same email already exists (if email provided)
    if (agentData.email) {
      const existingEmailSnapshot = await db.collection('agents')
        .where('email', '==', agentData.email)
        .get();
      
      if (!existingEmailSnapshot.empty) {
        return NextResponse.json(
          { error: 'Agent with this email already exists' },
          { status: 400 }
        );
      }
    }

    // Generate agent ID if not provided
    const agentId = agentData.agentId || `AG${Date.now().toString().slice(-6)}`;

    const newAgent: Partial<Agent> = {
      agentId,
      first_name: agentData.first_name,
      last_name: agentData.last_name,
      email: agentData.email || '',
      phone_number: agentData.phone_number,
      phone: agentData.phone_number, // Legacy support
      password: agentData.password, // In production, hash this
      is_active: agentData.is_active ?? true,
      status: agentData.status || 'pending',
      approved: agentData.approved ?? false,
      verification_status: agentData.verification_status || 'pending',
      address: agentData.address || {},
      vehicle: agentData.vehicle || {},
      documents: agentData.documents || {},
      onboarding: {
        completed: agentData.onboarding?.completed ?? false,
        approvedAt: agentData.onboarding?.approvedAt ? new Date(agentData.onboarding.approvedAt) : undefined,
        approvedBy: agentData.onboarding?.approvedBy,
        notes: agentData.onboarding?.notes || ''
      },
      performance: {
        orders_assigned: 0,
        deliveries_completed: 0,
        average_rating: 0,
        total_earnings: 0,
        completionRate: 0,
        averageDeliveryTime: 0,
        ...agentData.performance
      },
      location: {
        latitude: null,
        longitude: null,
        last_updated: null,
        address: '',
        ...agentData.location
      },
      availability: {
        isOnline: false,
        workingHours: {
          start: '09:00',
          end: '18:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        },
        ...agentData.availability
      },
      bankDetails: agentData.bankDetails || {},
      emergencyContact: agentData.emergencyContact || {},
      city: agentData.city || agentData.address?.city || '',
      state: agentData.state || agentData.address?.state || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const docRef = await db.collection('agents').add(newAgent);
    
    // Create user profile for the agent
    const userProfile = {
      uid: docRef.id,
      email: agentData.email || '',
      firstName: agentData.first_name,
      lastName: agentData.last_name,
      displayName: `${agentData.first_name} ${agentData.last_name}`,
      phoneNumber: agentData.phone_number,
      address: agentData.address || {},
      role: 'agent',
      isActive: agentData.is_active ?? true,
      agentId: agentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save user profile
    await db.collection('users').doc(docRef.id).set(userProfile);

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...newAgent,
        userProfile
      }
    });

  } catch (error: any) {
    console.error('Error creating agent:', error);
    
    // Enhanced error handling for agent creation
    if (error.message && error.message.includes('Firebase Admin SDK not initialized')) {
      return NextResponse.json(
        { 
          error: 'Server Configuration Error',
          details: 'Firebase Admin SDK not configured. Please contact administrator.',
          code: 'ADMIN_SDK_NOT_CONFIGURED'
        },
        { status: 503 } // Service Unavailable
      );
    }
    
    if (error.message && (error.message.includes('permission-denied') || error.message.includes('PERMISSION_DENIED'))) {
      return NextResponse.json(
        { 
          error: 'Permission Denied',
          details: 'Insufficient permissions to create agent. Please check Firebase configuration.',
          code: 'PERMISSION_DENIED'
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create agent account',
        details: error.message,
        code: 'CREATION_FAILED'
      },
      { status: 500 }
    );
  }
}