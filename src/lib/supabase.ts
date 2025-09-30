import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

// Types for our database schema
export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          vat_id: string | null;
          email: string | null;
          phone: string | null;
          address_line1: string | null;
          address_line2: string | null;
          postal_code: string | null;
          city: string | null;
          country_code: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          vat_id?: string | null;
          email?: string | null;
          phone?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          postal_code?: string | null;
          city?: string | null;
          country_code?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          vat_id?: string | null;
          email?: string | null;
          phone?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          postal_code?: string | null;
          city?: string | null;
          country_code?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          sku: string | null;
          unit: string;
          unit_price: number;
          vat_rate_default: number;
          currency: string;
          active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          sku?: string | null;
          unit?: string;
          unit_price?: number;
          vat_rate_default?: number;
          currency?: string;
          active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          sku?: string | null;
          unit?: string;
          unit_price?: number;
          vat_rate_default?: number;
          currency?: string;
          active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          owner_id: string;
          client_id: string;
          number: string;
          status: 'draft' | 'issued' | 'sent' | 'paid' | 'overdue' | 'voided' | 'cancelled';
          issue_date: string;
          due_date: string;
          currency: string;
          subtotal_net: number;
          total_vat: number;
          total_gross: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          client_id: string;
          number: string;
          status?: 'draft' | 'issued' | 'sent' | 'paid' | 'overdue' | 'voided' | 'cancelled';
          issue_date?: string;
          due_date: string;
          currency?: string;
          subtotal_net?: number;
          total_vat?: number;
          total_gross?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          client_id?: string;
          number?: string;
          status?: 'draft' | 'issued' | 'sent' | 'paid' | 'overdue' | 'voided' | 'cancelled';
          issue_date?: string;
          due_date?: string;
          currency?: string;
          subtotal_net?: number;
          total_vat?: number;
          total_gross?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      invoice_items: {
        Row: {
          id: string;
          owner_id: string;
          invoice_id: string;
          product_id: string | null;
          name: string;
          quantity: number;
          unit: string;
          unit_price: number;
          vat_rate: number;
          line_net: number;
          line_vat: number;
          line_gross: number;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          invoice_id: string;
          product_id?: string | null;
          name: string;
          quantity?: number;
          unit?: string;
          unit_price?: number;
          vat_rate?: number;
          line_net?: number;
          line_vat?: number;
          line_gross?: number;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          invoice_id?: string;
          product_id?: string | null;
          name?: string;
          quantity?: number;
          unit?: string;
          unit_price?: number;
          vat_rate?: number;
          line_net?: number;
          line_vat?: number;
          line_gross?: number;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      invoice_status: 'draft' | 'issued' | 'sent' | 'paid' | 'overdue' | 'voided' | 'cancelled';
      payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client-side Supabase client (for use in components)
export const createClientSupabaseClient = () => createClientComponentClient<Database>();

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
