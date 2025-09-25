'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import Link from 'next/link';
import Invoice from '@/components/shared/invoice';
import { Order } from '@/lib/types';

export default function InvoicePage({ params }: { params: { orderId: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const response = await fetch(`/api/orders/${params.orderId}/invoice`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch order data');
        }

        const result = await response.json();
        
        if (result.success) {
          setOrder(result.data);
        } else {
          throw new Error(result.error || 'Failed to load order');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err instanceof Error ? err.message : 'Failed to load invoice');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderData();
  }, [params.orderId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm text-muted-foreground">Loading invoice...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              {error || 'Order not found'}
            </p>
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Hidden when printing */}
      <div className="no-print bg-white border-b p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/orders">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Orders
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Invoice - {order.orderId}</h1>
          </div>
          <Button 
            onClick={() => window.print()} 
            className="flex items-center space-x-2"
          >
            <Printer className="h-4 w-4" />
            <span>Print Invoice</span>
          </Button>
        </div>
      </div>

      {/* Invoice Component */}
      <div className="py-8">
        <Invoice order={order} showPrintButton={false} />
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .page-break {
            page-break-before: always;
          }

          /* Ensure invoice fits on page */
          html, body {
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}