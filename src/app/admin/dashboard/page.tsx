

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogoutButton } from '@/components/auth/logout-button';
import { UserInfo } from '@/components/auth/user-info';
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
import { Button } from "@/components/ui/button";
import { IndianRupee, Users, ShoppingCart, Megaphone, ArrowUp, ArrowDown, BarChart as BarChartIcon, Settings, Shield, RefreshCw } from "lucide-react"
import Link from "next/link";
import { Bar, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, PieChart } from 'recharts';
import { SafeHydrate } from "@/components/shared/safe-hydrate";
import { useDashboardData } from '@/hooks/use-dashboard-data';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

function AdminDashboardContent() {
    const { user, loading: authLoading } = useAuth();
    const { analytics, recentOrders, topCustomers, loading: dataLoading, error, showFallback, refetch } = useDashboardData();

    const getStatusVariant = (status: string) => {
        switch (status) {
        case 'Delivered':
            return 'default';
        case 'Processing':
        case 'Shipped':
            return 'secondary';
        case 'Cancelled':
            return 'destructive';
        default:
            return 'outline';
        }
    };

    if (authLoading || dataLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
                    <p>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error && !showFallback) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="text-red-600 mb-4">
                        <p className="text-lg font-semibold">Error loading dashboard</p>
                        <p className="text-sm">{error}</p>
                    </div>
                    <Button onClick={refetch} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            {/* Header with admin info */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back, {user?.name || user?.email}</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button onClick={refetch} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <UserInfo compact={true} />
                    <LogoutButton variant="outline" />
                </div>
            </div>

            {/* Firebase Permission Warning */}
            {showFallback && (
                <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <Shield className="h-5 w-5 text-yellow-600" />
                    <div className="flex-1">
                        <span className="font-medium text-yellow-800 dark:text-yellow-200">
                            Firebase Setup Required
                        </span>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                            Dashboard APIs require Firebase Admin SDK for server-side access. Currently showing empty data.
                            <br />
                            <strong>Quick Fix:</strong> Update Firestore rules to allow unauthenticated read access (development only)
                            or configure Firebase Admin SDK for production.
                        </p>
                    </div>
                    <Button onClick={refetch} variant="outline" size="sm" className="border-yellow-300">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </div>
            )}

            {/* Admin status badge */}
            <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">
                    Administrator Access Verified
                </span>
                <Badge variant="secondary" className="ml-auto">
                    Admin Panel
                </Badge>
            </div>
       
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{analytics?.revenue.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</div>
                        <p className="text-xs text-muted-foreground flex items-center">
                            {analytics?.revenue.trend === 'up' ? (
                                <ArrowUp className="h-4 w-4 text-green-500 mr-1"/>
                            ) : (
                                <ArrowDown className="h-4 w-4 text-red-500 mr-1"/>
                            )}
                            {analytics?.revenue.trend === 'up' ? '+' : ''}{analytics?.revenue.change || '0'}% this month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.orders.total.toLocaleString() || '0'}</div>
                        <p className="text-xs text-muted-foreground flex items-center">
                            {analytics?.orders.trend === 'up' ? (
                                <ArrowUp className="h-4 w-4 text-green-500 mr-1"/>
                            ) : (
                                <ArrowDown className="h-4 w-4 text-red-500 mr-1"/>
                            )}
                            {analytics?.orders.trend === 'up' ? '+' : ''}{analytics?.orders.change || '0'}% this month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.customers.total || '0'}</div>
                        <p className="text-xs text-muted-foreground flex items-center">
                            {analytics?.customers.trend === 'up' ? (
                                <ArrowUp className="h-4 w-4 text-green-500 mr-1"/>
                            ) : (
                                <ArrowDown className="h-4 w-4 text-red-500 mr-1"/>
                            )}
                            {analytics?.customers.trend === 'up' ? '+' : ''}{analytics?.customers.change || '0'}% this month
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Ads</CardTitle>
                        <Megaphone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.activeAds.total || '0'}</div>
                        <p className="text-xs text-muted-foreground">{analytics?.activeAds.description || 'Currently running campaigns'}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-3">
                <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/admin/orders" className="flex flex-col items-center gap-2">
                        <ShoppingCart className="h-6 w-6" />
                        <span>Manage Orders</span>
                    </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/admin/customers" className="flex flex-col items-center gap-2">
                        <Users className="h-6 w-6" />
                        <span>View Customers</span>
                    </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto p-4">
                    <Link href="/admin/settings" className="flex flex-col items-center gap-2">
                        <Settings className="h-6 w-6" />
                        <span>Settings</span>
                    </Link>
                </Button>
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Sales Overview</CardTitle>
                        <CardDescription>Last 6 months of sales data.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SafeHydrate>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={analytics?.salesData || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="sales" fill="hsl(var(--primary))" />
                                </BarChart>
                            </ResponsiveContainer>
                        </SafeHydrate>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                   <CardHeader>
                        <CardTitle>Order Status Distribution</CardTitle>
                        <CardDescription>Breakdown of all orders by status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SafeHydrate>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={analytics?.orderStatusData || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                                        {(analytics?.orderStatusData || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                         </SafeHydrate>
                    </CardContent>
                </Card>
            </div>
            
            {/* Tables */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Recent Orders</CardTitle>
                        <CardDescription>
                        Your most recent orders.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentOrders.length > 0 ? recentOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">{order.id}</TableCell>
                                        <TableCell>{order.user}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(order.status) as any}>{order.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">₹{order.total.toFixed(2)}</TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                            No recent orders found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Top Customers</CardTitle>
                        <CardDescription>Your most valuable customers based on spending.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Total Orders</TableHead>
                                    <TableHead className="text-right">Total Spent</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topCustomers.length > 0 ? topCustomers.map(customer => (
                                    <TableRow key={customer.id}>
                                        <TableCell className="font-medium">{customer.id}</TableCell>
                                        <TableCell>{customer.name}</TableCell>
                                        <TableCell>{customer.totalOrders}</TableCell>
                                        <TableCell className="text-right flex items-center justify-end">
                                            <IndianRupee className="h-4 w-4 text-muted-foreground"/>
                                            {customer.totalSpent.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                            No customer data found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function AdminDashboardPage() {
    return (
        <div className="container mx-auto p-6">
            <AdminDashboardContent />
        </div>
    );
}
