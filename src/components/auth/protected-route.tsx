'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
  fallback?: ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false, 
  redirectTo,
  fallback 
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Still checking auth state

    if (!isAuthenticated) {
      // Not authenticated - redirect to login
      const loginPath = requireAdmin ? '/admin/login' : '/login';
      const redirectPath = redirectTo || (typeof window !== 'undefined' ? window.location.pathname : '/');
      router.push(`${loginPath}?redirect=${encodeURIComponent(redirectPath)}`);
      return;
    }

    if (requireAdmin && !isAdmin) {
      // Authenticated but not admin - redirect to unauthorized or dashboard
      router.push('/unauthorized');
      return;
    }
  }, [loading, isAuthenticated, isAdmin, requireAdmin, redirectTo, router]);

  if (loading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner className="h-8 w-8" />
        <span className="ml-2">Checking authentication...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Admin privileges required</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Higher-order component for protecting pages
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: { requireAdmin?: boolean; redirectTo?: string } = {}
) {
  const AuthenticatedComponent = (props: P) => {
    return (
      <ProtectedRoute 
        requireAdmin={options.requireAdmin} 
        redirectTo={options.redirectTo}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };

  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return AuthenticatedComponent;
}

// Admin-only wrapper
export function AdminRoute({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ProtectedRoute requireAdmin={true} fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}

// User route wrapper (any authenticated user)
export function UserRoute({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ProtectedRoute requireAdmin={false} fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}