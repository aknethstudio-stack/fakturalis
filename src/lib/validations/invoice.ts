import { z } from 'zod';

/**
 * Polish VAT rates as constants for validation
 */
export const VAT_RATES = [0, 5, 8, 23] as const;

/**
 * KSeF payment methods enum
 */
export const PAYMENT_METHODS = ['TRANSFER', 'CASH', 'CARD', 'BLIK', 'PAYPAL', 'CHECK', 'OTHER'] as const;

/**
 * Invoice status enum
 */
export const INVOICE_STATUS = ['DRAFT', 'ISSUED', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'] as const;

/**
 * KSeF status enum
 */
export const KSEF_STATUS = ['NOT_SENT', 'PENDING', 'ACCEPTED', 'REJECTED', 'ERROR'] as const;

/**
 * Invoice item validation schema
 */
export const invoiceItemSchema = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  name: z
    .string()
    .trim()
    .min(1, 'Nazwa pozycji jest wymagana')
    .max(255, 'Nazwa pozycji może mieć maksymalnie 255 znaków'),
  description: z.string().trim().max(1000, 'Opis może mieć maksymalnie 1000 znaków').optional(),
  quantity: z
    .number()
    .positive('Ilość musi być dodatnia')
    .min(0.01, 'Minimalna ilość to 0.01')
    .max(999999.99, 'Maksymalna ilość to 999999.99'),
  unit: z.string().trim().min(1, 'Jednostka jest wymagana').max(10, 'Jednostka może mieć maksymalnie 10 znaków'),
  unit_price_net: z
    .number()
    .nonnegative('Cena netto nie może być ujemna')
    .max(9999999.99, 'Maksymalna cena netto to 9999999.99'),
  vat_rate: z.number().refine((val) => VAT_RATES.includes(val as (typeof VAT_RATES)[number]), {
    message: 'Nieprawidłowa stawka VAT. Dozwolone: 0%, 5%, 8%, 23%',
  }),
  net_amount: z
    .number()
    .nonnegative('Kwota netto nie może być ujemna')
    .max(99999999.99, 'Maksymalna kwota netto to 99999999.99'),
  vat_amount: z
    .number()
    .nonnegative('Kwota VAT nie może być ujemna')
    .max(99999999.99, 'Maksymalna kwota VAT to 99999999.99'),
  gross_amount: z
    .number()
    .nonnegative('Kwota brutto nie może być ujemna')
    .max(99999999.99, 'Maksymalna kwota brutto to 99999999.99'),
});

/**
 * Invoice creation/update schema
 */
export const invoiceSchema = z
  .object({
    client_id: z.string().uuid('Nieprawidłowy identyfikator klienta'),
    invoice_number: z
      .string()
      .trim()
      .min(1, 'Numer faktury jest wymagany')
      .max(50, 'Numer faktury może mieć maksymalnie 50 znaków')
      .regex(/^[A-Z0-9/-]+$/, 'Numer faktury może zawierać tylko wielkie litery, cyfry, "/" i "-"'),
    issue_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data wystawienia musi być w formacie YYYY-MM-DD')
      .refine((date) => {
        const parsed = new Date(date);
        const now = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        return parsed >= oneYearAgo && parsed <= now;
      }, 'Data wystawienia musi być z ostatniego roku i nie może być z przyszłości'),
    sale_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data sprzedaży musi być w formacie YYYY-MM-DD')
      .optional(),
    due_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Termin płatności musi być w formacie YYYY-MM-DD')
      .refine((date) => {
        const parsed = new Date(date);
        const now = new Date();
        return parsed >= now;
      }, 'Termin płatności nie może być wcześniejszy niż dzisiaj'),
    payment_method: z.enum(PAYMENT_METHODS, {
      message: 'Nieprawidłowa forma płatności',
    }),
    payment_terms: z.string().trim().max(500, 'Warunki płatności mogą mieć maksymalnie 500 znaków').optional(),
    currency: z.string().length(3, 'Kod waluty musi mieć 3 znaki'),
    exchange_rate: z.number().positive('Kurs wymiany musi być dodatni'),
    notes: z.string().trim().max(2000, 'Uwagi mogą mieć maksymalnie 2000 znaków').optional(),
    status: z.enum(INVOICE_STATUS, {
      message: 'Nieprawidłowy status faktury',
    }),

    // KSeF related fields
    ksef_status: z.enum(KSEF_STATUS, {
      message: 'Nieprawidłowy status KSeF',
    }),
    ksef_reference_number: z.string().optional(),

    // Invoice items
    items: z
      .array(invoiceItemSchema)
      .min(1, 'Faktura musi zawierać co najmniej jedną pozycję')
      .max(200, 'Faktura może zawierać maksymalnie 200 pozycji')
      .refine((items) => {
        const uniqueNames = new Set(items.map((item) => item.name.toLowerCase()));
        return uniqueNames.size === items.length;
      }, 'Nazwy pozycji muszą być unikalne'),

    // Calculated totals (will be validated against items)
    total_net: z
      .number()
      .nonnegative('Suma netto nie może być ujemna')
      .max(999999999.99, 'Maksymalna suma netto to 999999999.99'),
    total_vat: z
      .number()
      .nonnegative('Suma VAT nie może być ujemna')
      .max(999999999.99, 'Maksymalna suma VAT to 999999999.99'),
    total_gross: z
      .number()
      .nonnegative('Suma brutto nie może być ujemna')
      .max(999999999.99, 'Maksymalna suma brutto to 999999999.99'),
  })
  .refine(
    (data) => {
      // Validate that sale_date is not later than issue_date
      if (data.sale_date) {
        const saleDate = new Date(data.sale_date);
        const issueDate = new Date(data.issue_date);
        return saleDate <= issueDate;
      }
      return true;
    },
    {
      message: 'Data sprzedaży nie może być późniejsza niż data wystawienia',
      path: ['sale_date'],
    },
  )
  .refine(
    (data) => {
      // Validate that due_date is after issue_date
      const dueDate = new Date(data.due_date);
      const issueDate = new Date(data.issue_date);
      return dueDate >= issueDate;
    },
    {
      message: 'Termin płatności nie może być wcześniejszy niż data wystawienia',
      path: ['due_date'],
    },
  )
  .refine(
    (data) => {
      // Validate calculated totals against items
      const calculatedNet = data.items.reduce((sum, item) => sum + item.net_amount, 0);
      const calculatedVat = data.items.reduce((sum, item) => sum + item.vat_amount, 0);
      const calculatedGross = data.items.reduce((sum, item) => sum + item.gross_amount, 0);

      const tolerance = 0.01; // 1 grosz tolerance for rounding

      return (
        Math.abs(calculatedNet - data.total_net) <= tolerance &&
        Math.abs(calculatedVat - data.total_vat) <= tolerance &&
        Math.abs(calculatedGross - data.total_gross) <= tolerance
      );
    },
    {
      message: 'Sumy faktur nie zgadzają się z pozycjami faktury',
      path: ['total_gross'],
    },
  )
  .refine(
    (data) => {
      // Validate each item's calculations
      return data.items.every((item) => {
        const expectedNet = Math.round(item.quantity * item.unit_price_net * 100) / 100;
        const expectedVat = Math.round(expectedNet * (item.vat_rate / 100) * 100) / 100;
        const expectedGross = Math.round((expectedNet + expectedVat) * 100) / 100;

        const tolerance = 0.01;

        return (
          Math.abs(item.net_amount - expectedNet) <= tolerance &&
          Math.abs(item.vat_amount - expectedVat) <= tolerance &&
          Math.abs(item.gross_amount - expectedGross) <= tolerance
        );
      });
    },
    {
      message: 'Nieprawidłowe obliczenia w pozycjach faktury',
      path: ['items'],
    },
  );

