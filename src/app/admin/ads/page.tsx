// src/app/admin/ads/page.tsx
'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, PlusCircle, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type Ad = {
  id: string;
  title: string;
  imageUrl: string;
  redirectUrl: string;
  width: number;
  height: number;
  isActive: boolean;
};

const initialAds: Ad[] = [
  {
    id: 'ad-1',
    title: 'Special Offer: 20% Off Color Prints!',
    imageUrl: 'https://placehold.co/1200x150.png',
    redirectUrl: '/order',
    width: 1200,
    height: 150,
    isActive: true,
  },
  {
    id: 'ad-2',
    title: 'Refer a Friend, Get Rewards',
    imageUrl: 'https://placehold.co/728x90.png',
    redirectUrl: '/referrals',
    width: 728,
    height: 90,
    isActive: false,
  },
];

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>(initialAds);
  const [open, setOpen] = useState(false);
  const [newAd, setNewAd] = useState({ title: '', imageUrl: '', redirectUrl: '', width: 1200, height: 150 });

  const handleCreateAd = () => {
    const ad: Ad = {
      id: `ad-${Date.now()}`,
      ...newAd,
      isActive: true,
    };
    setAds(prev => [ad, ...prev]);
    setNewAd({ title: '', imageUrl: '', redirectUrl: '', width: 1200, height: 150 });
    setOpen(false);
  };

  const handleToggleStatus = (id: string, status: boolean) => {
    setAds(prev => prev.map(ad => (ad.id === id ? { ...ad, isActive: status } : ad)));
  };

  const handleDeleteAd = (id: string) => {
    setAds(prev => prev.filter(ad => ad.id !== id));
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Ad Management</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Create New Ad
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Ad Banner</DialogTitle>
              <DialogDescription>
                Fill in the details for your new ad campaign. Specify the dimensions for display.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input id="title" value={newAd.title} onChange={(e) => setNewAd({...newAd, title: e.target.value})} className="col-span-3" placeholder="e.g., Summer Sale"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="imageUrl" className="text-right">Image URL</Label>
                <Input id="imageUrl" value={newAd.imageUrl} onChange={(e) => setNewAd({...newAd, imageUrl: e.target.value})} className="col-span-3" placeholder="https://placehold.co/1200x150.png"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="redirectUrl" className="text-right">Redirect URL</Label>
                <Input id="redirectUrl" value={newAd.redirectUrl} onChange={(e) => setNewAd({...newAd, redirectUrl: e.target.value})} className="col-span-3" placeholder="/order"/>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="width" className="text-right">Dimensions</Label>
                <div className="col-span-3 grid grid-cols-2 gap-2">
                    <Input id="width" type="number" value={newAd.width} onChange={(e) => setNewAd({...newAd, width: Number(e.target.value)})} placeholder="Width"/>
                    <Input id="height" type="number" value={newAd.height} onChange={(e) => setNewAd({...newAd, height: Number(e.target.value)})} placeholder="Height"/>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateAd}>Create Ad</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ad Campaigns</CardTitle>
          <CardDescription>Manage ad placements and campaigns on the user-facing application.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Dimensions</TableHead>
                <TableHead>Redirect URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ads.map(ad => (
                <TableRow key={ad.id}>
                  <TableCell>
                    <Image src={ad.imageUrl} alt={ad.title} width={100} height={Math.round(100 * (ad.height / ad.width))} className="rounded-sm object-cover" />
                  </TableCell>
                  <TableCell className="font-medium">{ad.title}</TableCell>
                   <TableCell className="text-sm text-muted-foreground">{ad.width} x {ad.height}</TableCell>
                  <TableCell>
                    <Link href={ad.redirectUrl} target="_blank" className="text-sm flex items-center gap-1 hover:underline">
                      {ad.redirectUrl} <ExternalLink className="h-3 w-3"/>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={ad.isActive}
                        onCheckedChange={(status) => handleToggleStatus(ad.id, status)}
                        id={`status-${ad.id}`}
                      />
                      <Label htmlFor={`status-${ad.id}`}>
                        <Badge variant={ad.isActive ? "secondary" : "outline"}>
                          {ad.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </Label>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteAd(ad.id)}>
                      <Trash2 className="h-4 w-4" />
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
