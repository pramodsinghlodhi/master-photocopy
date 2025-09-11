// src/app/admin/invoicing/page.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, FileText, CheckCircle2, Clock, XCircle, ArrowRight, Download } from 'lucide-react';

const mockInvoices = [
  { id: 'INV-00123', customer: 'John Doe', date: '2023-11-23', status: 'Paid', total: 450.00 },
  { id: 'INV-00122', customer: 'Alice', date: '2023-11-20', status: 'Pending', total: 250.50 },
  { id: 'INV-00121', customer: 'Bob', date: '2023-11-15', status: 'Overdue', total: 1200.00 },
  { id: 'INV-00120', customer: 'Charlie', date: '2023-11-10', status: 'Paid', total: 75.00 },
];

const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Paid': return 'default';
      case 'Pending': return 'secondary';
      case 'Overdue': return 'destructive';
      default: return 'outline';
    }
};

const getStatusIcon = (status: string) => {
    switch(status) {
        case 'Paid': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
        case 'Pending': return <Clock className="h-4 w-4 text-yellow-500" />;
        case 'Overdue': return <XCircle className="h-4 w-4 text-red-500" />;
    }
}

export default function InvoicingPage() {
    const totalRevenue = mockInvoices.filter(i => i.status === 'Paid').reduce((acc, i) => acc + i.total, 0);
    const pendingAmount = mockInvoices.filter(i => i.status === 'Pending' || i.status === 'Overdue').reduce((acc, i) => acc + i.total, 0);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">Invoicing</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total amount from paid invoices.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{pendingAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From pending and overdue invoices.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockInvoices.length}</div>
            <p className="text-xs text-muted-foreground">Generated for all orders.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>Manage and track all customer invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInvoices.map(invoice => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.customer}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(invoice.status) as any} className="flex items-center gap-1.5 w-fit">
                        {getStatusIcon(invoice.status)}
                        {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    {invoice.total.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
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
    </div>
  );
}
