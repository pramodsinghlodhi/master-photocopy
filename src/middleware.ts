import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserFromFirebaseToken, getFirebaseTokenFromRequest, isAdmin } from '@/lib/firebase-auth-edge';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Define unprotected admin routes (setup and login)
  const adminUnprotectedPaths = ['/admin/setup', '/admin/login'];
  
  // Define protected routes
  const adminProtectedPaths = ['/admin'];
  const userProtectedPaths = ['/dashboard', '/orders', '/profile'];
  const authPaths = ['/login', '/register', '/auth'];
  
  // Agent route has its own authentication system (Agent ID/Password)
  const agentPaths = ['/agent'];
  
  // Check if this is an unprotected admin route
  const isAdminUnprotectedRoute = adminUnprotectedPaths.some(path => pathname.startsWith(path));
  
  // Skip middleware for unprotected admin routes
  if (isAdminUnprotectedRoute) {
    return NextResponse.next();
  }
  
  // Check if the route requires authentication
  const isAdminRoute = adminProtectedPaths.some(path => 
    pathname.startsWith(path) && !adminUnprotectedPaths.some(unprotected => pathname.startsWith(unprotected))
  );
  const isUserRoute = userProtectedPaths.some(path => pathname.startsWith(path));
  const isAuthRoute = authPaths.some(path => pathname.startsWith(path));
  const isAgentRoute = agentPaths.some(path => pathname.startsWith(path));
  
  // Agent routes have their own authentication system - skip Firebase auth
  if (isAgentRoute) {
    return NextResponse.next();
  }
  
  // Get user from Firebase token
  const firebaseToken = getFirebaseTokenFromRequest(request);
  const user = getUserFromFirebaseToken(firebaseToken);
  
  // Handle admin-protected routes
  if (isAdminRoute) {
    if (!user) {
      // Redirect to admin login if not authenticated
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    if (!isAdmin(user)) {
      // Redirect to unauthorized page if not admin
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    // Add admin headers for authenticated admin users
    const response = NextResponse.next();
    response.headers.set('x-admin-protected', 'true');
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-user-role', user.role || '');
    return response;
  }
  
  // Handle user-protected routes
  if (isUserRoute) {
    if (!user) {
      // Redirect to login if not authenticated
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Add user headers for authenticated users
    const response = NextResponse.next();
    response.headers.set('x-authenticated', 'true');
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-user-role', user.role || '');
    return response;
  }
  
  // Handle auth routes - redirect if already authenticated
  if (isAuthRoute && user) {
    if (isAdmin(user)) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  // Add user context to all requests if authenticated
  if (user) {
    const response = NextResponse.next();
    response.headers.set('x-authenticated', 'true');
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-user-role', user.role || '');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Admin routes
    '/admin/:path*',
    '/config/:path*',
    '/install/:path*',
    // User protected routes
    '/dashboard/:path*',
    '/orders/:path*',
    '/profile/:path*',
    '/agent/:path*',
    // Auth routes
    '/login',
    '/register',
    '/auth/:path*',
    // API routes - remove this to avoid middleware conflicts
    // '/api/:path*'
  ]
};
