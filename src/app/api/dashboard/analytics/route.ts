import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();

    // Get date range for calculations (current month and previous month)
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Calculate total revenue
    const allOrdersSnapshot = await db.collection('orders')
      .where('status', '!=', 'Cancelled')
      .get();
    
    let totalRevenue = 0;
    let currentMonthRevenue = 0;
    let previousMonthRevenue = 0;
    let totalOrders = 0;
    let currentMonthOrders = 0;
    let previousMonthOrders = 0;

    // Status distribution
    const statusCounts: Record<string, number> = {
      'Delivered': 0,
      'Processing': 0,
      'Shipped': 0,
      'Out for Delivery': 0,
      'Pending': 0,
      'Cancelled': 0,
      'Returned': 0,
      'Not Delivered': 0
    };

    // Sales data for last 6 months
    const salesData: { name: string; sales: number }[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize sales data for last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      salesData.push({
        name: monthNames[monthDate.getMonth()],
        sales: 0
      });
    }

    allOrdersSnapshot.forEach((doc) => {
      const order = doc.data();
      const orderDate = order.createdAt?.toDate() || new Date(order.date);
      const total = order.totals?.total || 0;

      // Total revenue and orders
      totalRevenue += total;
      totalOrders++;

      // Current month calculations
      if (orderDate >= currentMonthStart) {
        currentMonthRevenue += total;
        currentMonthOrders++;
      }

      // Previous month calculations  
      if (orderDate >= previousMonthStart && orderDate <= previousMonthEnd) {
        previousMonthRevenue += total;
        previousMonthOrders++;
      }

      // Status distribution
      if (statusCounts.hasOwnProperty(order.status)) {
        statusCounts[order.status]++;
      }

      // Sales data for charts (last 6 months)
      for (let i = 0; i < 6; i++) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 0, 23, 59, 59, 999);
        
        if (orderDate >= monthStart && orderDate <= monthEnd) {
          salesData[i].sales += total;
          break;
        }
      }
    });

    // Calculate percentage changes
    const revenueChange = previousMonthRevenue > 0 
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue * 100).toFixed(1)
      : '0';
    
    const ordersChange = previousMonthOrders > 0
      ? ((currentMonthOrders - previousMonthOrders) / previousMonthOrders * 100).toFixed(1)
      : '0';

    // Get customer count (unique customers this month vs last month)
    const currentMonthOrdersSnapshot = await db.collection('orders')
      .where('createdAt', '>=', currentMonthStart)
      .get();
    
    const previousMonthOrdersSnapshot = await db.collection('orders')
      .where('createdAt', '>=', previousMonthStart)
      .where('createdAt', '<=', previousMonthEnd)
      .get();

    // Count unique customers
    const currentMonthCustomers = new Set();
    const previousMonthCustomers = new Set();

    currentMonthOrdersSnapshot.forEach((doc) => {
      const order = doc.data();
      currentMonthCustomers.add(order.customer?.email || order.customer?.phone_number);
    });

    previousMonthOrdersSnapshot.forEach((doc) => {
      const order = doc.data();
      previousMonthCustomers.add(order.customer?.email || order.customer?.phone_number);
    });

    const newCustomersCount = currentMonthCustomers.size;
    const previousCustomersCount = previousMonthCustomers.size;
    const customersChange = previousCustomersCount > 0
      ? ((newCustomersCount - previousCustomersCount) / previousCustomersCount * 100).toFixed(1)
      : '0';

    // Format order status data for pie chart
    const orderStatusData = Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: status,
        value: count
      }));

    const analytics = {
      revenue: {
        total: totalRevenue,
        change: revenueChange,
        trend: parseFloat(revenueChange) >= 0 ? 'up' : 'down'
      },
      orders: {
        total: totalOrders,
        change: ordersChange,
        trend: parseFloat(ordersChange) >= 0 ? 'up' : 'down'
      },
      customers: {
        total: newCustomersCount,
        change: customersChange,
        trend: parseFloat(customersChange) >= 0 ? 'up' : 'down'
      },
      activeAds: {
        total: 3, // This would come from your ads/campaigns collection
        description: 'Currently running campaigns'
      },
      salesData,
      orderStatusData
    };

    return NextResponse.json({
      success: true,
      data: analytics
    });

  } catch (error: any) {
    console.error('Dashboard analytics error:', error);
    
    return NextResponse.json(
      { 
        error: 'Firebase Admin SDK required for server-side access. Please configure service account credentials.',
        details: 'API routes need Firebase Admin SDK to access Firestore from the server.'
      },
      { status: 403 }
    );
  }
}