'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import LoginHistory from '@/components/shared/login-history';

export default function CustomerLoginHistoryPage() {
  const router = useRouter();
  const [customerData, setCustomerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get customer data from session storage or Firebase auth
    // This would depend on how customer authentication is implemented
    const storedCustomerData = sessionStorage.getItem('customerData');
    if (storedCustomerData) {
      const data = JSON.parse(storedCustomerData);
      setCustomerData(data);
    } else {
      // For now, redirect to main page - in a real app, this would be customer login
      router.push('/');
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!customerData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-gray-600 mb-4">Please log in to view your login history.</p>
              <Button onClick={() => router.push('/')}>
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Login History</h1>
            <p className="text-muted-foreground">
              Customer: {customerData.name} ({customerData.email})
            </p>
          </div>
        </div>
      </div>

      {/* Customer Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Account Information</span>
          </CardTitle>
          <CardDescription>Current customer account details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Customer ID</p>
              <p className="text-lg font-semibold">{customerData.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-lg font-semibold">{customerData.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-lg font-semibold">{customerData.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <p className="text-lg font-semibold">{customerData.phone || 'Not provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Login History Component */}
      <LoginHistory userId={customerData.id} userType="customer" />
    </div>
  );
}