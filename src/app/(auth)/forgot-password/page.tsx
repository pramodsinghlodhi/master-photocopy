'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';

export default function ForgotPasswordPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [email, setEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!isFirebaseConfigured || !auth) {
            toast({ title: "Firebase not configured", description: "Please configure Firebase in your .env file", variant: "destructive" });
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            toast({
                title: "Password Reset Email Sent",
                description: "If an account exists with that email, a reset link has been sent.",
            });
            router.push('/login');
        } catch (error: any) {
             toast({
                title: "Error Sending Email",
                description: error.message,
                variant: "destructive",
            });
        }
    };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Forgot Password?</CardTitle>
        <CardDescription>
          Enter your email and we'll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="name@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button type="submit" className="w-full">
            Send Reset Link
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Remember your password?{' '}
          <Link href="/login" className="underline">
            Login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
