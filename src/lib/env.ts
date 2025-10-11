import { z } from 'zod';

/**
 * Schema walidacji zmiennych środowiskowych
 * Zapewnia że wszystkie wymagane zmienne są obecne i mają właściwy format
 */
const envSchema = z.object({
  // Node.js environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Next.js
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL musi być prawidłowym URL'),

  // Supabase (wymagane)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL musi być prawidłowym URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY jest wymagany'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY jest wymagany').optional(),

  // hCaptcha (wymagane w produkcji)
  NEXT_PUBLIC_HCAPTCHA_SITE_KEY: z.string().min(1, 'NEXT_PUBLIC_HCAPTCHA_SITE_KEY jest wymagany'),
  HCAPTCHA_SECRET_KEY: z.string().min(1, 'HCAPTCHA_SECRET_KEY jest wymagany'),

  // Sentry (opcjonalne)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Rate limiting - Upstash Redis (opcjonalne, ale rekomendowane w produkcji)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Vercel (automatycznie ustawiane)
  VERCEL: z.string().optional(),
  VERCEL_URL: z.string().optional(),
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),

  // GitHub Actions CI/CD
  CI: z.string().optional(),
  GITHUB_ACTIONS: z.string().optional(),

  // Coverage reporting (CI/CD)
  CODACY_PROJECT_TOKEN: z.string().optional(),
  CODECOV_TOKEN: z.string().optional(),
});

/**
 * Typ dla walidowanych zmiennych środowiskowych
 */
export type Environment = z.infer<typeof envSchema>;

/**
 * Waliduje zmienne środowiskowe i zwraca bezpieczny obiekt
 * @returns Walidowane zmienne środowiskowe
 * @throws Error jeśli walidacja się nie powiedzie
 */
export function validateEnvironment(): Environment {
  try {
    const env = envSchema.parse(process.env);

    // Dodatkowe walidacje specyficzne dla środowiska
    if (env.NODE_ENV === 'production') {
      // W produkcji wymagamy wszystkich kluczy bezpieczeństwa
      if (!env.SENTRY_DSN) {
        console.warn('⚠️ SENTRY_DSN nie jest ustawiony w produkcji - brak monitoringu błędów');
      }

      if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
        console.warn('⚠️ Redis Upstash nie jest skonfigurowany - rate limiting będzie wyłączony');
      }
    }

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n');

      throw new Error(`❌ Błędne zmienne środowiskowe:\n${errorMessage}`);
    }

    throw error;
  }
}

/**
 * Sprawdza czy aplikacja jest w trybie development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Sprawdza czy aplikacja jest w trybie production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Sprawdza czy aplikacja jest w trybie test
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

/**
 * Sprawdza czy aplikacja działa na Vercel
 */
export function isVercel(): boolean {
  return Boolean(process.env.VERCEL);
}

/**
 * Sprawdza czy aplikacja działa w GitHub Actions
 */
export function isCI(): boolean {
  return Boolean(process.env.CI || process.env.GITHUB_ACTIONS);
}

/**
 * Sprawdza czy rate limiting jest dostępny
 */
export function isRateLimitingEnabled(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Sprawdza czy Sentry jest skonfigurowany
 */
export function isSentryEnabled(): boolean {
  return Boolean(process.env.SENTRY_DSN);
}

// Waliduj zmienne na starcie aplikacji (tylko w runtime, nie w build time)
let validatedEnv: Environment | null = null;

export function getEnvironment(): Environment {
  if (!validatedEnv) {
    validatedEnv = validateEnvironment();
  }
  return validatedEnv;
}

// Export dla kompatybilności
export const env = getEnvironment;
