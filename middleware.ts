import type { Database } from '@/lib/supabase';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Middleware for authentication and route protection
 * Handles auth state and redirects based on user authentication status
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Create Supabase client for middleware
  const supabase = createMiddlewareClient<Database>({ req, res });

  // Get current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Define route patterns
  const isAuthRoute = pathname.startsWith('/auth');
  const isPublicRoute = pathname === '/' || pathname.startsWith('/public');
  const isApiRoute = pathname.startsWith('/api');

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/invoices', '/clients', '/products', '/settings'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // Handle auth routes when user is already logged in
  if (isAuthRoute && session) {
    const redirectTo = req.nextUrl.searchParams.get('redirectTo') || '/dashboard';
    return NextResponse.redirect(new URL(redirectTo, req.url));
  }

  // Handle protected routes when user is not logged in
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth/login', req.url);
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Handle root route - redirect based on auth status
  if (pathname === '/' && !isPublicRoute) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    } else {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
  }

  // Skip middleware for API routes (except auth callbacks)
  if (isApiRoute && !pathname.startsWith('/api/auth')) {
    return res;
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
