import type { Database } from '@/lib/supabase';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Handles Supabase auth callback
 * This route is called by Supabase after authentication actions like:
 * - Email confirmation
 * - Password reset
 * - OAuth login
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    try {
      // Exchange the auth code for a session
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      console.error('Error exchanging code for session:', error);
      // Redirect to login with error
      return NextResponse.redirect(new URL('/auth/login?error=auth_error', request.url));
    }
  }

  // Redirect to the home page or requested redirect URL
  const redirectTo = requestUrl.searchParams.get('redirect_to') || '/dashboard';
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
