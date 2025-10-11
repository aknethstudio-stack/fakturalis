import { z } from 'zod';

/**
 * Schema walidacji dla produktów/usług
 */
export const productSchema = z.object({
  name: z.string().min(1, 'Nazwa produktu jest wymagana').max(255, 'Nazwa nie może być dłuższa niż 255 znaków').trim(),

  sku: z
    .string()
    .max(50, 'SKU nie może być dłuższe niż 50 znaków')
    .optional()
    .transform((val) => val?.trim() || undefined),

  unit: z
    .string()
    .min(1, 'Jednostka miary jest wymagana')
    .max(10, 'Jednostka nie może być dłuższa niż 10 znaków')
    .default('szt'),

  unit_price: z
    .number()
    .min(0, 'Cena jednostkowa nie może być ujemna')
    .max(999999.9999, 'Cena jednostkowa jest zbyt wysoka')
    .default(0),

  vat_rate_default: z
    .number()
    .min(0, 'Stawka VAT nie może być ujemna')
    .max(1, 'Stawka VAT nie może być wyższa niż 100%')
    .default(0.23), // 23% domyślnie dla Polski

  currency: z
    .string()
    .length(3, 'Kod waluty musi mieć 3 znaki')
    .regex(/^[A-Z]{3}$/, 'Kod waluty musi składać się z wielkich liter')
    .default('PLN'),

  active: z.boolean().default(true),

  notes: z
    .string()
    .max(1000, 'Notatki nie mogą być dłuższe niż 1000 znaków')
    .optional()
    .transform((val) => val?.trim() || undefined),
});

/**
 * Schema dla aktualizacji produktu (wszystkie pola opcjonalne oprócz ID)
 */
export const updateProductSchema = productSchema.partial().extend({
  id: z.string().uuid('Nieprawidłowe ID produktu'),
});

/**
 * Schema dla wyszukiwania/filtrowania produktów
 */
export const productSearchSchema = z.object({
  search: z.string().optional(),
  active: z.boolean().optional(),
  currency: z.string().length(3).optional(),
  min_price: z.number().min(0).optional(),
  max_price: z.number().min(0).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Type exports
export type ProductFormData = z.infer<typeof productSchema>;
export type UpdateProductData = z.infer<typeof updateProductSchema>;
export type ProductSearchData = z.infer<typeof productSearchSchema>;

// Utility functions
export const formatPrice = (price: number, currency = 'PLN'): string => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency,
  }).format(price);
};

export const formatVATRate = (rate: number): string => {
  return `${Math.round(rate * 100)}%`;
};

export const parseVATRate = (percentage: string): number => {
  const numStr = percentage.replace('%', '').trim();
  const num = parseFloat(numStr);
  return isNaN(num) ? 0.23 : num / 100;
};

// Common VAT rates for Poland
export const POLISH_VAT_RATES = [
  { value: 0, label: '0%', description: 'Zwolniony z VAT' },
  { value: 0.05, label: '5%', description: 'Stawka obniżona' },
  { value: 0.08, label: '8%', description: 'Stawka obniżona' },
  { value: 0.23, label: '23%', description: 'Stawka podstawowa' },
] as const;

// Common units for Polish market
export const POLISH_UNITS = [
  { code: 'szt', name: 'sztuka', description: 'Jednostka podstawowa - sztuka' },
  { code: 'kg', name: 'kilogram', description: 'Kilogram' },
  { code: 'g', name: 'gram', description: 'Gram' },
  { code: 'm', name: 'metr', description: 'Metr' },
  { code: 'm2', name: 'metr kwadratowy', description: 'Metr kwadratowy' },
  { code: 'm3', name: 'metr sześcienny', description: 'Metr sześcienny' },
  { code: 'l', name: 'litr', description: 'Litr' },
  { code: 'godz', name: 'godzina', description: 'Godzina' },
  { code: 'usł', name: 'usługa', description: 'Usługa' },
  { code: 'komplet', name: 'komplet', description: 'Komplet' },
  { code: 'opak', name: 'opakowanie', description: 'Opakowanie' },
  { code: 'zest', name: 'zestaw', description: 'Zestaw' },
] as const;
