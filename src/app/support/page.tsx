// src/app/support/page.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, LifeBuoy } from 'lucide-react';
import { addSupportTicket } from '@/lib/mock-db';
import { useRouter } from 'next/navigation';

export default function SupportPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [details, setDetails] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !details.trim()) {
      toast({ title: 'Please fill out all fields', variant: 'destructive' });
      return;
    }

    await addSupportTicket({
      user: 'John Doe', // In a real app, get from session
      subject,
      priority,
      details,
    });

    toast({
      title: 'Support Ticket Submitted',
      description: 'Our team will get back to you shortly. Thank you!',
    });

    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-lg relative">
        <CardHeader>
          <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => router.back()}>
            <ArrowLeft />
          </Button>
          <div className='text-center pt-8'>
            <LifeBuoy className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-2xl">Contact Support</CardTitle>
            <CardDescription>
              Have an issue? Fill out the form below and we'll get back to you.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input 
                id="subject" 
                placeholder="e.g., Issue with Order #ORD123" 
                required 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">Details</Label>
              <Textarea 
                id="details" 
                rows={6} 
                placeholder="Please describe your issue in detail..." 
                required 
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Submit Ticket
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
