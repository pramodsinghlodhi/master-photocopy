// src/app/admin/customers/page.tsx
'use client';

import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowRight, Users, UserCheck, Search, Award, Repeat, MoreHorizontal, Trash2, UserX, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCustomerData, type Customer } from '@/hooks/use-customer-data';


export default function CustomersPage() {
  const [activeTab, setActiveTab] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [customerToDelete, setCustomerToDelete] = React.useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [isFreshLoad, setIsFreshLoad] = React.useState(true);
  const { toast } = useToast();
  
  // Use the dynamic customer data hook
  const { 
    analytics, 
    customers, 
    loading, 
    error, 
    showFallback, 
    refetch 
  } = useCustomerData();

  // Load data on component mount and manual refresh only
  React.useEffect(() => {
    let isMounted = true;
    
    // Initial load when component mounts (e.g., opening new tab or page refresh)
    const initialLoad = async () => {
      if (isMounted) {
        setIsFreshLoad(true);
        await refetch(searchQuery, activeTab);
        if (isMounted) {
          setLastUpdated(new Date());
          setIsFreshLoad(false);
        }
      }
    };
    
    // Start with immediate load only
    initialLoad();
    
    return () => {
      isMounted = false;
    };
  }, []); // Only run once on mount

  // Manual refresh function
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch(searchQuery, activeTab);
      setLastUpdated(new Date());
      toast({
        title: "Data refreshed",
        description: "Customer data has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh customer data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Remove all automatic data fetching - no search/tab change updates

  const getStatusVariant = (status: Customer['status']) => {
    return status === 'Active' ? 'secondary' : 'outline';
  }

  const handleToggleBlockUser = (customerId: string) => {
      // Note: This would need a server endpoint to actually update customer status
      toast({ 
          title: "Feature Not Implemented", 
          description: "Customer blocking functionality needs to be implemented on the server.",
          variant: "destructive"
      });
  }

  const handleDeleteUser = (customerId: string) => {
      setCustomerToDelete(customerId);
      setIsAlertOpen(true);
  }

  const confirmDelete = () => {
    // Note: This would need a server endpoint to actually delete customers
    toast({ 
      title: "Feature Not Implemented", 
      description: "Customer deletion functionality needs to be implemented on the server.",
      variant: "destructive"
    });
    setIsAlertOpen(false);
    setCustomerToDelete(null);
  }

  if (error && !showFallback) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold">Customers</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Error loading data - please try refreshing
            </p>
          </div>
          <Button 
            onClick={handleManualRefresh} 
            variant="outline"
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Retrying...' : 'Retry'}
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p>Error loading customer data: {error}</p>
              <Button onClick={handleManualRefresh} disabled={isRefreshing} className="mt-4">
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Retrying...' : 'Try Again'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold">Customers</h1>
            {lastUpdated && (
              <p className="text-sm text-muted-foreground mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
                {isFreshLoad && (
                  <span className="ml-2 inline-flex items-center gap-1 text-blue-600">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Loading fresh data...
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showFallback && (
              <div className="text-sm text-muted-foreground bg-yellow-50 px-3 py-1 rounded-md">
                Using demo data - Firebase not configured
              </div>
            )}
            <Button 
              onClick={handleManualRefresh} 
              variant="outline"
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                      {loading ? (
                        <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                      ) : (
                        analytics?.totalCustomers.count || 0
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {analytics?.totalCustomers.description || 'All registered users'}
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                      {loading ? (
                        <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                      ) : (
                        analytics?.activeCustomers.count || 0
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {analytics?.activeCustomers.description || 'Users active in the last 30 days'}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Top Customer</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                      {loading ? (
                        <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
                      ) : (
                        analytics?.topCustomer?.name || 'N/A'
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {analytics?.topCustomer?.description || '0 total orders'}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Repeat Customers</CardTitle>
                    <Repeat className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                      {loading ? (
                        <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                      ) : (
                        analytics?.repeatCustomers.count || 0
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {analytics?.repeatCustomers.description || 'Customers with more than one order'}
                    </p>
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
                        <CustomerTable 
                          customers={customers} 
                          loading={loading}
                          getStatusVariant={getStatusVariant} 
                          onToggleBlock={handleToggleBlockUser} 
                          onDelete={handleDeleteUser}
                        />
                    </TabsContent>
                    <TabsContent value="active">
                         <CustomerTable 
                           customers={customers} 
                           loading={loading}
                           getStatusVariant={getStatusVariant} 
                           onToggleBlock={handleToggleBlockUser} 
                           onDelete={handleDeleteUser}
                         />
                    </TabsContent>
                    <TabsContent value="inactive">
                         <CustomerTable 
                           customers={customers} 
                           loading={loading}
                           getStatusVariant={getStatusVariant} 
                           onToggleBlock={handleToggleBlockUser} 
                           onDelete={handleDeleteUser}
                         />
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
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

interface CustomerTableProps {
    customers: Customer[];
    loading: boolean;
    getStatusVariant: (status: Customer['status']) => "outline" | "secondary";
    onToggleBlock: (customerId: string) => void;
    onDelete: (customerId: string) => void;
}

function CustomerTable({ customers, loading, getStatusVariant, onToggleBlock, onDelete }: CustomerTableProps) {
    if (loading) {
      return (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      );
    }

    if (customers.length === 0) {
      return (
        <div className="text-center py-8">
          <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No customers found</p>
        </div>
      );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {customers.map((customer) => (
                    <TableRow key={customer.id}>
                        <TableCell className="font-medium">
                            <Link href={`/admin/customers/${customer.id}`} className="hover:underline">
                                {customer.id}
                            </Link>
                        </TableCell>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>{customer.phone}</TableCell>
                        <TableCell>{customer.totalOrders}</TableCell>
                        <TableCell>
                            <Badge variant={getStatusVariant(customer.status)}>
                                {customer.status}
                            </Badge>
                        </TableCell>
                        <TableCell>{customer.lastSeen}</TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/admin/customers/${customer.id}`}>
                                            View Details
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => onToggleBlock(customer.id)}>
                                        <UserX className="h-4 w-4 mr-2" />
                                        {customer.status === 'Active' ? 'Block User' : 'Unblock User'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                        onClick={() => onDelete(customer.id)}
                                        className="text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
