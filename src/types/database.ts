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
          ksef_id: string | null;
          ksef_status: Database['public']['Enums']['ksef_submission_status'];
          ksef_reference_number: string | null;
          ksef_submission_id: string | null;
          ksef_submitted_at: string | null;
          ksef_upo_number: string | null;
          ksef_processing_code: string | null;
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
          ksef_id?: string | null;
          ksef_status?: Database['public']['Enums']['ksef_submission_status'];
          ksef_reference_number?: string | null;
          ksef_submission_id?: string | null;
          ksef_submitted_at?: string | null;
          ksef_upo_number?: string | null;
          ksef_processing_code?: string | null;
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
          ksef_id?: string | null;
          ksef_status?: Database['public']['Enums']['ksef_submission_status'];
          ksef_reference_number?: string | null;
          ksef_submission_id?: string | null;
          ksef_submitted_at?: string | null;
          ksef_upo_number?: string | null;
          ksef_processing_code?: string | null;
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
      ksef_submissions: {
        Row: {
          id: string;
          owner_id: string;
          invoice_id: string;
          submission_id: string;
          reference_number: string | null;
          status: Database['public']['Enums']['ksef_submission_status'];
          xml_content: string | null;
          xml_hash: string | null;
          response_data: Record<string, unknown> | null;
          error_message: string | null;
          error_code: string | null;
          processing_code: string | null;
          processing_description: string | null;
          upo_number: string | null;
          upo_content: string | null;
          acquisition_timestamp: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          invoice_id: string;
          submission_id: string;
          reference_number?: string | null;
          status?: Database['public']['Enums']['ksef_submission_status'];
          xml_content?: string | null;
          xml_hash?: string | null;
          response_data?: Record<string, unknown> | null;
          error_message?: string | null;
          error_code?: string | null;
          processing_code?: string | null;
          processing_description?: string | null;
          upo_number?: string | null;
          upo_content?: string | null;
          acquisition_timestamp?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          invoice_id?: string;
          submission_id?: string;
          reference_number?: string | null;
          status?: Database['public']['Enums']['ksef_submission_status'];
          xml_content?: string | null;
          xml_hash?: string | null;
          response_data?: Record<string, unknown> | null;
          error_message?: string | null;
          error_code?: string | null;
          processing_code?: string | null;
          processing_description?: string | null;
          upo_number?: string | null;
          upo_content?: string | null;
          acquisition_timestamp?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ksef_submissions_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ksef_submissions_invoice_id_fkey';
            columns: ['invoice_id'];
            isOneToOne: false;
            referencedRelation: 'invoices';
            referencedColumns: ['id'];
          },
        ];
      };
      ksef_sessions: {
        Row: {
          id: string;
          owner_id: string;
          session_id: string;
          session_token: string;
          expires_at: string;
          environment: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          session_id: string;
          session_token: string;
          expires_at: string;
          environment?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          session_id?: string;
          session_token?: string;
          expires_at?: string;
          environment?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ksef_sessions_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      ksef_config: {
        Row: {
          id: string;
          owner_id: string;
          environment: string;
          certificate_content: string | null;
          certificate_password: string | null;
          identifier: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          environment?: string;
          certificate_content?: string | null;
          certificate_password?: string | null;
          identifier?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          environment?: string;
          certificate_content?: string | null;
          certificate_password?: string | null;
          identifier?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ksef_config_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      invoices_with_ksef: {
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
          ksef_id: string | null;
          ksef_status: Database['public']['Enums']['ksef_submission_status'];
          ksef_reference_number: string | null;
          ksef_submission_id: string | null;
          ksef_submitted_at: string | null;
          ksef_upo_number: string | null;
          ksef_processing_code: string | null;
          created_at: string;
          updated_at: string;
          latest_submission_id: string | null;
          latest_response_data: Record<string, unknown> | null;
          latest_error_message: string | null;
          latest_acquisition_timestamp: string | null;
          latest_upo_number: string | null;
        };
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      invoice_status: 'draft' | 'issued' | 'sent' | 'paid' | 'overdue' | 'voided' | 'cancelled';
      payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
      ksef_submission_status: 'not_sent' | 'pending' | 'accepted' | 'rejected' | 'error';
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
export type KSeFSubmissionStatus = Database['public']['Enums']['ksef_submission_status'];

export type KSeFSubmission = Database['public']['Tables']['ksef_submissions']['Row'];
export type KSeFSubmissionInsert = Database['public']['Tables']['ksef_submissions']['Insert'];
export type KSeFSubmissionUpdate = Database['public']['Tables']['ksef_submissions']['Update'];

export type KSeFSession = Database['public']['Tables']['ksef_sessions']['Row'];
export type KSeFSessionInsert = Database['public']['Tables']['ksef_sessions']['Insert'];
export type KSeFSessionUpdate = Database['public']['Tables']['ksef_sessions']['Update'];

export type KSeFConfig = Database['public']['Tables']['ksef_config']['Row'];
export type KSeFConfigInsert = Database['public']['Tables']['ksef_config']['Insert'];
export type KSeFConfigUpdate = Database['public']['Tables']['ksef_config']['Update'];

export type InvoiceWithKSeF = Database['public']['Views']['invoices_with_ksef']['Row'];

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
