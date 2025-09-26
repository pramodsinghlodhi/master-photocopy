import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();

    // Get current date and calculate 30 days ago
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Fetch all orders to analyze customer data
    const ordersSnapshot = await db.collection('orders').get();
    
    // Aggregate customer data
    const customerData = new Map<string, {
      id: string;
      name: string;
      email: string;
      phone: string;
      totalOrders: number;
      totalSpent: number;
      lastOrderDate: Date;
      isActive: boolean;
    }>();

    ordersSnapshot.docs.forEach((doc) => {
      const order = doc.data();
      const orderDate = order.createdAt?.toDate() || new Date(order.date);
      
      // Create customer key (email or phone)
      const customerKey = order.customer?.email || order.customer?.phone_number || order.customer?.phone;
      
      if (!customerKey) return; // Skip orders without customer info
      
      const customerName = `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim() || 
                          order.customer?.email || 
                          order.customer?.phone_number || 
                          'Unknown Customer';
      
      const total = order.totals?.total || 0;
      const isActive = orderDate >= thirtyDaysAgo;
      
      if (customerData.has(customerKey)) {
        const existing = customerData.get(customerKey)!;
        existing.totalOrders += 1;
        existing.totalSpent += total;
        
        // Update last order date if this order is newer
        if (orderDate > existing.lastOrderDate) {
          existing.lastOrderDate = orderDate;
        }
        
        // Update active status - customer is active if they have any order in last 30 days
        if (isActive) {
          existing.isActive = true;
        }
      } else {
        // Generate a unique customer ID based on the customer key with hash to avoid duplicates
        const hash = customerKey.split('').reduce((a: number, b: string) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        const uniqueId = Math.abs(hash).toString().padStart(6, '0').slice(-6);
        const customerId = `CUST${uniqueId}`;
        
        customerData.set(customerKey, {
          id: customerId,
          name: customerName,
          email: order.customer?.email || '',
          phone: order.customer?.phone_number || order.customer?.phone || '',
          totalOrders: 1,
          totalSpent: total,
          lastOrderDate: orderDate,
          isActive
        });
      }
    });

    // Convert to array for analysis
    const customers = Array.from(customerData.values());
    
    // Calculate metrics
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.isActive).length;
    const repeatCustomers = customers.filter(c => c.totalOrders > 1).length;
    
    // Find top customer by total orders (then by total spent as tiebreaker)
    const topCustomer = customers.length > 0 
      ? customers.reduce((prev, current) => {
          if (current.totalOrders > prev.totalOrders) return current;
          if (current.totalOrders === prev.totalOrders && current.totalSpent > prev.totalSpent) return current;
          return prev;
        })
      : null;

    // Calculate trends (this would need historical data for accurate trends)
    // For now, we'll provide basic metrics without percentage changes
    const analytics = {
      totalCustomers: {
        count: totalCustomers,
        description: 'All registered users'
      },
      activeCustomers: {
        count: activeCustomers,
        description: 'Users active in the last 30 days'
      },
      topCustomer: topCustomer ? {
        name: topCustomer.name,
        totalOrders: topCustomer.totalOrders,
        description: `${topCustomer.totalOrders} total orders`
      } : null,
      repeatCustomers: {
        count: repeatCustomers,
        description: 'Customers with more than one order'
      }
    };

    return NextResponse.json({
      success: true,
      data: analytics
    });

  } catch (error: any) {
    console.error('Customer analytics error:', error);
    
    return NextResponse.json(
      { 
        error: 'Firebase Admin SDK required for server-side access. Please configure service account credentials.',
        details: 'API routes need Firebase Admin SDK to access Firestore from the server.'
      },
      { status: 403 }
    );
  }
}