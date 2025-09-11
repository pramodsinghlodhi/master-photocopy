// src/app/admin/content/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import React, { useState, useEffect } from 'react';
import { getContent, updateContent } from '@/lib/mock-db';

export default function ContentManagementPage() {
    const [content, setContent] = useState({ terms: '', privacy: '', refund: '' });
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchContent = async () => {
            const data = await getContent();
            setContent(data);
            setIsLoading(false);
        };
        fetchContent();
    }, []);

    const handleSave = async (section: keyof typeof content) => {
        await updateContent({ [section]: content[section] });
        toast({
            title: "Content Saved",
            description: `Your changes to the ${section.replace(/^\w/, c => c.toUpperCase())} Policy have been saved.`,
        });
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Content Management</h1>
      </div>

      <Tabs defaultValue="terms">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="terms">Terms of Service</TabsTrigger>
          <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
          <TabsTrigger value="refund">Refund Policy</TabsTrigger>
        </TabsList>
        <TabsContent value="terms">
            <Card>
                <CardHeader>
                    <CardTitle>Edit Terms of Service</CardTitle>
                    <CardDescription>Modify the terms and conditions for using your service.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea 
                        value={content.terms} 
                        onChange={(e) => setContent(prev => ({...prev, terms: e.target.value}))}
                        rows={20}
                    />
                    <Button onClick={() => handleSave('terms')}>Save Changes</Button>
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="privacy">
            <Card>
                <CardHeader>
                    <CardTitle>Edit Privacy Policy</CardTitle>
                    <CardDescription>Update your privacy policy to reflect your data handling practices.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea 
                        value={content.privacy} 
                        onChange={(e) => setContent(prev => ({...prev, privacy: e.target.value}))}
                        rows={20}
                    />
                    <Button onClick={() => handleSave('privacy')}>Save Changes</Button>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="refund">
            <Card>
                <CardHeader>
                    <CardTitle>Edit Refund Policy</CardTitle>
                    <CardDescription>Define the terms for refunds, returns, and reprints.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea 
                        value={content.refund} 
                        onChange={(e) => setContent(prev => ({...prev, refund: e.target.value}))}
                        rows={20}
                    />
                    <Button onClick={() => handleSave('refund')}>Save Changes</Button>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
