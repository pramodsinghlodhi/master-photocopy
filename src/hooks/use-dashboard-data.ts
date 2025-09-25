import { useState, useEffect } from 'react';

export type DashboardAnalytics = {
  revenue: {
    total: number;
    change: string;
    trend: 'up' | 'down';
  };
  orders: {
    total: number;
    change: string;
    trend: 'up' | 'down';
  };
  customers: {
    total: number;
    change: string;
    trend: 'up' | 'down';
  };
  activeAds: {
    total: number;
    description: string;
  };
  salesData: { name: string; sales: number }[];
  orderStatusData: { name: string; value: number }[];
};

export type RecentOrder = {
  id: string;
  user: string;
  status: string;
  total: number;
  date: Date;
  customer: {
    email?: string;
    phone?: string;
    address?: string;
  };
};

export type TopCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  totalOrders: number;
};

export function useDashboardData() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);

  // Fallback data when Firebase permissions are not configured
  const fallbackAnalytics: DashboardAnalytics = {
    revenue: { total: 0, change: '0', trend: 'up' },
    orders: { total: 0, change: '0', trend: 'up' },
    customers: { total: 0, change: '0', trend: 'up' },
    activeAds: { total: 0, description: 'No campaigns configured' },
    salesData: [
      { name: 'Jan', sales: 0 },
      { name: 'Feb', sales: 0 },
      { name: 'Mar', sales: 0 },
      { name: 'Apr', sales: 0 },
      { name: 'May', sales: 0 },
      { name: 'Jun', sales: 0 },
    ],
    orderStatusData: []
  };

  const fallbackRecentOrders: RecentOrder[] = [];
  const fallbackTopCustomers: TopCustomer[] = [];

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all dashboard data in parallel
      const [analyticsRes, recentOrdersRes, topCustomersRes] = await Promise.all([
        fetch('/api/dashboard/analytics'),
        fetch('/api/dashboard/recent-orders?limit=5'),
        fetch('/api/dashboard/top-customers?limit=5')
      ]);

      // Check if all requests were successful and handle Firebase permission errors
      const checkFirebaseError = async (response: Response) => {
        if (!response.ok) {
          let errorData: any = {};
          
          try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              errorData = await response.json();
            } else {
              errorData = { 
                error: `HTTP ${response.status} - ${response.statusText}`,
                details: 'Server returned non-JSON response'
              };
            }
          } catch (parseError) {
            console.warn('Failed to parse error response:', parseError);
            errorData = { 
              error: `HTTP ${response.status} - ${response.statusText}`,
              details: 'Could not parse error response'
            };
          }
          
          if (errorData.error && (
            errorData.error.includes('Firebase authentication required') ||
            errorData.error.includes('permission') ||
            response.status === 403
          )) {
            return { isFirebaseError: true, error: errorData.error };
          }
          return { isFirebaseError: false, error: errorData.error || 'API request failed' };
        }
        return { isFirebaseError: false, error: null };
      };

      const [analyticsError, recentOrdersError, topCustomersError] = await Promise.all([
        checkFirebaseError(analyticsRes),
        checkFirebaseError(recentOrdersRes),
        checkFirebaseError(topCustomersRes)
      ]);

      // If any request has Firebase permission errors, enable fallback mode
      if (analyticsError.isFirebaseError || recentOrdersError.isFirebaseError || topCustomersError.isFirebaseError) {
        setError('Firebase permissions not configured. Please check Firestore security rules and authentication.');
        setShowFallback(true);
        setAnalytics(fallbackAnalytics);
        setRecentOrders(fallbackRecentOrders);
        setTopCustomers(fallbackTopCustomers);
        return;
      }

      // If there are other non-Firebase errors, throw them
      if (analyticsError.error) throw new Error(analyticsError.error);
      if (recentOrdersError.error) throw new Error(recentOrdersError.error);
      if (topCustomersError.error) throw new Error(topCustomersError.error);

      const [analyticsData, recentOrdersData, topCustomersData] = await Promise.all([
        analyticsRes.json(),
        recentOrdersRes.json(),
        topCustomersRes.json()
      ]);

      if (analyticsData.success) {
        setAnalytics(analyticsData.data);
      }

      if (recentOrdersData.success) {
        // Convert date strings back to Date objects
        const ordersWithDates = recentOrdersData.data.map((order: any) => ({
          ...order,
          date: new Date(order.date)
        }));
        setRecentOrders(ordersWithDates);
      }

      if (topCustomersData.success) {
        setTopCustomers(topCustomersData.data);
      }

    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      
      // Handle specific Firebase permission errors
      if (err instanceof Error && err.message.includes('permission')) {
        setError('Firebase permissions not configured. Please check Firestore security rules and authentication.');
        setShowFallback(true);
        setAnalytics(fallbackAnalytics);
        setRecentOrders(fallbackRecentOrders);
        setTopCustomers(fallbackTopCustomers);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const refetch = () => {
    fetchDashboardData();
  };

  return {
    analytics,
    recentOrders,
    topCustomers,
    loading,
    error,
    showFallback,
    refetch
  };
}