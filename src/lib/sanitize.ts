import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Server-side DOMPurify setup
const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * Sanityzuje HTML content usuwając potencjalnie niebezpieczne elementy
 * @param dirty - HTML do wyczyszczenia
 * @returns Bezpieczny HTML
 */
export function sanitizeHtml(dirty: string): string {
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Czyści tekst ze wszystkich tagów HTML
 * @param text - Tekst do wyczyszczenia
 * @returns Czysty tekst
 */
export function stripHtml(text: string): string {
  return purify.sanitize(text, { ALLOWED_TAGS: [], KEEP_CONTENT: true });
}

/**
 * Waliduje i sanityzuje dane wejściowe z formularzy
 * @param input - Obiekt z danymi do wyczyszczenia
 * @returns Wyczyszczone dane
 */
export function sanitizeFormData<T extends Record<string, unknown>>(input: T): T {
  const sanitized = {} as T;

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      // Pola które mogą zawierać HTML (komentarze, opisy)
      if (['description', 'comment', 'notes'].includes(key)) {
        sanitized[key as keyof T] = sanitizeHtml(value) as T[keyof T];
      } else {
        // Pozostałe pola tekstowe - usuń HTML
        sanitized[key as keyof T] = stripHtml(value) as T[keyof T];
      }
    } else {
      // Nie-tekstowe wartości przepisz bez zmian
      sanitized[key as keyof T] = value as T[keyof T];
    }
  }

  return sanitized;
}

/**
 * Waliduje dane fakturowe pod kątem XSS
 * @param invoiceData - Dane faktury
 * @returns Wyczyszczone dane faktury
 */
export function sanitizeInvoiceData(invoiceData: {
  client_name?: string;
  client_address?: string;
  description?: string;
  [key: string]: unknown;
}) {
  return {
    ...invoiceData,
    client_name: invoiceData.client_name ? stripHtml(invoiceData.client_name) : undefined,
    client_address: invoiceData.client_address ? stripHtml(invoiceData.client_address) : undefined,
    description: invoiceData.description ? sanitizeHtml(invoiceData.description) : undefined,
  };
}

/**
 * Waliduje dane klienta pod kątem XSS
 * @param clientData - Dane klienta
 * @returns Wyczyszczone dane klienta
 */
export function sanitizeClientData(clientData: {
  name?: string;
  address?: string;
  email?: string;
  phone?: string;
  notes?: string;
  [key: string]: unknown;
}) {
  return {
    ...clientData,
    name: clientData.name ? stripHtml(clientData.name) : undefined,
    address: clientData.address ? stripHtml(clientData.address) : undefined,
    email: clientData.email ? stripHtml(clientData.email) : undefined,
    phone: clientData.phone ? stripHtml(clientData.phone) : undefined,
    notes: clientData.notes ? sanitizeHtml(clientData.notes) : undefined,
  };
}
