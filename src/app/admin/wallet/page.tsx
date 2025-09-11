

'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { IndianRupee, Wallet, ArrowUp, ArrowDown, Search, PlusCircle, MoreHorizontal, UserX, UserCheck, ArrowRight, Gift } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SafeHydrate } from '@/components/shared/safe-hydrate';


type CustomerStatus = 'Active' | 'Inactive';

type CustomerWallet = {
    customerId: string;
    customerName: string;
    balance: number;
    status: CustomerStatus;
};

type WalletTransaction = {
    id: string;
    customerName: string;
    customerId: string;
    date: string;
    description: string;
    amount: number;
    type: 'credit' | 'debit';
};

const mockTransactions: WalletTransaction[] = [
    { id: 't1', customerName: 'John Doe', customerId: 'CUST001', date: '2023-11-20', description: 'Referral Bonus: Alice', amount: 10.00, type: 'credit' },
    { id: 't2', customerName: 'Alice', customerId: 'CUST002', date: '2023-11-19', description: 'Used on Order ORD788', amount: -20.00, type: 'debit' },
    { id: 't3', customerName: 'John Doe', customerId: 'CUST001', date: '2023-11-15', description: 'Referral Bonus: Charlie', amount: 10.00, type: 'credit' },
    { id: 't4', customerName: 'Bob', customerId: 'CUST003', date: '2023-11-05', description: 'Coupon Conversion: WELCOME20', amount: 20.00, type: 'credit' },
    { id: 't5', customerName: 'Alice', customerId: 'CUST002', date: '2023-11-21', description: 'Refund for ORD780', amount: 50.00, type: 'credit' },
    { id: 't6', customerName: 'John Doe', customerId: 'CUST001', date: '2023-11-22', description: 'Used on Order ORD789', amount: -15.00, type: 'debit' },
    { id: 't7', customerName: 'John Doe', customerId: 'CUST001', date: '2023-11-25', description: 'Converted to Coupon: W2C-SHARE1', amount: -10.00, type: 'debit' },
];


