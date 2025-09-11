'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, AlertTriangle, ArrowLeft } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  fallbackMessage?: string;
}

export function AdminProtectedRoute({ 
  children, 
  fallbackMessage = "This page requires administrator privileges to access." 
}: AdminProtectedRouteProps) {
  const { user, isAdmin, loading, error } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // User is not authenticated, redirect to login
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
    }
  }, [user, loading, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600 animate-pulse" />
            </div>
            <CardTitle>Verifying Access</CardTitle>
            <CardDescription>Checking your administrator privileges...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Authentication Error</CardTitle>
            <CardDescription>There was an error verifying your access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-red-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error.message || 'Unable to verify your authentication status. Please try again.'}
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()} className="flex-1">
                Try Again
              </Button>
              <Button variant="outline" onClick={() => router.push('/')} className="flex-1">
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-yellow-200">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Lock className="h-6 w-6 text-yellow-600" />
            </div>
            <CardTitle className="text-yellow-600">Authentication Required</CardTitle>
            <CardDescription>Please sign in to access this page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-yellow-200">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                You need to be signed in to access administrator pages.
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button asChild className="flex-1">
                <a href={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}>
                  Sign In
                </a>
              </Button>
              <Button variant="outline" onClick={() => router.push('/')} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User authenticated but not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>Administrator privileges required</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-red-200">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                {fallbackMessage}
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 text-center">
                Signed in as: <strong>{user.email}</strong>
              </p>
              <p className="text-xs text-gray-500 text-center">
                Contact your administrator if you believe this is an error.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push('/dashboard')} className="flex-1">
                Go to Dashboard
              </Button>
              <Button variant="outline" onClick={() => router.push('/')} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated and is admin - render the protected content
  return <>{children}</>;
}
