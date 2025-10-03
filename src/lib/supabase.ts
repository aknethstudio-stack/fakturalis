import type { Database } from '@/types/database';
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Singleton client instance for browser
let clientInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null;

// Client-side Supabase client (for use in components)
export const createClientSupabaseClient = () => {
  if (typeof window === 'undefined') {
    // Server-side: always create new instance
    return createClientComponentClient<Database>();
  }

  // Client-side: use singleton
  if (!clientInstance) {
    clientInstance = createClientComponentClient<Database>();
  }

  return clientInstance;
};

// Server-side Supabase client (for use in server components and API routes)
export const createServerSupabaseClient = async () => {
  const { cookies } = await import('next/headers');
  return createServerComponentClient<Database>({ cookies });
};

// Admin client (for server-side operations that need service role)
export const createAdminSupabaseClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('Missing Supabase service role key');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Default client for non-auth operations
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type SupabaseClient = ReturnType<typeof createClientSupabaseClient>;
