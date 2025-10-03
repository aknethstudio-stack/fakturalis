import { logger } from '@/lib/logger';
import type { Database } from '@/types/database';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
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
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      },
    );

    try {
      // Exchange the auth code for a session
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      logger.error('Error exchanging code for session', error, {
        endpoint: '/api/auth/callback',
        hasCode: !!code,
      });
      // Redirect to login with error
      return NextResponse.redirect(new URL('/auth/login?error=auth_error', request.url));
    }
  }

  // Redirect to the home page or requested redirect URL
  const redirectTo = requestUrl.searchParams.get('redirect_to') || '/dashboard';
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
