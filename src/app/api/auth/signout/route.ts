import type { Database } from '@/lib/supabase';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Handles user sign out
 * POST /api/auth/signout
 */
export async function POST() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

  try {
    // Sign out the user
    await supabase.auth.signOut();

    // Return success response
    return NextResponse.json({ message: 'Wylogowano pomyślnie' }, { status: 200 });
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json({ error: 'Błąd podczas wylogowywania' }, { status: 500 });
  }
}
