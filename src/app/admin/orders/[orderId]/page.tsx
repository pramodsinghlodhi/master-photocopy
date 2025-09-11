

'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IndianRupee, ArrowLeft, Download, Eye, Truck, Loader } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useToast } from '@/hooks/use-toast';
import { createShipment } from '@/ai/flows/shipment-creation';

const getStatusVariant = (status: string) => {
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

type TrackingInfo = {
    provider: string;
    id: string;
    status: string;
}

const mockOrderDetails = {
    id: 'ORD789',
    date: '2023-11-23',
    status: 'Processing',
    paymentMethod: 'Prepaid',
    total: 450.00,
    customer: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        address: '123 Printwell Lane, Copytown, 400001',
        phone: '9876543210'
    },
    items: [
        { name: 'Resume_Final.pdf', settings: 'B&W, Single-Sided', pages: 5, price: 10.00 },
        { name: 'Thesis_Chapter1.pdf', settings: 'Color, Double-Sided, Spiral Bind', pages: 50, price: 440.00 },
    ]
}


export default function OrderDetailsPage({ params }: { params: { orderId: string } }) {
    const [order, setOrder] = useState(mockOrderDetails);
    const [tracking, setTracking] = useState<TrackingInfo | null>(null);
    const [isLoadingTracking, setIsLoadingTracking] = useState(false);
    const { toast } = useToast();

    const handleGenerateTracking = async () => {
        setIsLoadingTracking(true);
        try {
            const trackingInfo = await createShipment({
                orderId: order.id,
                customerName: order.customer.name,
                customerAddress: order.customer.address,
                customerPhone: order.customer.phone,
                orderTotal: order.total,
                paymentMethod: order.paymentMethod,
            });
            setTracking({
                provider: trackingInfo.provider,
                id: trackingInfo.trackingId,
                status: trackingInfo.status
            });
            setOrder(prev => ({ ...prev, status: 'Shipped' }));
            toast({
                title: "Shipment Created!",
                description: `Tracking ID ${trackingInfo.trackingId} has been generated.`,
            });
        } catch (error) {
            console.error("Failed to generate tracking ID:", error);
            toast({
                title: "Error",
                description: "Could not generate a tracking ID. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoadingTracking(false);
        }
    };


  return (
    <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
             <Button variant="outline" size="icon" asChild>
                <Link href="/admin/orders">
                    <ArrowLeft className="h-4 w-4"/>
                    <span className="sr-only">Back to Orders</span>
                </Link>
            </Button>
            <h1 className="text-3xl font-bold">Order Details</h1>
             <Badge variant={getStatusVariant(order.status) as any} className="ml-auto text-base">{order.status}</Badge>
        </div>
       
        <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Order Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>File Name</TableHead>
                                    <TableHead>Settings</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {order.items.map(item => (
                                    <TableRow key={item.name}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>{item.settings}</TableCell>
                                        <TableCell className="text-right flex items-center justify-end">
                                            <IndianRupee className="h-4 w-4 text-muted-foreground"/>{item.price.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon">
                                                <Eye className="h-4 w-4" />
                                                <span className="sr-only">View File</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                     <CardFooter className="flex justify-end gap-2 p-6 bg-secondary">
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4"/>
                            Download All Files
                        </Button>
                    </CardFooter>
                </Card>
            </div>
            <div className="md:col-span-1 space-y-8">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5"/>Shipment Tracking</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {tracking ? (
                            <div>
                                <p className="font-semibold">{tracking.provider} ID: <span className="font-normal text-primary underline">{tracking.id}</span></p>
                                <p className="text-sm text-muted-foreground">Status: <Badge variant="secondary">{tracking.status}</Badge></p>
                            </div>
                        ) : (
                           <Button className="w-full" onClick={handleGenerateTracking} disabled={isLoadingTracking}>
                               {isLoadingTracking ? <Loader className="mr-2 h-4 w-4 animate-spin"/> : null}
                               Generate Tracking ID
                           </Button>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Customer Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="font-semibold">{order.customer.name}</p>
                            <p className="text-sm text-muted-foreground">{order.customer.email}</p>
                            <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
                        </div>
                         <Separator />
                        <div>
                            <p className="font-semibold">Shipping Address</p>
                            <p className="text-sm text-muted-foreground">{order.customer.address}</p>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Payment Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="flex items-center"><IndianRupee className="h-4 w-4 text-muted-foreground"/>{order.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Shipping</span>
                            <span>Free</span>
                        </div>
                        <Separator/>
                         <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span className="flex items-center"><IndianRupee className="h-5 w-5"/>{order.total.toFixed(2)}</span>
                        </div>
                    </CardContent>
                     <CardFooter className="p-4">
                        <Badge variant={order.paymentMethod === 'Prepaid' ? 'secondary' : 'outline'} className="w-full justify-center py-2">
                           {order.paymentMethod}
                        </Badge>
                     </CardFooter>
                </Card>
            </div>
        </div>
    </div>
  )
}
