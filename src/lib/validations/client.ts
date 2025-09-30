import { z } from 'zod';

// Base client schema for form validation
export const clientSchema = z.object({
  name: z.string().min(1, 'Nazwa klienta jest wymagana').max(255, 'Nazwa nie może być dłuższa niż 255 znaków').trim(),

  vat_id: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        // Basic Polish NIP validation (10 digits)
        const nipRegex = /^\d{10}$|^\d{3}-\d{3}-\d{2}-\d{2}$|^\d{3}-\d{2}-\d{2}-\d{3}$/;
        return nipRegex.test(val.replace(/[-\s]/g, ''));
      },
      {
        message: 'Nieprawidłowy format NIP',
      },
    )
    .transform((val) => val?.replace(/[-\s]/g, '') || undefined),

  email: z
    .string()
    .email('Nieprawidłowy adres email')
    .max(255, 'Email nie może być dłuższy niż 255 znaków')
    .optional()
    .or(z.literal('')),

  phone: z
    .string()
    .max(50, 'Numer telefonu nie może być dłuższy niż 50 znaków')
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        // Basic phone validation - allow various formats
        const phoneRegex = /^[+]?[\s\d\-()]{7,}$/;
        return phoneRegex.test(val);
      },
      {
        message: 'Nieprawidłowy format numeru telefonu',
      },
    )
    .or(z.literal('')),

  address_line1: z.string().max(255, 'Adres nie może być dłuższy niż 255 znaków').optional().or(z.literal('')),

  address_line2: z.string().max(255, 'Adres nie może być dłuższy niż 255 znaków').optional().or(z.literal('')),

  postal_code: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        // Polish postal code format: XX-XXX
        const postalRegex = /^\d{2}-\d{3}$/;
        return postalRegex.test(val);
      },
      {
        message: 'Kod pocztowy powinien być w formacie XX-XXX',
      },
    )
    .or(z.literal('')),

  city: z.string().max(255, 'Miasto nie może być dłuższe niż 255 znaków').optional().or(z.literal('')),

  country_code: z.string().length(2, 'Kod kraju powinien mieć 2 znaki').optional().default('PL').or(z.literal('')),

  notes: z.string().max(1000, 'Notatki nie mogą być dłuższe niż 1000 znaków').optional().or(z.literal('')),
});

// Schema for updating client (all fields optional except id)
export const updateClientSchema = clientSchema.partial().extend({
  id: z.string().uuid('Nieprawidłowe ID klienta'),
});

// Schema for client search/filtering
export const clientSearchSchema = z.object({
  search: z.string().optional(),
  country_code: z.string().length(2).optional(),
  has_vat_id: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Type exports
export type ClientFormData = z.infer<typeof clientSchema>;
export type UpdateClientData = z.infer<typeof updateClientSchema>;
export type ClientSearchData = z.infer<typeof clientSearchSchema>;

// Utility functions
export const validateNIP = (nip: string): boolean => {
  if (!nip) return false;

  const cleanNip = nip.replace(/[-\s]/g, '');
  if (cleanNip.length !== 10) return false;

  // NIP checksum validation
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const digits = cleanNip.split('').map(Number);

  const sum = weights.reduce((acc, weight, index) => acc + weight * (digits[index] ?? 0), 0);
  const checksum = sum % 11;

  return checksum === digits[9];
};

export const formatNIP = (nip: string): string => {
  if (!nip) return '';
  const cleanNip = nip.replace(/[-\s]/g, '');
  if (cleanNip.length === 10) {
    return `${cleanNip.slice(0, 3)}-${cleanNip.slice(3, 6)}-${cleanNip.slice(6, 8)}-${cleanNip.slice(8)}`;
  }
  return nip;
};

export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  const cleanPhone = phone.replace(/[\s\-()]/g, '');

  // Polish mobile format
  if (cleanPhone.length === 9 && cleanPhone.match(/^[4-9]/)) {
    return `${cleanPhone.slice(0, 3)} ${cleanPhone.slice(3, 6)} ${cleanPhone.slice(6)}`;
  }

  // International format starting with +
  if (cleanPhone.startsWith('+')) {
    return cleanPhone;
  }

  return phone;
};
