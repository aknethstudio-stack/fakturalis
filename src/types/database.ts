// Database types for InvoiceForge
// These types correspond to the database schema defined in local-notes/data-model.md

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
        Relationships: [
          {
            foreignKeyName: 'clients_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'products_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      invoices: {
        Row: {
          id: string;
          owner_id: string;
          client_id: string;
          number: string;
          status: Database['public']['Enums']['invoice_status'];
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
          status?: Database['public']['Enums']['invoice_status'];
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
          status?: Database['public']['Enums']['invoice_status'];
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
        Relationships: [
          {
            foreignKeyName: 'invoices_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invoices_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'clients';
            referencedColumns: ['id'];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: 'invoice_items_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invoice_items_invoice_id_fkey';
            columns: ['invoice_id'];
            isOneToOne: false;
            referencedRelation: 'invoices';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invoice_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
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

// Convenience types for working with database records
export type Client = Database['public']['Tables']['clients']['Row'];
export type ClientInsert = Database['public']['Tables']['clients']['Insert'];
export type ClientUpdate = Database['public']['Tables']['clients']['Update'];

export type Product = Database['public']['Tables']['products']['Row'];
export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type ProductUpdate = Database['public']['Tables']['products']['Update'];

export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update'];

export type InvoiceItem = Database['public']['Tables']['invoice_items']['Row'];
export type InvoiceItemInsert = Database['public']['Tables']['invoice_items']['Insert'];
export type InvoiceItemUpdate = Database['public']['Tables']['invoice_items']['Update'];

export type InvoiceStatus = Database['public']['Enums']['invoice_status'];
export type PaymentStatus = Database['public']['Enums']['payment_status'];

// Extended types with relationships
export type InvoiceWithClient = Invoice & {
  client: Client;
};

export type InvoiceWithItems = Invoice & {
  invoice_items: InvoiceItem[];
};

export type InvoiceWithClientAndItems = Invoice & {
  client: Client;
  invoice_items: InvoiceItem[];
};

export type InvoiceItemWithProduct = InvoiceItem & {
  product: Product | null;
};

// Form types for creating/editing records
export interface ClientFormData {
  name: string;
  vat_id?: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  postal_code?: string;
  city?: string;
  country_code?: string;
  notes?: string;
}

export interface ProductFormData {
  name: string;
  sku?: string;
  unit: string;
  unit_price: number;
  vat_rate_default: number;
  currency: string;
  active: boolean;
  notes?: string;
}

export interface InvoiceFormData {
  client_id: string;
  number: string;
  issue_date: string;
  due_date: string;
  currency: string;
  notes?: string;
}

export interface InvoiceItemFormData {
  product_id?: string;
  name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  vat_rate: number;
}

// API response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Error types
export interface DatabaseError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}
