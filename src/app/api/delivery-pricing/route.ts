import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';

export interface DeliveryPricingRule {
  id?: string;
  maxDistanceKm: number;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  description?: string;
  agentCommissionPercentage?: number; // Percentage of delivery fee that agent gets
}

export interface DeliveryPricingCalculation {
  distance: number;
  basePrice: number;
  agentCommission: number;
  companyRevenue: number;
  applicableRule: DeliveryPricingRule;
}

// GET /api/delivery-pricing - Get all pricing rules or calculate price for distance
export async function GET(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();
    const { searchParams } = new URL(request.url);
    const distance = searchParams.get('distance');
    const calculate = searchParams.get('calculate') === 'true';

    // If distance is provided and calculate is true, return price calculation
    if (distance && calculate) {
      const distanceNum = parseFloat(distance);
      if (isNaN(distanceNum) || distanceNum < 0) {
        return NextResponse.json(
          { error: 'Invalid distance provided' },
          { status: 400 }
        );
      }

      // Get active pricing rules
      const rulesSnapshot = await db.collection('delivery_pricing')
        .where('isActive', '==', true)
        .orderBy('maxDistanceKm', 'asc')
        .get();

      let applicableRule: DeliveryPricingRule | null = null;

      // Find the applicable rule
      for (const doc of rulesSnapshot.docs) {
        const rule = { id: doc.id, ...doc.data() } as DeliveryPricingRule;
        if (distanceNum <= rule.maxDistanceKm) {
          applicableRule = rule;
          break;
        }
      }

      if (!applicableRule) {
        return NextResponse.json(
          { error: 'No pricing rule found for this distance' },
          { status: 404 }
        );
      }

      const basePrice = applicableRule.price;
      const agentCommissionPercentage = applicableRule.agentCommissionPercentage || 70; // Default 70% to agent
      const agentCommission = Math.round((basePrice * agentCommissionPercentage) / 100);
      const companyRevenue = basePrice - agentCommission;

      const calculation: DeliveryPricingCalculation = {
        distance: distanceNum,
        basePrice,
        agentCommission,
        companyRevenue,
        applicableRule
      };

      return NextResponse.json({
        success: true,
        data: calculation
      });
    }

    // Otherwise, return all pricing rules
    const rulesSnapshot = await db.collection('delivery_pricing')
      .orderBy('maxDistanceKm', 'asc')
      .get();

    const rules: DeliveryPricingRule[] = [];
    rulesSnapshot.forEach((doc) => {
      const data = doc.data();
      rules.push({
        id: doc.id,
        maxDistanceKm: data.maxDistanceKm,
        price: data.price,
        isActive: data.isActive ?? true,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        description: data.description || `Up to ${data.maxDistanceKm} km`,
        agentCommissionPercentage: data.agentCommissionPercentage || 70
      });
    });

    return NextResponse.json({
      success: true,
      data: rules
    });

  } catch (error: any) {
    console.error('Error fetching delivery pricing:', error);
    
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
        error: 'Failed to fetch delivery pricing',
        details: error.message,
        code: 'PRICING_FETCH_FAILED'
      },
      { status: 500 }
    );
  }
}

// POST /api/delivery-pricing - Create new pricing rule
export async function POST(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();
    const pricingData = await request.json();

    // Validate required fields
    if (!pricingData.maxDistanceKm || !pricingData.price) {
      return NextResponse.json(
        { error: 'Missing required fields: maxDistanceKm, price' },
        { status: 400 }
      );
    }

    if (pricingData.maxDistanceKm <= 0 || pricingData.price <= 0) {
      return NextResponse.json(
        { error: 'Distance and price must be greater than 0' },
        { status: 400 }
      );
    }

    // Check if a rule with the same distance already exists
    const existingRuleSnapshot = await db.collection('delivery_pricing')
      .where('maxDistanceKm', '==', pricingData.maxDistanceKm)
      .get();

    if (!existingRuleSnapshot.empty) {
      return NextResponse.json(
        { error: 'A pricing rule for this distance already exists' },
        { status: 400 }
      );
    }

    const newRule: Omit<DeliveryPricingRule, 'id'> = {
      maxDistanceKm: pricingData.maxDistanceKm,
      price: pricingData.price,
      isActive: pricingData.isActive ?? true,
      description: pricingData.description || `Up to ${pricingData.maxDistanceKm} km`,
      agentCommissionPercentage: pricingData.agentCommissionPercentage || 70,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await db.collection('delivery_pricing').add(newRule);

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...newRule
      }
    });

  } catch (error: any) {
    console.error('Error creating delivery pricing rule:', error);
    
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
        error: 'Failed to create pricing rule',
        details: error.message,
        code: 'PRICING_CREATION_FAILED'
      },
      { status: 500 }
    );
  }
}

// PUT /api/delivery-pricing - Update pricing rule
export async function PUT(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();
    const updateData = await request.json();

    if (!updateData.id) {
      return NextResponse.json(
        { error: 'Pricing rule ID is required' },
        { status: 400 }
      );
    }

    const ruleRef = db.collection('delivery_pricing').doc(updateData.id);
    const ruleDoc = await ruleRef.get();

    if (!ruleDoc.exists) {
      return NextResponse.json(
        { error: 'Pricing rule not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const { id, ...updates } = updateData;
    updates.updatedAt = new Date().toISOString();

    await ruleRef.update(updates);

    // Fetch updated rule
    const updatedDoc = await ruleRef.get();
    const updatedData = updatedDoc.data();

    return NextResponse.json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...updatedData
      }
    });

  } catch (error: any) {
    console.error('Error updating delivery pricing rule:', error);
    
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
        error: 'Failed to update pricing rule',
        details: error.message,
        code: 'PRICING_UPDATE_FAILED'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/delivery-pricing - Delete pricing rule
export async function DELETE(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('id');

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Pricing rule ID is required' },
        { status: 400 }
      );
    }

    const ruleRef = db.collection('delivery_pricing').doc(ruleId);
    const ruleDoc = await ruleRef.get();

    if (!ruleDoc.exists) {
      return NextResponse.json(
        { error: 'Pricing rule not found' },
        { status: 404 }
      );
    }

    await ruleRef.delete();

    return NextResponse.json({
      success: true,
      message: 'Pricing rule deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting delivery pricing rule:', error);
    
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
        error: 'Failed to delete pricing rule',
        details: error.message,
        code: 'PRICING_DELETE_FAILED'
      },
      { status: 500 }
    );
  }
}