import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';

export interface AgentEarnings {
  agentId: string;
  agentName: string;
  totalDeliveries: number;
  totalEarnings: number;
  averageEarningsPerDelivery: number;
  period: string;
  deliveries: {
    orderId: string;
    distance: number;
    deliveryFee: number;
    agentCommission: number;
    completedAt: string;
  }[];
}

// GET /api/agents/earnings - Calculate agent earnings from delivery pricing
export async function GET(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const period = searchParams.get('period') || 'monthly'; // daily, weekly, monthly, yearly
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    // Get agent details
    const agentDoc = await db.collection('agents').doc(agentId).get();
    if (!agentDoc.exists) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    const agentData = agentDoc.data();
    const agentName = `${agentData?.first_name || ''} ${agentData?.last_name || ''}`.trim();

    // Calculate date range
    let queryStartDate: Date;
    let queryEndDate = new Date();

    if (startDate && endDate) {
      queryStartDate = new Date(startDate);
      queryEndDate = new Date(endDate);
    } else {
      // Calculate based on period
      const now = new Date();
      switch (period) {
        case 'daily':
          queryStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          queryStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          queryStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'yearly':
          queryStartDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          queryStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
    }

    // Get completed deliveries for the agent in the specified period
    const ordersSnapshot = await db.collection('orders')
      .where('assignedAgentId', '==', agentId)
      .where('status', '==', 'Delivered')
      .where('delivery.completedAt', '>=', queryStartDate)
      .where('delivery.completedAt', '<=', queryEndDate)
      .get();

    const deliveries: {
      orderId: string;
      distance: number;
      deliveryFee: number;
      agentCommission: number;
      completedAt: string;
    }[] = [];

    let totalEarnings = 0;
    let totalDeliveries = 0;

    for (const orderDoc of ordersSnapshot.docs) {
      const orderData = orderDoc.data();
      const deliveryData = orderData.delivery || {};
      
      if (deliveryData.fee && deliveryData.agentCommission) {
        const delivery = {
          orderId: orderDoc.id,
          distance: deliveryData.distance || 0,
          deliveryFee: deliveryData.fee,
          agentCommission: deliveryData.agentCommission,
          completedAt: deliveryData.completedAt?.toDate?.()?.toISOString() || deliveryData.completedAt
        };

        deliveries.push(delivery);
        totalEarnings += delivery.agentCommission;
        totalDeliveries += 1;
      }
    }

    const averageEarningsPerDelivery = totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0;

    const earnings: AgentEarnings = {
      agentId,
      agentName,
      totalDeliveries,
      totalEarnings,
      averageEarningsPerDelivery: Math.round(averageEarningsPerDelivery * 100) / 100,
      period: `${queryStartDate.toISOString().split('T')[0]} to ${queryEndDate.toISOString().split('T')[0]}`,
      deliveries: deliveries.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    };

    return NextResponse.json({
      success: true,
      data: earnings
    });

  } catch (error: any) {
    console.error('Error calculating agent earnings:', error);
    
    if (error.message && error.message.includes('Firebase Admin SDK not initialized')) {
      return NextResponse.json(
        { 
          error: 'Server Configuration Error',
          details: 'Firebase Admin SDK not configured. Please contact administrator.',
          code: 'ADMIN_SDK_NOT_CONFIGURED'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to calculate agent earnings',
        details: error.message,
        code: 'EARNINGS_CALCULATION_FAILED'
      },
      { status: 500 }
    );
  }
}

// POST /api/agents/earnings - Record delivery completion and calculate earnings
export async function POST(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();
    const { orderId, agentId, distance, deliveryFee, agentCommissionPercentage = 70 } = await request.json();

    if (!orderId || !agentId) {
      return NextResponse.json(
        { error: 'Order ID and Agent ID are required' },
        { status: 400 }
      );
    }

    // Get the order
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = orderDoc.data();

    // Verify agent is assigned to this order
    if (orderData?.assignedAgentId !== agentId) {
      return NextResponse.json(
        { error: 'Agent is not assigned to this order' },
        { status: 403 }
      );
    }

    // Calculate agent commission
    const fee = deliveryFee || 0;
    const commission = Math.round((fee * agentCommissionPercentage) / 100);
    const companyRevenue = fee - commission;

    // Update order with delivery details
    const deliveryUpdate = {
      'delivery.completedAt': new Date(),
      'delivery.distance': distance || 0,
      'delivery.fee': fee,
      'delivery.agentCommission': commission,
      'delivery.companyRevenue': companyRevenue,
      'delivery.agentCommissionPercentage': agentCommissionPercentage,
      'status': 'Delivered',
      'updatedAt': new Date()
    };

    await orderRef.update(deliveryUpdate);

    // Update agent performance
    const agentRef = db.collection('agents').doc(agentId);
    const agentDoc = await agentRef.get();

    if (agentDoc.exists) {
      const agentData = agentDoc.data();
      const currentPerformance = agentData?.performance || {};
      
      const updatedPerformance = {
        ...currentPerformance,
        deliveries_completed: (currentPerformance.deliveries_completed || 0) + 1,
        total_earnings: (currentPerformance.total_earnings || 0) + commission
      };

      await agentRef.update({
        performance: updatedPerformance,
        updatedAt: new Date()
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        agentId,
        deliveryFee: fee,
        agentCommission: commission,
        companyRevenue,
        distance: distance || 0
      }
    });

  } catch (error: any) {
    console.error('Error recording delivery earnings:', error);
    
    if (error.message && error.message.includes('Firebase Admin SDK not initialized')) {
      return NextResponse.json(
        { 
          error: 'Server Configuration Error',
          details: 'Firebase Admin SDK not configured. Please contact administrator.',
          code: 'ADMIN_SDK_NOT_CONFIGURED'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to record delivery earnings',
        details: error.message,
        code: 'EARNINGS_RECORDING_FAILED'
      },
      { status: 500 }
    );
  }
}