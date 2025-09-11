// src/components/dashboard/order-history.tsx
'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button';
import type { Order } from "@/lib/types"
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { Skeleton } from '../ui/skeleton';
import { generateInvoicePdf } from '@/lib/pdf';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function getStatusVariant(status: Order['status']) {
    switch (status) {
      case 'Delivered':
        return 'default';
      case 'Processing':
      case 'Shipped':
      case 'Booked':
        return 'secondary';
      case 'Cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
};

function AuthOrderHistory() {
  const [user, authLoading] = useAuthState(auth!);
  const { toast } = useToast();

  const ordersRef = user ? query(collection(db!, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')) : null;
  const [value, loading, error] = useCollection(ordersRef);

  const orders: Order[] = value ? value.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)) : [];

  const handleDownloadInvoice = async (order: Order) => {
    try {
        const pdfBytes = await generateInvoicePdf(order);
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Invoice-${order.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch(err) {
        console.error("Failed to generate invoice", err);
        toast({ title: 'Error generating invoice', description: 'Could not generate the PDF invoice. Please try again.', variant: 'destructive' });
    }
  }

  const isLoading = authLoading || loading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order History</CardTitle>
        <CardDescription>A list of your recent print orders.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {isLoading && (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                  <TableCell><Skeleton className="h-5 w-28"/></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full"/></TableCell>
                  <TableCell><Skeleton className="h-5 w-12"/></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto"/></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-full"/></TableCell>
                </TableRow>
              ))
            )}
            {!isLoading && error && (
                 <TableRow>
                    <TableCell colSpan={6} className="text-center text-destructive py-8">
                        Error loading orders: {error.message}
                    </TableCell>
                </TableRow>
            )}
            {!isLoading && !error && !user && !authLoading && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Please log in to see your order history.
                    </TableCell>
                </TableRow>
            )}
            {!isLoading && !error && user && orders.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        You haven't placed any orders yet.
                    </TableCell>
                </TableRow>
            )}
            {!isLoading && !error && orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                </TableCell>
                <TableCell>{order.itemCount}</TableCell>
                <TableCell className="text-right">₹{order.total.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDownloadInvoice(order)}>
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Download Invoice</span>
                    </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}


export function OrderHistory() {
  if (!isFirebaseConfigured || !db) {
      return (
        <Card>
            <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>A list of your recent print orders.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-center text-muted-foreground py-8">Firebase not configured. Cannot load orders.</p>
            </CardContent>
        </Card>
      )
  }

  return <AuthOrderHistory/>;
}
