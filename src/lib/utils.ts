import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and tailwind-merge
 *
 * @param inputs - Class names to combine
 * @returns Merged class string
 *
 * @example
 * cn('px-2 py-1', 'px-4') // 'py-1 px-4'
 * cn('text-red-500', isError && 'text-red-700') // 'text-red-700' if isError is true
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as currency (PLN)
 *
 * @param amount - Amount to format
 * @param currency - Currency code (default: 'PLN')
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(1234.56) // '1 234,56 zł'
 * formatCurrency(1000, 'EUR') // '1 000,00 €'
 */
export function formatCurrency(amount: number, currency: string = 'PLN'): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Formats a date according to Polish locale
 *
 * @param date - Date to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date()) // '12 stycznia 2025'
 * formatDate(new Date(), { dateStyle: 'short' }) // '12.01.2025'
 */
export function formatDate(date: Date | string, options: Intl.DateTimeFormatOptions = { dateStyle: 'long' }): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pl-PL', options).format(dateObj);
}

/**
 * Generates a random ID string
 *
 * @param length - Length of the ID (default: 8)
 * @returns Random ID string
 *
 * @example
 * generateId() // 'a1b2c3d4'
 * generateId(12) // 'a1b2c3d4e5f6'
 */
export function generateId(length: number = 8): string {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}

/**
 * Debounces a function call
 *
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 *
 * @example
 * const debouncedSearch = debounce((query) => search(query), 300);
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Validates Polish NIP (tax ID)
 *
 * @param nip - NIP to validate
 * @returns True if NIP is valid
 *
 * @example
 * validateNIP('123-456-78-90') // true
 * validateNIP('1234567890') // true
 * validateNIP('invalid') // false
 */
export function validateNIP(nip: string): boolean {
  // Remove spaces and hyphens
  const cleanNip = nip.replace(/[\s-]/g, '');

  // Check if it's exactly 10 digits
  if (!/^\d{10}$/.test(cleanNip)) {
    return false;
  }

  // Calculate checksum
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const digits = cleanNip.split('').map(Number);

  const sum = weights.reduce((acc, weight, index) => acc + weight * (digits[index] ?? 0), 0);
  const checksum = sum % 11;

  return checksum === (digits[9] ?? 0);
}

/**
 * Validates Polish REGON
 *
 * @param regon - REGON to validate
 * @returns True if REGON is valid
 */
export function validateREGON(regon: string): boolean {
  const cleanRegon = regon.replace(/\s/g, '');

  if (!/^\d{9}$/.test(cleanRegon) && !/^\d{14}$/.test(cleanRegon)) {
    return false;
  }

  const digits = cleanRegon.split('').map(Number);
  const weights = cleanRegon.length === 9 ? [8, 9, 2, 3, 4, 5, 6, 7] : [2, 4, 8, 5, 0, 9, 7, 3, 6, 1, 2, 4, 8];

  const sum = weights.reduce((acc, weight, index) => acc + weight * (digits[index] ?? 0), 0);
  const checksum = sum % 11;
  const expectedChecksum = checksum === 10 ? 0 : checksum;

  return expectedChecksum === (digits[digits.length - 1] ?? 0);
}

/**
 * Capitalizes the first letter of a string
 *
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncates a string to a maximum length
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add (default: '...')
 * @returns Truncated string
 */
export function truncate(str: string, maxLength: number, suffix: string = '...'): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}
