

'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, PlusCircle, Gift, Users, IndianRupee, Tag } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

type Coupon = {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  uses: number;
  maxUses?: number; // Optional: for one-time use or limited uses
  expires: string;
  isActive: boolean;
};

type Referral = {
    id: string;
    referredBy: string;
    newUser: string;
    date: string;
}

const initialCoupons: Coupon[] = [
  { id: 'c1', code: 'SUMMER20', type: 'percentage', value: 20, uses: 45, expires: '2024-08-31', isActive: true },
  { id: 'c2', code: 'WELCOME50', type: 'fixed', value: 50, uses: 120, expires: '2024-12-31', isActive: true },
  { id: 'c3', code: 'DIWALI100', type: 'fixed', value: 100, uses: 78, expires: '2023-11-15', isActive: false },
  { id: 'c4', code: 'W2C-FRIEND', type: 'fixed', value: 25, uses: 0, maxUses: 1, expires: '', isActive: true },
];

const initialReferrals: Referral[] = [
    { id: 'r1', referredBy: 'John Doe', newUser: 'Alice', date: '2024-05-20'},
    { id: 'r2', referredBy: 'Charlie', newUser: 'Bob', date: '2024-05-18'},
    { id: 'r3', referredBy: 'John Doe', newUser: 'Diana', date: '2024-05-15'},
];

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
    const [referrals] = useState<Referral[]>(initialReferrals);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newCoupon, setNewCoupon] = useState({ code: '', type: 'fixed' as 'fixed' | 'percentage', value: '', expires: '', maxUses: '' });
    const { toast } = useToast();

    const handleCreateCoupon = () => {
        if (!newCoupon.code || !newCoupon.value) {
            toast({ title: "Missing Information", description: "Please fill out all fields.", variant: "destructive"});
            return;
        }
        const coupon: Coupon = {
            id: `c-${Date.now()}`,
            code: newCoupon.code.toUpperCase(),
            type: newCoupon.type,
            value: Number(newCoupon.value),
            expires: newCoupon.expires,
            maxUses: newCoupon.maxUses ? Number(newCoupon.maxUses) : undefined,
            uses: 0,
            isActive: true,
        };
        setCoupons(prev => [coupon, ...prev]);
        setNewCoupon({ code: '', type: 'fixed', value: '', expires: '', maxUses: '' });
        setIsDialogOpen(false);
        toast({ title: "Coupon Created", description: `Coupon "${coupon.code}" has been added.`});
    };

    const handleToggleStatus = (id: string, status: boolean) => {
        setCoupons(prev => prev.map(c => (c.id === id ? { ...c, isActive: status } : c)));
    };

    const handleDeleteCoupon = (id: string) => {
        setCoupons(prev => prev.filter(c => c.id !== id));
        toast({ title: "Coupon Deleted", variant: "destructive" });
    };

  return (
    <div className="flex flex-col gap-8">
        <h1 className="text-3xl font-bold">Referrals & Coupons</h1>
        
        <div className="grid gap-6 md:grid-cols-3">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
                    <Gift className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{coupons.filter(c => c.isActive).length}</div>
                    <p className="text-xs text-muted-foreground">Currently usable coupons</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{referrals.length}</div>
                    <p className="text-xs text-muted-foreground">Successful referral sign-ups</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Coupon Usage</CardTitle>
                    <Tag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{coupons.reduce((acc, c) => acc + c.uses, 0)}</div>
                    <p className="text-xs text-muted-foreground">Total times all coupons have been used</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Manage Coupons</CardTitle>
                        <CardDescription>Create, view, and manage your promotional offers.</CardDescription>
                    </div>
                     <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><PlusCircle className="mr-2"/>Create Coupon</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Coupon</DialogTitle>
                                <DialogDescription>Fill in the details for your new coupon.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Coupon Code</Label>
                                    <Input id="code" value={newCoupon.code} onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value})} placeholder="e.g., SAVE10"/>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="type">Type</Label>
                                        <Select value={newCoupon.type} onValueChange={(value: 'fixed' | 'percentage') => setNewCoupon({...newCoupon, type: value})}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                                                <SelectItem value="percentage">Percentage (%)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="value">Value</Label>
                                        <Input id="value" type="number" value={newCoupon.value} onChange={(e) => setNewCoupon({...newCoupon, value: e.target.value})} placeholder="e.g., 50"/>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="max-uses">Max Uses (Optional)</Label>
                                        <Input id="max-uses" type="number" value={newCoupon.maxUses} onChange={(e) => setNewCoupon({...newCoupon, maxUses: e.target.value})} placeholder="e.g., 1 for single-use"/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="expires">Expiry Date (Optional)</Label>
                                        <Input id="expires" type="date" value={newCoupon.expires} onChange={(e) => setNewCoupon({...newCoupon, expires: e.target.value})}/>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" onClick={handleCreateCoupon}>Create Coupon</Button>
                            </DialogFooter>
                        </DialogContent>
                     </Dialog>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Uses</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {coupons.map(coupon => (
                                <TableRow key={coupon.id}>
                                    <TableCell>
                                        <div className="font-medium">{coupon.code}</div>
                                        <div className="text-xs text-muted-foreground">Expires: {coupon.expires || 'Never'}</div>
                                    </TableCell>
                                    <TableCell>
                                        {coupon.type === 'fixed' 
                                            ? <span className="flex items-center"><IndianRupee className="h-3 w-3 mr-1"/>{coupon.value} Off</span> 
                                            : `${coupon.value}% Off`}
                                    </TableCell>
                                    <TableCell>
                                        {coupon.maxUses ? `${coupon.uses} / ${coupon.maxUses}` : coupon.uses}
                                        {coupon.maxUses === 1 && <Badge variant="outline" className="ml-2">One-Time</Badge>}
                                    </TableCell>
                                    <TableCell>
                                        <Switch checked={coupon.isActive} onCheckedChange={(status) => handleToggleStatus(coupon.id, status)} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCoupon(coupon.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Referral History</CardTitle>
                    <CardDescription>Track successful referrals.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Referred By</TableHead>
                                <TableHead>New User</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {referrals.map(ref => (
                                <TableRow key={ref.id}>
                                    <TableCell>{ref.referredBy}</TableCell>
                                    <TableCell>{ref.newUser}</TableCell>
                                    <TableCell>{ref.date}</TableCell>
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
