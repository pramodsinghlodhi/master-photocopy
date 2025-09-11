// src/app/admin/settings/page.tsx
'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { DollarSign, Mail, MessageSquare, Truck, Sparkles, Link as LinkIcon, Key, UserCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { SafeHydrate } from '@/components/shared/safe-hydrate';


export default function SettingsPage() {
  const { toast } = useToast();
  // We use localStorage for this demo. Initialize with `false` and update on mount.
  const [aiAnalysisEnabled, setAiAnalysisEnabled] = React.useState(false);

  // New state for tag2wa settings
  const [tag2wa, setTag2wa] = React.useState({
    webhookEnabled: false,
    webhookUrl: '',
    apiToken: '',
    baseUrl: 'https://tag2wa.com/api',
    vendorUid: 'aa0b9d8a-5585-4471-818f-d60072893fbc'
  });

  const handleTag2waChange = (field: keyof typeof tag2wa, value: string | boolean) => {
    setTag2wa(prev => ({...prev, [field]: value}));
  }

  const exampleEndpoint = `${tag2wa.baseUrl}/${tag2wa.vendorUid}/contact/send-message?token=${tag2wa.apiToken || 'YOUR_TOKEN'}`;

  // This effect runs only on the client, after the initial render.
  React.useEffect(() => {
    const setting = localStorage.getItem('aiAnalysisEnabled');
    // Set the state from localStorage if it exists, default to true if not set.
    setAiAnalysisEnabled(setting !== null ? setting === 'true' : true);
  }, []);


  const handleAiAnalysisToggle = (enabled: boolean) => {
    setAiAnalysisEnabled(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('aiAnalysisEnabled', String(enabled));
    }
  }

  // In a real app, you would fetch these settings from a database and have a function to save them.
  const handleSaveChanges = () => {
    // Logic to save all settings would go here.
    console.log({
      aiAnalysisEnabled,
      // ... other settings
    });
    toast({
        title: "Settings Saved",
        description: "Your changes have been successfully saved.",
    })
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
          <CardDescription>Configure core application settings, integrations, and notification channels.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            {/* AI Features Settings */}
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2"><Sparkles className="h-5 w-5"/>AI Features</h3>
                 <SafeHydrate>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="ai-analysis-enable" className="flex flex-col gap-1">
                            <span>Enable AI Document Review</span>
                            <span className="text-xs text-muted-foreground">Show the AI analysis and suggestions card on the order page.</span>
                        </Label>
                        <Switch 
                          id="ai-analysis-enable" 
                          checked={aiAnalysisEnabled} 
                          onCheckedChange={handleAiAnalysisToggle}
                        />
                    </div>
                 </SafeHydrate>
            </div>
            
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2"><MessageSquare className="h-5 w-5"/>WhatsApp API & Webhook</h3>
                <div className="flex items-center justify-between">
                    <Label htmlFor="webhook-enable" className="flex flex-col gap-1">
                        <span>Enable Webhook Endpoint</span>
                        <span className="text-xs text-muted-foreground">Forward WhatsApp webhook payloads to your endpoint.</span>
                    </Label>
                    <Switch id="webhook-enable" checked={tag2wa.webhookEnabled} onCheckedChange={(val) => handleTag2waChange('webhookEnabled', val)}/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="webhook-url">Webhook Endpoint URL</Label>
                    <Input id="webhook-url" placeholder="https://your-service.com/webhook" value={tag2wa.webhookUrl} onChange={(e) => handleTag2waChange('webhookUrl', e.target.value)} />
                </div>
                <Separator/>
                <h4 className="font-medium">API Configuration</h4>
                 <div className="space-y-2">
                    <Label htmlFor="api-token">API Access Token</Label>
                    <Input id="api-token" type="password" placeholder="Your API Access Token" value={tag2wa.apiToken} onChange={(e) => handleTag2waChange('apiToken', e.target.value)}/>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="api-base-url">API Base URL</Label>
                        <Input id="api-base-url" placeholder="https://tag2wa.com/api" value={tag2wa.baseUrl} onChange={(e) => handleTag2waChange('baseUrl', e.target.value)}/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="vendor-uid">Your Vendor UID</Label>
                        <Input id="vendor-uid" placeholder="Your unique vendor ID" value={tag2wa.vendorUid} onChange={(e) => handleTag2waChange('vendorUid', e.target.value)} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label>Example Endpoint</Label>
                    <div className="text-xs p-2 rounded-md bg-secondary text-muted-foreground break-all">
                        {exampleEndpoint}
                    </div>
                </div>
            </div>

            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2"><DollarSign className="h-5 w-5"/>Payment Gateway</h3>
                <div className="flex items-center justify-between">
                    <Label htmlFor="payment-enable" className="flex flex-col gap-1">
                        <span>Enable Payment Gateway</span>
                        <span className="text-xs text-muted-foreground">Process payments through your chosen provider.</span>
                    </Label>
                    <Switch id="payment-enable" defaultChecked/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="razorpay-key-id">Razorpay Key ID</Label>
                    <Input id="razorpay-key-id" type="text" placeholder="Your Razorpay Key ID" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="razorpay-key-secret">Razorpay Key Secret</Label>
                    <Input id="razorpay-key-secret" type="password" placeholder="Your Razorpay Key Secret" />
                </div>
            </div>
            
             <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2"><Truck className="h-5 w-5"/>Shipment Provider</h3>
                <div className="flex items-center justify-between">
                    <Label htmlFor="shiprocket-enable" className="flex flex-col gap-1">
                        <span>Enable Shiprocket Integration</span>
                        <span className="text-xs text-muted-foreground">Create shipments and track orders via Shiprocket.</span>
                    </Label>
                    <Switch id="shiprocket-enable" defaultChecked/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="shiprocket-email">Shiprocket API Email</Label>
                    <Input id="shiprocket-email" type="email" placeholder="Your Shiprocket account email" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="shiprocket-token">Shiprocket API Token</Label>
                    <Input id="shiprocket-token" type="password" placeholder="Your Shiprocket v1 API Token" />
                </div>
            </div>

            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">Notification Channels (Legacy)</h3>
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="whatsapp-enable" className="flex flex-col gap-1">
                                <span className="font-medium flex items-center gap-2"><MessageSquare className="h-4 w-4"/>WhatsApp Messages</span>
                            </Label>
                            <Switch id="whatsapp-enable" defaultChecked/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="whatsapp-sid">Account SID</Label>
                            <Input id="whatsapp-sid" placeholder="Your WhatsApp Business Account SID" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="whatsapp-token">Auth Token</Label>
                            <Input id="whatsapp-token" type="password" placeholder="Your Auth Token" />
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <Label htmlFor="email-enable" className="flex flex-col gap-1">
                                <span className="font-medium flex items-center gap-2"><Mail className="h-4 w-4"/>Email (SMTP)</span>
                            </Label>
                            <Switch id="email-enable" defaultChecked/>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="smtp-host">SMTP Host</Label>
                                <Input id="smtp-host" placeholder="smtp.example.com" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="smtp-port">SMTP Port</Label>
                                <Input id="smtp-port" type="number" placeholder="587" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="smtp-user">SMTP Username</Label>
                            <Input id="smtp-user" placeholder="user@example.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="smtp-pass">SMTP Password</Label>
                            <Input id="smtp-pass" type="password" placeholder="Your SMTP Password" />
                        </div>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
