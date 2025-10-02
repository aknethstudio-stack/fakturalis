/**
 * Centralized logging utility   warn(message: string, _extra?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true') {
      Sentry.captureMessage(message, 'warning');
    } else {
      console.warn(message);
    }
  },ry integration
 * Use this instead of console.* methods for production logging
 */

import * as Sentry from '@sentry/nextjs';

export const logger = {
  /**
   * Log error messages with Sentry integration
   * Use instead of console.error()
   */
  error: (message: string, error?: Error | unknown, extra?: Record<string, unknown>) => {
    // Always log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(message, error);
    }

    // Send to Sentry in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true') {
      if (error instanceof Error) {
        Sentry.captureException(error, {
          tags: { source: 'application' },
          extra: { message, ...extra },
        });
      } else {
        Sentry.captureMessage(message, 'error');
      }
    }
  },

  /**
   * Log warning messages
   * Use instead of console.warn()
   */
  warn: (message: string, _extra?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(message);
    }

    if (process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true') {
      Sentry.captureMessage(message, 'warning');
    }
  },

  /**
   * Log info messages (development only)
   * Use instead of console.log() or console.info()
   */
  info: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(message, data);
    }
  },

  /**
   * Log debug messages (development only)
   * Use instead of console.debug()
   */
  debug: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(message, data);
    }
  },
};
