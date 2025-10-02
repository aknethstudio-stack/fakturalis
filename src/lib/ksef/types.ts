/**
 * KSeF API types and interfaces
 * TypeScript definitions for Polish National e-Invoice System
 */

// Authentication types
export interface KSeFSessionToken {
  token: string;
  expiresAt: Date;
  sessionId: string;
}

export interface KSeFAuthRequest {
  challenge: string;
  identifier: string;
}

// Invoice submission types
export interface KSeFInvoiceSubmission {
  submissionId: string;
  referenceNumber: string;
  processingCode: number;
  timestamp: string;
}

export interface KSeFSubmissionStatus {
  invoiceStatus: 'accepted' | 'rejected' | 'processing';
  acquisitionTimestamp?: string;
  processingCode?: number;
  processingDescription?: string;
  upoNumber?: string;
}

export type KSeFSubmissionStatusType = 'not_sent' | 'pending' | 'accepted' | 'rejected' | 'error';

// UPO (Urzędowe Potwierdzenie Odbioru) types
export interface KSeFUPO {
  referenceNumber: string;
  timestamp: string;
  upoContent: string; // Base64 encoded XML
}

// Error handling
export interface KSeFError {
  code: string;
  message: string;
  timestamp: string;
  details?: string;
}

export interface KSeFApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: KSeFError;
}

// XML generation types
export interface KSeFInvoiceXML {
  invoiceHeader: {
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    currencyCode: string;
  };
  seller: {
    name: string;
    vatId: string;
    address: string;
  };
  buyer: {
    name: string;
    vatId?: string;
    address: string;
  };
  invoiceLines: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    netAmount: number;
    vatAmount: number;
    grossAmount: number;
  }>;
  totals: {
    netTotal: number;
    vatTotal: number;
    grossTotal: number;
  };
}
