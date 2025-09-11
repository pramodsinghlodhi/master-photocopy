// src/app/admin/customers/page.tsx
'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowRight, Users, UserCheck, Search, Award, Repeat, MoreHorizontal, Trash2, UserX } from "lucide-react";
import Link from "next/link";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';


type CustomerStatus = 'Active' | 'Inactive';
type Customer = {
    id: string;
    name: string;
    email: string;
    totalOrders: number;
    status: CustomerStatus;
    lastSeen: string;
};

const initialCustomers: Customer[] = [
    { id: 'CUST001', name: 'John Doe', email: 'john.doe@example.com', totalOrders: 5, status: 'Active', lastSeen: '2 hours ago' },
    { id: 'CUST002', name: 'Alice', email: 'alice@example.com', totalOrders: 2, status: 'Active', lastSeen: '1 day ago' },
    { id: 'CUST003', name: 'Bob', email: 'bob@example.com', totalOrders: 8, status: 'Inactive', lastSeen: '3 days ago' },
    { id: 'CUST004', name: 'Charlie', email: 'charlie@example.com', totalOrders: 1, status: 'Active', lastSeen: '5 hours ago' },
    { id: 'CUST005', name: 'Diana', email: 'diana@example.com', totalOrders: 0, status: 'Inactive', lastSeen: '1 week ago' },
];

export default function CustomersPage() {
  const [customers, setCustomers] = React.useState<Customer[]>(initialCustomers);
  const [activeTab, setActiveTab] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [customerToDelete, setCustomerToDelete] = React.useState<string | null>(null);
  const { toast } = useToast();

  const filteredCustomers = React.useMemo(() => {
    let filtered = customers;
    
    if (activeTab !== 'all') {
        filtered = filtered.filter(customer => customer.status.toLowerCase() === activeTab);
    }

    if(searchQuery){
        filtered = filtered.filter(customer => 
            customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    return filtered;
  }, [activeTab, searchQuery, customers]);
  
  const topCustomer = React.useMemo(() => {
      if (customers.length === 0) return null;
      return customers.reduce((prev, current) => (prev.totalOrders > current.totalOrders) ? prev : current)
  }, [customers]);

  const repeatCustomers = React.useMemo(() => {
      return customers.filter(c => c.totalOrders > 1).length;
  }, [customers]);

  const getStatusVariant = (status: CustomerStatus) => {
    return status === 'Active' ? 'secondary' : 'outline';
  }

  const handleToggleBlockUser = (customerId: string) => {
      setCustomers(prev => prev.map(c => {
          if (c.id === customerId) {
              const newStatus = c.status === 'Active' ? 'Inactive' : 'Active';
              toast({ 
                  title: `User ${newStatus === 'Active' ? 'Unblocked' : 'Blocked'}`, 
                  description: `The customer's status has been set to ${newStatus}.` 
              });
              return {...c, status: newStatus};
          }
          return c;
      }));
  }

  const handleDeleteUser = (customerId: string) => {
      setCustomerToDelete(customerId);
      setIsAlertOpen(true);
  }

  const confirmDelete = () => {
    if (customerToDelete) {
        setCustomers(prev => prev.filter(c => c.id !== customerToDelete));
        toast({ title: "User Deleted", description: "The customer has been removed.", variant: "destructive" });
    }
    setIsAlertOpen(false);
    setCustomerToDelete(null);
  }

  return (
    <div className="flex flex-col gap-8">
        <h1 className="text-3xl font-bold">Customers</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{customers.length}</div>
                    <p className="text-xs text-muted-foreground">All registered users</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{customers.filter(c => c.status === 'Active').length}</div>
                    <p className="text-xs text-muted-foreground">Users active in the last 30 days</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Top Customer</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{topCustomer?.name || 'N/A'}</div>
                    <p className="text-xs text-muted-foreground">{topCustomer ? `${topCustomer.totalOrders} total orders` : ''}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Repeat Customers</CardTitle>
                    <Repeat className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{repeatCustomers}</div>
                    <p className="text-xs text-muted-foreground">Customers with more than one order</p>
                </CardContent>
            </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name or email..." 
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="inactive">Inactive</TabsTrigger>
                </TabsList>
            </div>
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Customer List</CardTitle>
                    <CardDescription>View and manage your customers.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TabsContent value="all">
                        <CustomerTable customers={filteredCustomers} getStatusVariant={getStatusVariant} onToggleBlock={handleToggleBlockUser} onDelete={handleDeleteUser}/>
                    </TabsContent>
                    <TabsContent value="active">
                         <CustomerTable customers={filteredCustomers} getStatusVariant={getStatusVariant} onToggleBlock={handleToggleBlockUser} onDelete={handleDeleteUser}/>
                    </TabsContent>
                    <TabsContent value="inactive">
                         <CustomerTable customers={filteredCustomers} getStatusVariant={getStatusVariant} onToggleBlock={handleToggleBlockUser} onDelete={handleDeleteUser}/>
                    </TabsContent>
                </CardContent>
            </Card>
        </Tabs>
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    customer&apos;s account and remove their data from our servers.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  )
}

interface CustomerTableProps {
    customers: Customer[], 
    getStatusVariant: (status: CustomerStatus) => "secondary" | "outline",
    onToggleBlock: (id: string) => void,
    onDelete: (id: string) => void
}

function CustomerTable({ customers, getStatusVariant, onToggleBlock, onDelete }: CustomerTableProps) {
    return (
         <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Orders</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {customers.map(customer => (
                     <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.id}</TableCell>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell><Badge variant={getStatusVariant(customer.status)}>{customer.status}</Badge></TableCell>
                        <TableCell>{customer.totalOrders}</TableCell>
                        <TableCell>{customer.lastSeen}</TableCell>
                        <TableCell className="text-right">
                           <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4"/>
                                        <span className="sr-only">Actions</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href={`/admin/customers/${customer.id}`}>
                                            <ArrowRight className="mr-2 h-4 w-4"/>
                                            View Details
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onToggleBlock(customer.id)}>
                                        {customer.status === 'Active' ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                                        {customer.status === 'Active' ? 'Block User' : 'Unblock User'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDelete(customer.id)} className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4"/>
                                        Delete User
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                           </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