export default function WalletDataPage() {
    const [transactions, setTransactions] = useState<WalletTransaction[]>(mockTransactions);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
    const [adjustment, setAdjustment] = useState({ customerId: '', type: 'credit' as 'credit' | 'debit', amount: '', reason: ''});
    const { toast } = useToast();

    const customerWallets = useMemo((): CustomerWallet[] => {
        const wallets = new Map<string, {name: string, balance: number, status: CustomerStatus}>();
        transactions.forEach(t => {
            if (!wallets.has(t.customerId)) {
                wallets.set(t.customerId, { name: t.customerName, balance: 0, status: 'Active' });
            }
            const current = wallets.get(t.customerId)!;
            wallets.set(t.customerId, { ...current, balance: current.balance + t.amount });
        });

        // This is a mock for demo, in real app, status would come from a user object
        // For now, make Bob inactive
        if (wallets.has('CUST003')) {
            const bob = wallets.get('CUST003')!;
            wallets.set('CUST003', { ...bob, status: 'Inactive'});
        }

        return Array.from(wallets.entries()).map(([id, data]) => ({
            customerId: id,
            customerName: data.name,
            balance: data.balance,
            status: data.status,
        }));
    }, [transactions]);


    const { totalBalance, totalCredits, totalDebits, couponConversions } = useMemo(() => {
        const totalBalance = transactions.reduce((acc, item) => acc + item.amount, 0);
        const totalCredits = transactions.filter(t => t.type === 'credit').reduce((acc, item) => acc + item.amount, 0);
        const totalDebits = transactions.filter(t => t.type === 'debit').reduce((acc, item) => acc + item.amount, 0);
        const couponConversions = transactions.filter(t => t.description.toLowerCase().startsWith('converted to coupon'));
        return { totalBalance, totalCredits, totalDebits, couponConversions };
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        if (!searchQuery) return transactions;
        return transactions.filter(t => 
            t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, transactions]);
    
    const handleAdjustBalance = () => {
        if(!adjustment.customerId || !adjustment.amount || !adjustment.reason) {
            toast({ title: 'Missing fields', description: 'Please fill out all adjustment fields.', variant: 'destructive'});
            return;
        }

        const customer = customerWallets.find(c => c.customerId === adjustment.customerId);
        if(!customer) {
             toast({ title: 'Customer not found', variant: 'destructive'});
             return;
        }

        const newTransaction: WalletTransaction = {
            id: `t-${Date.now()}`,
            customerId: customer.customerId,
            customerName: customer.customerName,
            date: new Date().toISOString().split('T')[0],
            description: `Manual Adjustment: ${adjustment.reason}`,
            amount: adjustment.type === 'credit' ? Number(adjustment.amount) : -Number(adjustment.amount),
            type: adjustment.type,
        };

        setTransactions(prev => [newTransaction, ...prev]);
        toast({ title: 'Balance Adjusted', description: `Successfully adjusted ${customer.customerName}'s balance.`});
        setIsAdjustDialogOpen(false);
        setAdjustment({ customerId: '', type: 'credit', amount: '', reason: ''});
    };

    const handleToggleBlock = (customerId: string) => {
        // In a real app, this would update the user's status in the database.
        // Here, we just show a toast.
        const customer = customerWallets.find(c => c.customerId === customerId);
        if(customer) {
            toast({
                title: `User status changed`,
                description: `${customer.customerName} has been ${customer.status === 'Active' ? 'blocked' : 'unblocked'}. (Simulated)`,
            });
        }
    }


  return (
    <div className="flex flex-col gap-8">
        <h1 className="text-3xl font-bold">Wallet Management</h1>
        
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Wallet Balance</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold flex items-center">
                        <IndianRupee className="h-6 w-6"/>{totalBalance.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">Across all customers</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Credits Issued</CardTitle>
                    <ArrowUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold flex items-center">
                         <IndianRupee className="h-6 w-6"/>{totalCredits.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">Total amount added to wallets</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Debits (Spent)</CardTitle>
                    <ArrowDown className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold flex items-center">
                         <IndianRupee className="h-6 w-6"/>{Math.abs(totalDebits).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">Total amount spent from wallets</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Coupon Conversions</CardTitle>
                    <Gift className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{couponConversions.length}</div>
                    <p className="text-xs text-muted-foreground">Coupons generated from balance</p>
                </CardContent>
            </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
             <div className="flex items-center justify-between flex-wrap gap-4">
                <TabsList>
                    <TabsTrigger value="overview">Customer Wallets</TabsTrigger>
                    <TabsTrigger value="conversions">Coupon Conversions</TabsTrigger>
                    <TabsTrigger value="history">Global History</TabsTrigger>
                </TabsList>
                 <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
                    <DialogTrigger asChild>
                         <Button><PlusCircle className="mr-2"/>Adjust Balance</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Manual Wallet Adjustment</DialogTitle>
                            <DialogDescription>
                                Credit or debit a customer's wallet. This action will be logged.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                             <div className="space-y-2">
                                <Label htmlFor="customer-select">Customer</Label>
                                <Select value={adjustment.customerId} onValueChange={(value) => setAdjustment({...adjustment, customerId: value})}>
                                    <SelectTrigger id="customer-select"><SelectValue placeholder="Select a customer..."/></SelectTrigger>
                                    <SelectContent>
                                        {customerWallets.map(c => <SelectItem key={c.customerId} value={c.customerId}>{c.customerName} ({c.customerId})</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type-select">Action</Label>
                                    <Select value={adjustment.type} onValueChange={(value: 'credit' | 'debit') => setAdjustment({...adjustment, type: value})}>
                                        <SelectTrigger id="type-select"><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="credit">Credit (Add Funds)</SelectItem>
                                            <SelectItem value="debit">Debit (Remove Funds)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="amount">Amount (₹)</Label>
                                    <Input id="amount" type="number" value={adjustment.amount} onChange={(e) => setAdjustment({...adjustment, amount: e.target.value})} placeholder="e.g., 50"/>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reason">Reason for Adjustment</Label>
                                <Input id="reason" value={adjustment.reason} onChange={(e) => setAdjustment({...adjustment, reason: e.target.value})} placeholder="e.g., Fraudulent referral correction"/>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" onClick={handleAdjustBalance}>Confirm Adjustment</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <TabsContent value="overview" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Customer Wallet Balances</CardTitle>
                        <CardDescription>An overview of all customer wallet statuses and balances.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customerWallets.map(wallet => (
                                    <TableRow key={wallet.customerId}>
                                        <TableCell className="font-medium">{wallet.customerName}</TableCell>
                                        <TableCell><Badge variant={wallet.status === 'Active' ? 'secondary' : 'outline'}>{wallet.status}</Badge></TableCell>
                                        <TableCell className="text-right flex items-center justify-end"><IndianRupee className="h-4 w-4"/>{wallet.balance.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/admin/customers/${wallet.customerId}`}>
                                                            <ArrowRight className="mr-2"/>View Details
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleToggleBlock(wallet.customerId)}>
                                                        {wallet.status === 'Active' ? <UserX className="mr-2"/> : <UserCheck className="mr-2"/>}
                                                        {wallet.status === 'Active' ? 'Block Customer' : 'Unblock Customer'}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="conversions" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Wallet to Coupon Conversions</CardTitle>
                        <CardDescription>A log of all coupons generated from wallet balances.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Coupon Code</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {couponConversions.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell><SafeHydrate>{new Date(item.date).toLocaleDateString()}</SafeHydrate></TableCell>
                                        <TableCell className="font-medium">{item.customerName}</TableCell>
                                        <TableCell>{item.description.replace('Converted to Coupon: ', '')}</TableCell>
                                        <TableCell className="text-right font-medium text-destructive">
                                            <span className="flex items-center justify-end">
                                                <IndianRupee className="h-4 w-4"/>{Math.abs(item.amount).toFixed(2)}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="history" className="mt-4">
                 <Card>
                    <CardHeader>
                        <CardTitle>Global Transaction History</CardTitle>
                        <CardDescription>View and search all wallet transactions across all customers.</CardDescription>
                        <div className="relative pt-4">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by customer or description..." 
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.customerName}</TableCell>
                                        <TableCell><SafeHydrate>{new Date(item.date).toLocaleDateString()}</SafeHydrate></TableCell>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell>
                                            <Badge variant={item.type === 'credit' ? 'secondary' : 'outline'}>{item.type}</Badge>
                                        </TableCell>
                                        <TableCell className={`text-right font-medium ${item.type === 'credit' ? 'text-green-600' : 'text-destructive'}`}>
                                        <span className="flex items-center justify-end">
                                            {item.type === 'credit' ? '+' : '-'} <IndianRupee className="h-4 w-4"/>{Math.abs(item.amount).toFixed(2)}
                                        </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  )
}
