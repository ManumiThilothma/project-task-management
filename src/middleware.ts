import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public paths that don't require auth
  const isPublicPage = pathname === '/login' || pathname === '/register';
  const isPublicApi = pathname === '/api/auth/login' || pathname === '/api/auth/register';

  // Read token from cookies
  const token = request.cookies.get('token')?.value;

  // Verify token
  const payload = token ? await verifyToken(token) : null;

  // Handle API route authentication
  if (pathname.startsWith('/api')) {
    if (isPublicApi) {
      return NextResponse.next();
    }

    if (!payload) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized: Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Role-based guard for API endpoints
    if (pathname.startsWith('/api/users') && payload.role !== 'ADMIN') {
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If verified, proceed and append user info in headers for route handlers
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.userId);
    response.headers.set('x-user-email', payload.email);
    response.headers.set('x-user-role', payload.role);
    return response;
  }

  // Handle Pages authentication
  if (!payload) {
    // If not authenticated and not on a public page, redirect to login
    if (!isPublicPage && pathname !== '/') {
      const loginUrl = new URL('/login', request.url);
      // Optional: keep track of original redirect
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  } else {
    // If authenticated:
    // 1. Redirect public pages to dashboard
    if (isPublicPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 2. Protect Admin page
    if (pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // 3. Root page redirects to dashboard
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

// Config to match routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
