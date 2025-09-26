import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();

    const { searchParams } = new URL(request.url);
    const limitCount = parseInt(searchParams.get('limit') || '5');

    // Fetch all completed orders to calculate customer totals
    const ordersSnapshot = await db.collection('orders')
      .where('status', 'in', ['Delivered', 'Processing', 'Shipped', 'Out for Delivery'])
      .get();
    
    // Aggregate customer data
    const customerTotals = new Map<string, {
      id: string;
      name: string;
      email: string;
      phone: string;
      totalSpent: number;
      totalOrders: number;
    }>();

    ordersSnapshot.docs.forEach((doc) => {
      const order = doc.data();
      const customerKey = order.customer?.email || order.customer?.phone_number || order.customer?.phone;
      
      if (!customerKey) return; // Skip orders without customer info
      
      const customerName = `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() || 
                          order.customer?.email || 
                          order.customer?.phone_number || 
                          'Unknown Customer';
      
      const total = order.totals?.total || 0;
      
      if (customerTotals.has(customerKey)) {
        const existing = customerTotals.get(customerKey)!;
        existing.totalSpent += total;
        existing.totalOrders += 1;
      } else {
        // Generate a unique customer ID based on the customer key with hash to avoid duplicates
        const hash = customerKey.split('').reduce((a: number, b: string) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        const uniqueId = Math.abs(hash).toString().padStart(6, '0').slice(-6);
        const customerId = `CUST${uniqueId}`;
        
        customerTotals.set(customerKey, {
          id: customerId,
          name: customerName,
          email: order.customer?.email || '',
          phone: order.customer?.phone_number || order.customer?.phone || '',
          totalSpent: total,
          totalOrders: 1
        });
      }
    });

    // Convert to array and sort by total spent
    const topCustomers = Array.from(customerTotals.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limitCount);

    return NextResponse.json({
      success: true,
      data: topCustomers
    });

  } catch (error) {
    console.error('Top customers error:', error);
    
    return NextResponse.json(
      { 
        error: 'Firebase Admin SDK required for server-side access. Please configure service account credentials.',
        details: 'API routes need Firebase Admin SDK to access Firestore from the server.'
      },
      { status: 403 }
    );
  }
}