/**
 * Schema for invoice search and filtering
 */
export const invoiceSearchSchema = z
  .object({
    query: z.string().trim().optional(),
    client_id: z.string().uuid().optional(),
    status: z.enum(INVOICE_STATUS).optional(),
    ksef_status: z.enum(KSEF_STATUS).optional(),
    date_from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    date_to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    amount_from: z.number().nonnegative().optional(),
    amount_to: z.number().nonnegative().optional(),
    page: z.number().int().positive(),
    limit: z.number().int().min(1).max(100),
  })
  .refine(
    (data) => {
      if (data.date_from && data.date_to) {
        return new Date(data.date_from) <= new Date(data.date_to);
      }
      return true;
    },
    {
      message: 'Data końcowa musi być późniejsza niż data początkowa',
      path: ['date_to'],
    },
  )
  .refine(
    (data) => {
      if (data.amount_from && data.amount_to) {
        return data.amount_from <= data.amount_to;
      }
      return true;
    },
    {
      message: 'Kwota końcowa musi być większa niż kwota początkowa',
      path: ['amount_to'],
    },
  );

/**
 * Schema for KSeF submission
 */
export const ksefSubmissionSchema = z.object({
  invoice_id: z.string().uuid('Nieprawidłowy identyfikator faktury'),
  environment: z.enum(['TEST', 'PROD']),
  force_resend: z.boolean(),
});

/**
 * Type exports for use in components
 */
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;
export type Invoice = z.infer<typeof invoiceSchema>;
export type InvoiceSearch = z.infer<typeof invoiceSearchSchema>;
export type KSeFSubmission = z.infer<typeof ksefSubmissionSchema>;

/**
 * Default invoice item for form initialization
 */
export const defaultInvoiceItem: Partial<InvoiceItem> = {
  quantity: 1,
  unit: 'szt.',
  vat_rate: 23,
  unit_price_net: 0,
  net_amount: 0,
  vat_amount: 0,
  gross_amount: 0,
};

/**
 * Utility function to calculate invoice item amounts
 */
export function calculateInvoiceItemAmounts(
  quantity: number,
  unitPriceNet: number,
  vatRate: number,
): { netAmount: number; vatAmount: number; grossAmount: number } {
  const netAmount = Math.round(quantity * unitPriceNet * 100) / 100;
  const vatAmount = Math.round(netAmount * (vatRate / 100) * 100) / 100;
  const grossAmount = Math.round((netAmount + vatAmount) * 100) / 100;

  return {
    netAmount,
    vatAmount,
    grossAmount,
  };
}

/**
 * Utility function to calculate invoice totals
 */
export function calculateInvoiceTotals(items: InvoiceItem[]): {
  totalNet: number;
  totalVat: number;
  totalGross: number;
} {
  const totalNet = Math.round(items.reduce((sum, item) => sum + item.net_amount, 0) * 100) / 100;
  const totalVat = Math.round(items.reduce((sum, item) => sum + item.vat_amount, 0) * 100) / 100;
  const totalGross = Math.round(items.reduce((sum, item) => sum + item.gross_amount, 0) * 100) / 100;

  return {
    totalNet,
    totalVat,
    totalGross,
  };
}
