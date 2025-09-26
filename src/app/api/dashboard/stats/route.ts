import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDB } from '@/lib/firebase-admin';

export interface DashboardStats {
  orders: {
    total: number;
    pending: number;
    processing: number;
    delivered: number;
    cancelled: number;
    todayCount: number;
    weekCount: number;
    monthCount: number;
  };
  agents: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
    onlineToday: number;
  };
  customers: {
    total: number;
    newToday: number;
    newWeek: number;
    newMonth: number;
    activeUsers: number;
  };
  revenue: {
    today: number;
    week: number;
    month: number;
    totalRevenue: number;
    pendingPayments: number;
  };
  ads: {
    total: number;
    active: number;
    inactive: number;
    totalClicks: number;
    totalImpressions: number;
  };
  feedback: {
    unread: number;
    total: number;
    averageRating: number;
  };
  support: {
    openTickets: number;
    pendingTickets: number;
    resolvedToday: number;
  };
}

// GET /api/dashboard/stats - Get comprehensive dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const db = getFirebaseAdminDB();
    
    // Get current date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel queries for better performance
    const [
      ordersSnapshot,
      agentsSnapshot,
      customersSnapshot,
      adsSnapshot,
      feedbackSnapshot,
      supportSnapshot
    ] = await Promise.all([
      // Orders queries
      db.collection('orders').get(),
      
      // Agents queries  
      db.collection('agents').get(),
      
      // Customers queries (from both users and order customers)
      db.collection('users').where('role', '==', 'customer').get(),
      
      // Ads queries
      db.collection('ads').get(),
      
      // Feedback queries (assuming we have a feedback collection)
      db.collection('feedback').get().catch(() => ({ empty: true, docs: [] })),
      
      // Support tickets queries (assuming we have a support collection)
      db.collection('support').get().catch(() => ({ empty: true, docs: [] }))
    ]);

    // Process Orders Statistics
    const orders = ordersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || (data.date ? new Date(data.date) : new Date()),
        total: data.total || data.totals?.total || 0,
        status: data.status || 'pending',
        customer: data.customer,
        payment: data.payment,
        paymentMethod: data.paymentMethod
      };
    });

    const orderStats = {
      total: orders.length,
      pending: orders.filter(order => ['pending', 'Pending'].includes(order.status)).length,
      processing: orders.filter(order => ['processing', 'Processing'].includes(order.status)).length,
      delivered: orders.filter(order => ['delivered', 'Delivered'].includes(order.status)).length,
      cancelled: orders.filter(order => ['cancelled', 'Cancelled'].includes(order.status)).length,
      todayCount: orders.filter(order => order.createdAt >= todayStart).length,
      weekCount: orders.filter(order => order.createdAt >= weekStart).length,
      monthCount: orders.filter(order => order.createdAt >= monthStart).length
    };

    // Process Agents Statistics
    const agents = agentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      status: doc.data().status || 'pending',
      lastActive: doc.data().lastActive?.toDate() || null
    }));

    const agentStats = {
      total: agents.length,
      active: agents.filter(agent => agent.status === 'active').length,
      pending: agents.filter(agent => agent.status === 'pending').length,
      suspended: agents.filter(agent => agent.status === 'suspended').length,
      onlineToday: agents.filter(agent => 
        agent.lastActive && agent.lastActive >= todayStart
      ).length
    };

    // Process Customers Statistics
    const customers = customersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      lastActive: doc.data().lastActive?.toDate() || null
    }));

    // Also get unique customers from orders
    const uniqueOrderCustomers = new Set();
    orders.forEach(order => {
      if (order.customer?.phone || order.customer?.phone_number) {
        uniqueOrderCustomers.add(order.customer.phone || order.customer.phone_number);
      }
    });

    const customerStats = {
      total: Math.max(customers.length, uniqueOrderCustomers.size),
      newToday: customers.filter(customer => customer.createdAt >= todayStart).length,
      newWeek: customers.filter(customer => customer.createdAt >= weekStart).length,
      newMonth: customers.filter(customer => customer.createdAt >= monthStart).length,
      activeUsers: customers.filter(customer => 
        customer.lastActive && customer.lastActive >= weekStart
      ).length
    };

    // Process Revenue Statistics
    const revenueStats = {
      today: orders
        .filter(order => order.createdAt >= todayStart)
        .reduce((sum, order) => sum + (order.total || 0), 0),
      week: orders
        .filter(order => order.createdAt >= weekStart)
        .reduce((sum, order) => sum + (order.total || 0), 0),
      month: orders
        .filter(order => order.createdAt >= monthStart)
        .reduce((sum, order) => sum + (order.total || 0), 0),
      totalRevenue: orders.reduce((sum, order) => sum + (order.total || 0), 0),
      pendingPayments: orders
        .filter(order => order.payment?.status === 'Pending' || order.paymentMethod === 'cod')
        .reduce((sum, order) => sum + (order.total || 0), 0)
    };

    // Process Ads Statistics
    const ads = adsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        isActive: data.isActive,
        clickCount: data.clickCount || 0,
        impressionCount: data.impressionCount || 0
      };
    });

    const adStats = {
      total: ads.length,
      active: ads.filter(ad => ad.isActive === true).length,
      inactive: ads.filter(ad => ad.isActive === false).length,
      totalClicks: ads.reduce((sum, ad) => sum + (ad.clickCount || 0), 0),
      totalImpressions: ads.reduce((sum, ad) => sum + (ad.impressionCount || 0), 0)
    };

    // Process Feedback Statistics
    const feedback = feedbackSnapshot.docs?.map(doc => ({
      id: doc.id,
      ...doc.data(),
      isRead: doc.data().isRead || false,
      rating: doc.data().rating || 0
    })) || [];

    const feedbackStats = {
      unread: feedback.filter(item => !item.isRead).length,
      total: feedback.length,
      averageRating: feedback.length > 0 
        ? feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length 
        : 0
    };

    // Process Support Statistics
    const support = supportSnapshot.docs?.map(doc => ({
      id: doc.id,
      ...doc.data(),
      status: doc.data().status || 'open',
      resolvedAt: doc.data().resolvedAt?.toDate() || null
    })) || [];

    const supportStats = {
      openTickets: support.filter(ticket => ticket.status === 'open').length,
      pendingTickets: support.filter(ticket => ticket.status === 'pending').length,
      resolvedToday: support.filter(ticket => 
        ticket.resolvedAt && ticket.resolvedAt >= todayStart
      ).length
    };

    const dashboardStats: DashboardStats = {
      orders: orderStats,
      agents: agentStats,
      customers: customerStats,
      revenue: revenueStats,
      ads: adStats,
      feedback: feedbackStats,
      support: supportStats
    };

    return NextResponse.json({
      success: true,
      data: dashboardStats,
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    
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
        error: 'Failed to fetch dashboard statistics',
        details: error.message,
        code: 'STATS_FETCH_FAILED'
      },
      { status: 500 }
    );
  }
}