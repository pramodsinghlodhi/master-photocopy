'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export function LoginForm() {
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    
    const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
        const result = await login(values.email, values.password);
        
        if (result.success) {
            toast({
                title: "Login Successful",
                description: "Welcome back!",
            });
            
            // Redirect based on the current path or user role
            const searchParams = new URLSearchParams(window.location.search);
            const redirectTo = searchParams.get('redirect');
            
            if (redirectTo) {
                router.push(redirectTo);
            } else if (pathname.includes('/admin')) {
                router.push('/admin/dashboard');
            } else {
                router.push('/dashboard');
            }
        } else {
            toast({
                title: "Login Failed",
                description: result.error || "Invalid credentials",
                variant: "destructive",
            });
        }
    } catch (error: any) {
        toast({
            title: "Login Failed",
            description: "An unexpected error occurred",
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  placeholder="name@example.com" 
                  {...field} 
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
                <div className="flex items-center">
                    <FormLabel>Password</FormLabel>
                    {!pathname.includes('/admin') && (
                        <Link href="/forgot-password" className="ml-auto inline-block text-sm underline">
                            Forgot your password?
                        </Link>
                    )}
                </div>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  {...field} 
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
    </Form>
  );
}
