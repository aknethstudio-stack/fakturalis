import type { SupabaseClient } from '@/lib/supabase';
import { createClientSupabaseClient } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

export function useSupabase() {
  const [supabase] = useState(() => createClientSupabaseClient());

  return supabase;
}

export function useUser() {
  const supabase = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return {
    user,
    session,
    loading,
    supabase,
  };
}

export function useAuth() {
  const { user, session, loading, supabase } = useUser();

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const signInWithEmail = async (email: string, password: string, options?: { captchaToken?: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      ...(options?.captchaToken && {
        options: {
          captchaToken: options.captchaToken,
        },
      }),
    });
    if (error) throw error;
    return data;
  };

  const signUpWithEmail = async (email: string, password: string, options?: { captchaToken?: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      ...(options?.captchaToken && {
        options: {
          captchaToken: options.captchaToken,
        },
      }),
    });
    if (error) throw error;
    return data;
  };

  const resetPassword = async (email: string, options?: { captchaToken?: string }) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
      ...(options?.captchaToken && {
        captchaToken: options.captchaToken,
      }),
    });
    if (error) throw error;
  };

  return {
    user,
    session,
    loading,
    signOut,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    isAuthenticated: !!user,
  };
}

// Hook for database operations
export function useSupabaseQuery<T = unknown>(
  tableName: string,
  query?: (supabase: SupabaseClient) => Promise<{ data: T | null; error: Error | null }>,
) {
  const supabase = useSupabase();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await query(supabase);
        if (error) throw error;
        setData(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, query]);

  const refetch = async () => {
    if (!query) return;

    try {
      setLoading(true);
      setError(null);
      const { data, error } = await query(supabase);
      if (error) throw error;
      setData(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}

// Real-time subscription hook
export function useSupabaseSubscription<T = unknown>(
  tableName: string,
  filter?: string,
  callback?: (payload: unknown) => void,
) {
  const supabase = useSupabase();
  const [data, setData] = useState<T[]>([]);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    const setupSubscription = () => {
      const query = supabase.channel(`${tableName}_changes`).on(
        'postgres_changes' as never,
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: filter,
        },
        (payload: unknown) => {
          if (callback) {
            callback(payload);
          }

          // Update local data based on event type
          const typedPayload = payload as {
            eventType: string;
            new?: T & { id: string };
            old?: { id: string };
          };

          switch (typedPayload.eventType) {
            case 'INSERT':
              if (typedPayload.new) {
                setData((prev) => [...prev, typedPayload.new as T]);
              }
              break;
            case 'UPDATE':
              if (typedPayload.new) {
                setData((prev) =>
                  prev.map((item) =>
                    (item as { id: string }).id === typedPayload.new?.id ? (typedPayload.new as T) : item,
                  ),
                );
              }
              break;
            case 'DELETE':
              if (typedPayload.old) {
                setData((prev) => prev.filter((item) => (item as { id: string }).id !== typedPayload.old?.id));
              }
              break;
          }
        },
      );

      subscription = query.subscribe();
    };

    setupSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [supabase, tableName, filter, callback]);

  return { data };
}
