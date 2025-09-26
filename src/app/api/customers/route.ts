import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all'; // all, active, inactive

    // Get current date and calculate 30 days ago
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Fetch all orders to build customer list
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
      status: 'Active' | 'Inactive';
      lastSeen: string;
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
          
          // Update status based on most recent order
          existing.status = isActive ? 'Active' : 'Inactive';
          
          // Calculate "last seen" from most recent order
          const diffTime = now.getTime() - orderDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
          
          if (diffHours < 24) {
            existing.lastSeen = diffHours === 0 ? 'Just now' : `${diffHours} hours ago`;
          } else if (diffDays === 1) {
            existing.lastSeen = '1 day ago';
          } else if (diffDays < 7) {
            existing.lastSeen = `${diffDays} days ago`;
          } else {
            const diffWeeks = Math.floor(diffDays / 7);
            existing.lastSeen = diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
          }
        }
      } else {
        // Generate a customer ID based on the customer key
        const customerId = `CUST${customerKey.slice(-3).toUpperCase()}`;
        
        // Calculate "last seen" for new customer
        const diffTime = now.getTime() - orderDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        
        let lastSeen: string;
        if (diffHours < 24) {
          lastSeen = diffHours === 0 ? 'Just now' : `${diffHours} hours ago`;
        } else if (diffDays === 1) {
          lastSeen = '1 day ago';
        } else if (diffDays < 7) {
          lastSeen = `${diffDays} days ago`;
        } else {
          const diffWeeks = Math.floor(diffDays / 7);
          lastSeen = diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
        }
        
        customerData.set(customerKey, {
          id: customerId,
          name: customerName,
          email: order.customer?.email || '',
          phone: order.customer?.phone_number || order.customer?.phone || '',
          totalOrders: 1,
          totalSpent: total,
          lastOrderDate: orderDate,
          status: isActive ? 'Active' : 'Inactive',
          lastSeen
        });
      }
    });

    // Convert to array
    let customers = Array.from(customerData.values());

    // Apply status filter
    if (status !== 'all') {
      const targetStatus = status === 'active' ? 'Active' : 'Inactive';
      customers = customers.filter(c => c.status === targetStatus);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      customers = customers.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.phone.toLowerCase().includes(searchLower)
      );
    }

    // Sort by most recent activity (last order date)
    customers.sort((a, b) => b.lastOrderDate.getTime() - a.lastOrderDate.getTime());

    // Remove lastOrderDate from response (was used for sorting)
    const customersResponse = customers.map(({ lastOrderDate, ...customer }) => customer);

    return NextResponse.json({
      success: true,
      data: customersResponse,
      total: customersResponse.length
    });

  } catch (error: any) {
    console.error('Customers list error:', error);
    
    return NextResponse.json(
      { 
        error: 'Firebase Admin SDK required for server-side access. Please configure service account credentials.',
        details: 'API routes need Firebase Admin SDK to access Firestore from the server.'
      },
      { status: 403 }
    );
  }
}