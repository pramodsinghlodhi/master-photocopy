// src/app/(main)/wallet/page.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IndianRupee, Wallet as WalletIcon, Gift, ArrowRight, Copy, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initialWalletHistory = [
    { id: 'w1', date: '2023-11-20', description: 'Referral Bonus: Alice', amount: 10.00, type: 'credit' },
    { id: 'w2', date: '2023-11-19', description: 'Used on Order ORD788', amount: -20.00, type: 'debit' },
    { id: 'w3', date: '2023-11-15', description: 'Referral Bonus: Charlie', amount: 10.00, type: 'credit' },
    { id: 'w4', date: '2023-11-05', description: 'Coupon Conversion: WELCOME20', amount: 20.00, type: 'credit' },
];

export default function WalletPage() {
    const [walletHistory, setWalletHistory] = useState(initialWalletHistory);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [amountToConvert, setAmountToConvert] = useState('');
    const { toast } = useToast();
    
    const currentBalance = walletHistory.reduce((acc, item) => acc + item.amount, 0);

    const handleGenerateCoupon = () => {
        const amount = parseFloat(amountToConvert);
        if (isNaN(amount) || amount <= 0) {
            toast({ title: "Invalid Amount", description: "Please enter a valid amount to convert.", variant: "destructive" });
            return;
        }
        if (amount > currentBalance) {
            toast({ title: "Insufficient Balance", description: "You cannot convert more than your current balance.", variant: "destructive" });
            return;
        }

        const newCouponCode = `W2C-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        
        // Add a debit transaction to wallet history
        const newTransaction = {
            id: `w-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            description: `Converted to Coupon: ${newCouponCode}`,
            amount: -amount,
            type: 'debit' as const
        };
        setWalletHistory(prev => [...prev, newTransaction]);
        
        // In a real app, this coupon would be saved to the database.
        toast({
            title: "Coupon Generated!",
            description: `Code: ${newCouponCode} for ₹${amount.toFixed(2)}. This is a one-time use coupon.`,
            duration: 10000,
            action: (
                 <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(newCouponCode)}>
                    <Copy className="mr-2"/> Copy
                </Button>
            )
        });

        setIsDialogOpen(false);
        setAmountToConvert('');
    }

  return (
    <div className="grid gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">My Wallet</h1>
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <WalletIcon className="h-6 w-6 text-primary"/> Current Balance
                </CardTitle>
                <CardDescription>Your available credits for printing.</CardDescription>
                </CardHeader>
                <CardContent>
                <div className="text-4xl font-bold flex items-center">
                    <IndianRupee className="h-8 w-8"/>{currentBalance.toFixed(2)}
                </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>A record of your wallet activity.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {walletHistory.map((item, index) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.date}</TableCell>
                                    <TableCell>{item.description}</TableCell>
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
        </div>
        <div className="lg:col-span-1">
             <Card className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Gift className="h-6 w-6"/> Share Your Balance
                    </CardTitle>
                    <CardDescription className="text-primary-foreground/80">Convert your wallet balance into a one-time use coupon code for a friend.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="secondary" className="w-full">
                                <PlusCircle className="mr-2"/> Generate Coupon
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Generate a Gift Coupon</DialogTitle>
                                <DialogDescription>Enter the amount you want to convert from your wallet balance.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount to Convert (₹)</Label>
                                    <Input 
                                        id="amount" 
                                        type="number" 
                                        value={amountToConvert}
                                        onChange={(e) => setAmountToConvert(e.target.value)}
                                        placeholder={`Max: ${currentBalance.toFixed(2)}`}
                                    />
                                    <p className="text-xs text-muted-foreground">Your remaining balance will be ₹{(currentBalance - (parseFloat(amountToConvert) || 0)).toFixed(2)}</p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleGenerateCoupon}>Generate & Debit</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
