// src/app/feedback/page.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { addFeedback } from '@/lib/mock-db';
import { useRouter } from 'next/navigation';

export default function FeedbackPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [feedbackText, setFeedbackText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
        toast({ title: 'Please enter your feedback', variant: 'destructive' });
        return;
    }
    await addFeedback({
        id: `f-${Date.now()}`,
        user: 'John Doe', // In a real app, get this from the logged-in user session
        date: new Date().toISOString(),
        content: feedbackText,
        status: 'New',
    });

    toast({
      title: 'Feedback Submitted',
      description: 'Thank you for your valuable feedback!',
    });
    
    setFeedbackText('');
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
        <Card className="w-full max-w-lg relative">
             <CardHeader>
                <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => router.back()}>
                    <ArrowLeft/>
                </Button>
                <CardTitle className="text-center text-2xl">Share Your Feedback</CardTitle>
                <CardDescription className="text-center">
                    We'd love to hear your thoughts on how we can improve.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="feedback">Your Feedback</Label>
                        <Textarea 
                            id="feedback" 
                            rows={6} 
                            placeholder="Tell us what you think..." 
                            required 
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                        />
                    </div>
                    <Button type="submit" className="w-full">
                        Submit Feedback
                    </Button>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
