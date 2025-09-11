// src/app/admin/feedback/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Trash2, CheckSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SafeHydrate } from '@/components/shared/safe-hydrate';
import { getFeedback, archiveFeedback, deleteFeedback, type FeedbackItem } from '@/lib/mock-db';


export default function FeedbackPage() {
    const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const loadFeedback = async () => {
            const data = await getFeedback();
            setFeedback(data);
            setIsLoading(false);
        }
        loadFeedback();
    }, [])

    const handleArchive = async (id: string) => {
        await archiveFeedback(id);
        const data = await getFeedback();
        setFeedback(data);
        toast({ title: "Feedback Archived" });
    }

    const handleDelete = async (id: string) => {
        await deleteFeedback(id);
        const data = await getFeedback();
        setFeedback(data);
        toast({ title: "Feedback Deleted", variant: 'destructive' });
    }

    if (isLoading) {
        return <div>Loading...</div>
    }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">User Feedback</h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
          <CardDescription>Here's what your users are saying about the platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {feedback.length > 0 ? feedback.map(item => (
                 <Card key={item.id} className={item.status === 'Archived' ? 'bg-muted/50' : ''}>
                    <CardHeader className="pb-4 flex flex-row items-start justify-between">
                        <div>
                             <CardTitle className="text-lg flex items-center gap-2">
                                <MessageSquare className="h-5 w-5"/> From: {item.user}
                            </CardTitle>
                            <CardDescription><SafeHydrate>{new Date(item.date).toLocaleString()}</SafeHydrate></CardDescription>
                        </div>
                        <Badge variant={item.status === 'Archived' ? 'outline' : 'secondary'}>{item.status}</Badge>
                    </CardHeader>
                    <CardContent>
                        <p className="prose dark:prose-invert">{item.content}</p>
                        <div className="flex justify-end gap-2 mt-4">
                            {item.status === 'New' && (
                                <Button variant="outline" size="sm" onClick={() => handleArchive(item.id)}>
                                    <CheckSquare className="mr-2"/> Archive
                                </Button>
                            )}
                             <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                                <Trash2 className="mr-2"/> Delete
                            </Button>
                        </div>
                    </CardContent>
                 </Card>
            )) : (
                <p className="text-center text-muted-foreground py-8">No feedback submitted yet.</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
