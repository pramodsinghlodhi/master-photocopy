import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';
import { Agent } from '../route';

// GET /api/agents/[id] - Fetch single agent
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getFirebaseAdminDB();
    const { id } = params;

    const agentDoc = await db.collection('agents').doc(id).get();

    if (!agentDoc.exists) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    const data = agentDoc.data();
    const agent: Agent = {
      id: agentDoc.id,
      ...data,
      created_at: data?.created_at?.toDate?.()?.toISOString() || data?.created_at,
      updated_at: data?.updated_at?.toDate?.()?.toISOString() || data?.updated_at,
    } as Agent;

    return NextResponse.json({
      success: true,
      data: agent
    });

  } catch (error: any) {
    console.error('Error fetching agent:', error);
    return NextResponse.json(
      { 
        error: 'Firebase Admin SDK required for server-side access. Please configure service account credentials.',
        details: error.message 
      },
      { status: 403 }
    );
  }
}

// PUT /api/agents/[id] - Update agent
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getFirebaseAdminDB();
    const { id } = params;
    const updateData = await request.json();

    // Check if agent exists first
    const agentDoc = await db.collection('agents').doc(id).get();
    if (!agentDoc.exists) {
      return NextResponse.json(
        { error: `Agent with ID '${id}' not found` },
        { status: 404 }
      );
    }

    // Add timestamp to update
    const finalUpdateData = {
      ...updateData,
      updated_at: new Date()
    };

    await db.collection('agents').doc(id).update(finalUpdateData);

    // Fetch updated agent
    const updatedDoc = await db.collection('agents').doc(id).get();
    const data = updatedDoc.data();
    const agent: Agent = {
      id: updatedDoc.id,
      ...data,
      created_at: data?.created_at?.toDate?.()?.toISOString() || data?.created_at,
      updated_at: data?.updated_at?.toDate?.()?.toISOString() || data?.updated_at,
    } as Agent;

    return NextResponse.json({
      success: true,
      data: agent
    });

  } catch (error: any) {
    console.error('Error updating agent:', error);
    
    // Handle specific case where document doesn't exist
    if (error.message?.includes('No document to update')) {
      return NextResponse.json(
        { 
          error: `Agent with ID '${params.id}' does not exist and cannot be updated`,
          details: 'Please verify the agent ID is correct or create the agent first'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Firebase Admin SDK required for server-side access. Please configure service account credentials.',
        details: error.message 
      },
      { status: 403 }
    );
  }
}

// DELETE /api/agents/[id] - Delete agent
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getFirebaseAdminDB();
    const { id } = params;

    // Check if agent exists
    const agentDoc = await db.collection('agents').doc(id).get();
    if (!agentDoc.exists) {
      return NextResponse.json(
        { error: `Agent with ID '${id}' not found` },
        { status: 404 }
      );
    }

    await db.collection('agents').doc(id).delete();

    return NextResponse.json({
      success: true,
      message: 'Agent deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { 
        error: 'Firebase Admin SDK required for server-side access. Please configure service account credentials.',
        details: error.message 
      },
      { status: 403 }
    );
  }
}