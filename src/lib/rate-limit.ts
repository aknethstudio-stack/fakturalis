import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const rateLimiters = {
  auth: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    analytics: true,
    prefix: 'fakturalis:auth',
  }),

  api: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    analytics: true,
    prefix: 'fakturalis:api',
  }),

  critical: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'fakturalis:critical',
  }),
};

/**
 * Sprawdza rate limit dla danego identyfikatora
 */
export async function checkRateLimit(limiter: keyof typeof rateLimiters, identifier: string) {
  try {
    const result = await rateLimiters[limiter].limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: typeof result.reset === 'number' ? new Date(result.reset) : result.reset,
    };
  } catch (error) {
    console.warn('Rate limit check failed:', error);
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: new Date(),
    };
  }
}

/**
 * Tworzy middleware rate limiting dla API routes
 */
export function createRateLimitMiddleware(
  limiter: keyof typeof rateLimiters,
  getIdentifier: (req: Request) => string = (req) =>
    req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous',
) {
  return async function rateLimitMiddleware(req: Request) {
    const identifier = getIdentifier(req);
    const result = await checkRateLimit(limiter, identifier);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Zbyt wiele żądań. Spróbuj ponownie później.',
          retryAfter: Math.round((result.reset.getTime() - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.getTime().toString(),
            'Retry-After': Math.round((result.reset.getTime() - Date.now()) / 1000).toString(),
          },
        },
      );
    }

    return null;
  };
}
