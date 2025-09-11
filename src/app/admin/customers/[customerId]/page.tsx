// src/app/admin/customers/[customerId]/page.tsx
'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, IndianRupee, Laptop, Monitor, Smartphone, Folder } from 'lucide-react';
import Link from 'next/link';

const mockCustomer = {
    id: 'CUST001',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '9876543210',
    address: '123 Printwell Lane, Copytown, 400001',
    joinedDate: '2023-10-01',
    avatarUrl: 'https://placehold.co/112x112.png',
};

const mockOrderHistory = [
  { id: 'ORD789', date: '2023-11-23', status: 'Delivered', total: 450.00 },
  { id: 'ORD780', date: '2023-11-15', status: 'Delivered', total: 150.00 },
  { id: 'ORD775', date: '2023-11-02', status: 'Cancelled', total: 300.00 },
];

const loginHistory = [
    { device: 'iPhone 14 Pro', type: 'mobile', location: 'Mumbai, IN', time: '2 hours ago' },
    { device: 'Windows 11 PC', type: 'desktop', location: 'Mumbai, IN', time: '1 day ago' },
    { device: 'MacBook Pro', type: 'laptop', location: 'Pune, IN', time: '3 days ago' },
];

const getDeviceIcon = (type: 'mobile' | 'desktop' | 'laptop') => {
    switch(type) {
        case 'mobile': return <Smartphone className="h-5 w-5 text-muted-foreground" />;
        case 'desktop': return <Monitor className="h-5 w-5 text-muted-foreground" />;
        case 'laptop': return <Laptop className="h-5 w-5 text-muted-foreground" />;
    }
};

const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Delivered': return 'default';
      case 'Processing': return 'secondary';
      case 'Cancelled': return 'destructive';
      default: return 'outline';
    }
};

export default function CustomerDetailsPage({ params }: { params: { customerId: string } }) {
  // In a real app, fetch customer data using params.customerId
  const customer = mockCustomer;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/customers">
            <ArrowLeft className="h-4 w-4"/>
            <span className="sr-only">Back to Customers</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Customer Details</h1>
      </div>
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-8">
            <Card>
                <CardContent className="p-6 text-center">
                    <Avatar className="h-28 w-28 mx-auto mb-4">
                        <AvatarImage src={customer.avatarUrl} alt={customer.name} />
                        <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-semibold">{customer.name}</h3>
                    <p className="text-muted-foreground">{customer.email}</p>
                    <p className="text-sm text-muted-foreground mt-2">Joined on {customer.joinedDate}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                     <div>
                        <p className="font-semibold">Phone</p>
                        <p className="text-muted-foreground">{customer.phone}</p>
                    </div>
                     <Separator />
                    <div>
                        <p className="font-semibold">Shipping Address</p>
                        <p className="text-muted-foreground">{customer.address}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Order History</CardTitle>
                    <CardDescription>A list of all orders placed by this customer.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockOrderHistory.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/admin/orders/${order.id}`} className="underline hover:text-primary">
                                            {order.id}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{order.date}</TableCell>
                                    <TableCell><Badge variant={getStatusVariant(order.status) as any}>{order.status}</Badge></TableCell>
                                    <TableCell className="text-right flex items-center justify-end">
                                        <IndianRupee className="h-4 w-4 text-muted-foreground"/>{order.total.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Login History</CardTitle>
                    <CardDescription>A record of devices that have signed into this account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Device</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead className="text-right">Time</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {loginHistory.map((session, index) => (
                            <TableRow key={index}>
                            <TableCell className="font-medium flex items-center gap-3">
                                {getDeviceIcon(session.type as any)}
                                {session.device}
                            </TableCell>
                            <TableCell>{session.location}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{session.time}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
