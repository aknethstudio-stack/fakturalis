import { logger } from '@/lib/logger';
import { createRateLimitMiddleware } from '@/lib/rate-limit';
import type { Database } from '@/types/database';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Rate limit middleware
const rateLimitMiddleware = createRateLimitMiddleware('auth');

/**
 * Handles user sign out
 * POST /api/auth/signout
 */
export async function POST(request: Request) {
  // Check rate limit
  const rateLimitResponse = await rateLimitMiddleware(request);
  if (rateLimitResponse) return rateLimitResponse;
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
    // Sign out the user
    await supabase.auth.signOut();

    // Return success response
    return NextResponse.json({ message: 'Wylogowano pomyślnie' }, { status: 200 });
  } catch (error) {
    logger.error('Sign out error', error, { endpoint: '/api/auth/signout' });
    return NextResponse.json({ error: 'Błąd podczas wylogowywania' }, { status: 500 });
  }
}
