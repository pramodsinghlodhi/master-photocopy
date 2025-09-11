// src/app/admin/tracking/page.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Truck, Search } from 'lucide-react';

const mockShipments = [
  { id: 'ORD789', trackingId: 'SR-123456789', provider: 'Shiprocket', status: 'Delivered', customer: 'John Doe' },
  { id: 'ORD788', trackingId: 'SR-123456788', provider: 'Shiprocket', status: 'In Transit', customer: 'Alice' },
  { id: 'ORD787', trackingId: 'SR-123456787', provider: 'Shiprocket', status: 'Out for Delivery', customer: 'Bob' },
  { id: 'ORD784', trackingId: 'SR-123456786', provider: 'Shiprocket', status: 'Shipped', customer: 'Eve' },
];

const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Delivered': return 'default';
      case 'In Transit': case 'Shipped': case 'Out for Delivery': return 'secondary';
      default: return 'outline';
    }
};

export default function TrackingPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Shipment Tracking</h1>
      </div>
      
       <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Search by Order ID or Tracking ID..." 
                className="pl-10"
            />
        </div>

      <Card>
        <CardHeader>
          <CardTitle>All Shipments</CardTitle>
          <CardDescription>Track and manage all ongoing and completed shipments.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Tracking ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockShipments.map(shipment => (
                <TableRow key={shipment.id}>
                  <TableCell className="font-medium">{shipment.id}</TableCell>
                  <TableCell>{shipment.trackingId}</TableCell>
                  <TableCell>{shipment.customer}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(shipment.status) as any}>{shipment.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                        <Truck className="mr-2 h-4 w-4" />
                        Track
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
