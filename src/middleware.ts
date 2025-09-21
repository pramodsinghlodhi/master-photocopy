import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the request is for admin-protected routes
  const adminProtectedPaths = ['/admin', '/config', '/install'];
  const pathname = request.nextUrl.pathname;
  
  if (adminProtectedPaths.some(path => pathname.startsWith(path))) {
    // Add a header to indicate this is an admin-protected route
    const response = NextResponse.next();
    response.headers.set('x-admin-protected', 'true');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/config/:path*',
    '/install/:path*'
  ]
};
