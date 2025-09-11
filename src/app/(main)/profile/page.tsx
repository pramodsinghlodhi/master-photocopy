// src/app/(main)/profile/page.tsx
'use client';

import React, { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Smartphone, Laptop, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SafeHydrate } from '@/components/shared/safe-hydrate';

const loginHistory = [
    { device: 'iPhone 14 Pro', type: 'mobile', location: 'Mumbai, IN', time: '2 hours ago' },
    { device: 'Windows 11 PC', type: 'desktop', location: 'Mumbai, IN', time: '1 day ago' },
    { device: 'MacBook Pro', type: 'laptop', location: 'Pune, IN', time: '3 days ago' },
];

const getDeviceIcon = (type: 'mobile' | 'desktop' | 'laptop') => {
    switch(type) {
        case 'mobile': return <Smartphone className="h-5 w-5 text-muted-foreground" />;
        case 'desktop': return <Monitor className="h-5 w-5 text-muted-foreground" />;
        case 'laptop': return <Laptop className="h-5 w-5 text-muted-foreground" />;
    }
}


export default function ProfilePage() {
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveChanges = () => {
        // Here you would typically upload the new avatar to your backend if one was selected
        // and save the other profile details.
        toast({
            title: "Profile Updated",
            description: "Your changes have been successfully saved.",
        });
    }

  return (
    <div className="grid gap-8">
        <div>
            <h1 className="text-lg font-semibold md:text-2xl">My Profile</h1>
            <p className="text-muted-foreground">Manage your account settings and view your activity.</p>
        </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="relative mx-auto mb-4 h-28 w-28">
                <Avatar className="h-full w-full">
                  <AvatarImage src={avatarPreview ?? "https://placehold.co/112x112.png"} alt="@user" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    className="hidden"
                    accept="image/png, image/jpeg, image/gif"
                />
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                  <span className="sr-only">Change Photo</span>
                </Button>
              </div>
              <h3 className="text-xl font-semibold">John Doe</h3>
              <p className="text-muted-foreground">john.doe@example.com</p>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Tabs defaultValue="account">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="security">Login History</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" defaultValue="John Doe" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" defaultValue="john.doe@example.com" />
                        </div>
                   </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="age">Age</Label>
                            <Input id="age" type="number" defaultValue="28" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gender">Gender</Label>
                            <Select defaultValue="male">
                                <SelectTrigger id="gender">
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                   </div>
                   <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" type="tel" defaultValue="9876543210" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">Address Line</Label>
                        <Input id="address" defaultValue="123, Printwell Lane" />
                    </div>
                     <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input id="city" defaultValue="Copytown" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input id="state" defaultValue="Maharashtra" />
                        </div>
                   </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="pincode">Pin Code</Label>
                            <Input id="pincode" defaultValue="400001" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="landmark">Landmark (Optional)</Label>
                            <Input id="landmark" defaultValue="Near The Big Stapler" />
                        </div>
                   </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Login History</CardTitle>
                  <CardDescription>A record of devices that have signed into your account.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Device</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                    <SafeHydrate>
                      {loginHistory.map((session, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium flex items-center gap-3">
                            {getDeviceIcon(session.type as any)}
                            {session.device}
                          </TableCell>
                          <TableCell>{session.location}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{session.time}</TableCell>
                        </TableRow>
                      ))}
                      </SafeHydrate>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
           <div className="mt-6 flex justify-end">
                <Button onClick={handleSaveChanges}>Save Changes</Button>
            </div>
        </div>
      </div>
    </div>
  );
}
