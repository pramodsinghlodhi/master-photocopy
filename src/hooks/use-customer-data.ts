import { useState, useEffect } from 'react';

export type CustomerAnalytics = {
  totalCustomers: {
    count: number;
    description: string;
  };
  activeCustomers: {
    count: number;
    description: string;
  };
  topCustomer: {
    name: string;
    totalOrders: number;
    description: string;
  } | null;
  repeatCustomers: {
    count: number;
    description: string;
  };
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  status: 'Active' | 'Inactive';
  lastSeen: string;
};

export function useCustomerData() {
  const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);

  // Fallback data when Firebase permissions are not configured
  const fallbackAnalytics: CustomerAnalytics = {
    totalCustomers: { count: 0, description: 'All registered users' },
    activeCustomers: { count: 0, description: 'Users active in the last 30 days' },
    topCustomer: null,
    repeatCustomers: { count: 0, description: 'Customers with more than one order' }
  };

  const fallbackCustomers: Customer[] = [];

  const fetchCustomerData = async (searchQuery = '', statusFilter = 'all') => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);

      // Fetch analytics and customers list in parallel
      const [analyticsRes, customersRes] = await Promise.all([
        fetch('/api/customers/analytics'),
        fetch(`/api/customers?${params.toString()}`)
      ]);

      // Check if all requests were successful and handle Firebase permission errors
      const checkFirebaseError = async (response: Response) => {
        if (!response.ok) {
          let errorData: any = {};
          
          try {
            // Check if response content-type is JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              errorData = await response.json();
            } else {
              // If not JSON, get text content for debugging
              const textContent = await response.text();
              console.warn('Non-JSON error response:', textContent.substring(0, 200));
              errorData = { 
                error: `HTTP ${response.status} - ${response.statusText}`,
                details: 'Server returned HTML instead of JSON'
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
            errorData.error.includes('Firebase Admin SDK required') ||
            errorData.error.includes('service account credentials') ||
            errorData.details?.includes('Firebase Admin SDK')
          )) {
            return { isFirebaseError: true, error: errorData };
          }
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        return { isFirebaseError: false };
      };

      const analyticsError = await checkFirebaseError(analyticsRes);
      const customersError = await checkFirebaseError(customersRes);

      // If both have Firebase permission errors, show fallback
      if (analyticsError.isFirebaseError && customersError.isFirebaseError) {
        console.warn('Firebase not configured, using fallback data');
        setShowFallback(true);
        setAnalytics(fallbackAnalytics);
        setCustomers(fallbackCustomers);
        setLoading(false);
        return;
      }

      // If there are other non-Firebase errors, throw them
      if (analyticsError.error) throw new Error(analyticsError.error);
      if (customersError.error) throw new Error(customersError.error);

      const [analyticsData, customersData] = await Promise.all([
        analyticsRes.json(),
        customersRes.json()
      ]);

      if (analyticsData.success) {
        setAnalytics(analyticsData.data);
      }

      if (customersData.success) {
        setCustomers(customersData.data);
      }

      setShowFallback(false);

    } catch (err) {
      console.error('Customer data fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch customer data');
      
      // Show fallback data on error
      setShowFallback(true);
      setAnalytics(fallbackAnalytics);
      setCustomers(fallbackCustomers);
    } finally {
      setLoading(false);
    }
  };

  // Remove automatic initial fetch - let the component control it
  // This allows for better control of when fresh data should be loaded
  
  const refetch = async (searchQuery = '', statusFilter = 'all') => {
    await fetchCustomerData(searchQuery, statusFilter);
  };

  return {
    analytics,
    customers,
    loading,
    error,
    showFallback,
    refetch
  };
}