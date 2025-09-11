

'use client';

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
import { IndianRupee, Users, ShoppingCart, Megaphone, ArrowUp, BarChart as BarChartIcon } from "lucide-react"
import { recentOrders, salesData, orderStatusData, topCustomers } from '@/lib/mock-db';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bar, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, PieChart } from 'recharts';
import { SafeHydrate } from "@/components/shared/safe-hydrate";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];


export default function AdminDashboardPage() {
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
  return (
    <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
       
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹98,543.50</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                        <ArrowUp className="h-4 w-4 text-green-500"/> +12.5% this month
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">1,254</div>
                    <p className="text-xs text-muted-foreground">+8.2% this month</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">182</div>
                    <p className="text-xs text-muted-foreground">+21.3% this month</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Ads</CardTitle>
                    <Megaphone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">3</div>
                    <p className="text-xs text-muted-foreground">Currently running campaigns</p>
                </CardContent>
            </Card>
        </div>

         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
                <CardHeader>
                    <CardTitle>Sales Overview</CardTitle>
                    <CardDescription>Last 6 months of sales data.</CardDescription>
                </CardHeader>
                <CardContent>
                    <SafeHydrate>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={salesData}>
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
                                <Pie data={orderStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                                    {orderStatusData.map((entry, index) => (
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
                            {recentOrders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">{order.id}</TableCell>
                                    <TableCell>{order.user}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(order.status) as any}>{order.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">₹{order.total.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
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
                            {topCustomers.map(customer => (
                                <TableRow key={customer.id}>
                                    <TableCell className="font-medium">{customer.id}</TableCell>
                                    <TableCell>{customer.name}</TableCell>
                                    <TableCell>{customer.totalOrders}</TableCell>
                                    <TableCell className="text-right flex items-center justify-end">
                                        <IndianRupee className="h-4 w-4 text-muted-foreground"/>
                                        {customer.totalSpent.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    </div>
  )
}
