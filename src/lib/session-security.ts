/**
 * Konfiguracja bezpieczeństwa sesji dla Supabase Auth
 * Dokumentacja najlepszych praktyk dla aplikacji fakturującej
 */

/**
 * Zalecane ustawienia bezpieczeństwa w Supabase Dashboard:
 *
 * 1. Auth Settings → General:
 *    - Site URL: https://yourdomain.com (tylko produkcyjny URL)
 *    - JWT expiry: 3600 (1 godzina zamiast domyślnych 24h)
 *    - Refresh token rotation: ENABLED
 *    - Additional redirect URLs: tylko zweryfikowane domeny
 *
 * 2. Auth Settings → Security:
 *    - Enable email confirmations: TRUE
 *    - Secure email change: TRUE (wymagaj potwierdzenia z obu adresów)
 *    - Double opt-in for email changes: TRUE
 *
 * 3. Auth Settings → Rate Limits:
 *    - Per hour per IP: 30 (domyślnie 300)
 *    - Per hour per user: 10 (domyślnie 100)
 *
 * 4. Database → RLS Policies:
 *    - Wszystkie tabele: owner_id = auth.uid()
 *    - Dodatkowe polityki dla audit_logs
 */

import { getEnvironment, isProduction } from './env';

/**
 * Konfiguracja bezpiecznych ciasteczek dla sesji
 */
export const cookieConfig = {
  // Nazwa ciasteczka dla sesji
  sessionCookie: 'sb-session',

  // Ustawienia bezpieczeństwa
  secure: isProduction(), // HTTPS tylko w produkcji
  httpOnly: true, // Nie dostępne z JavaScript
  sameSite: 'lax' as const, // CSRF protection

  // Czas życia sesji
  maxAge: 60 * 60, // 1 godzina (w sekundach)

  // Path i domain
  path: '/',
  domain: isProduction() ? getEnvironment().NEXT_PUBLIC_APP_URL?.replace('https://', '') : undefined,
};

/**
 * Timeout dla sesji nieaktywnych (w milisekundach)
 * Po tym czasie użytkownik zostanie automatycznie wylogowany
 */
export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minut

/**
 * Maksymalna liczba równoczesnych sesji na użytkownika
 * W aplikacji fakturującej zalecamy ograniczenie do 2-3 sesji
 */
export const MAX_CONCURRENT_SESSIONS = 3;

/**
 * Lista zaufanych zakresów IP - obecnie pusta, można konfigurować według potrzeb
 */
export const TRUSTED_IP_RANGES: string[] = [];

/**
 * Konfiguracja MFA (Multi-Factor Authentication)
 * Supabase wspiera TOTP (Time-based One-Time Password)
 */
export const MFA_CONFIG = {
  // Wymagaj MFA dla adminów
  requireForAdmins: true,

  // Opcjonalne dla zwykłych użytkowników
  requireForUsers: false,

  // Grace period - czas na skonfigurowanie MFA
  gracePeriodDays: 7,
};

/**
 * Ustawienia haseł zgodne z polskimi wymogami RODO
 */
export const PASSWORD_POLICY = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,

  // Historia haseł - nie pozwalaj na powtarzanie ostatnich N haseł
  historyCount: 5,

  // Częstotliwość zmiany hasła
  maxAgeDays: 90,

  // Blokada konta po nieudanych próbach
  maxFailedAttempts: 5,
  lockoutDurationMinutes: 15,
};

/**
 * Lista zablokowanych krajów - obecnie pusta, można konfigurować według potrzeb
 */
export const BLOCKED_COUNTRIES: string[] = [];

/**
 * Konfiguracja logowania podejrzanych aktywności
 */
export const SUSPICIOUS_ACTIVITY_RULES = {
  // Logowanie z nowego urządzenia
  newDeviceAlert: true,

  // Logowanie z nowego kraju
  newCountryAlert: true,

  // Logowanie w nietypowych godzinach (poza 6:00-22:00)
  unusualHoursAlert: true,

  // Wiele nieudanych prób logowania
  bruteForceAlert: true,

  // Próba dostępu do nieistniejących zasobów
  unauthorizedAccessAlert: true,
};

/**
 * Sprawdza czy IP jest w liście zaufanych
 */
export function isTrustedIP(ip: string): boolean {
  return TRUSTED_IP_RANGES.includes(ip);
}

/**
 * Sprawdza czy kraj jest zablokowany
 */
export function isBlockedCountry(countryCode: string): boolean {
  return BLOCKED_COUNTRIES.includes(countryCode.toUpperCase());
}
