/**
 * Jest setup for Fakturalis
 * - Deterministic timezone
 * - Placeholders for common test utilities (Testing Library, MSW)
 *
 * Note:
 * - This file runs before every test (configured in jest.config.ts via setupFilesAfterEnv).
 * - Keep external imports optional to avoid runtime errors when the package isn't installed.
 */

// Force deterministic timezone for tests (useful for invoicing/date-related logic)
process.env.TZ = 'UTC';

// Ensure real timers are used after each test (tests can switch to fake timers when needed)
afterEach(() => {
  jest.useRealTimers();
});

/**
 * If you use Testing Library, enable extended matchers by installing:
 *   npm i -D @testing-library/jest-dom
 * and uncommenting the line below.
 */
import '@testing-library/jest-dom';

/**
 * If you use Mock Service Worker (MSW) for API mocking, create a server in e.g. test/msw/server.ts:
 *   import { setupServer } from 'msw/node';
 *   export const server = setupServer(...handlers);
 *
 * Then enable the lifecycle hooks here:
 *
 * import { server } from './test/msw/server';
 *
 * beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
 * afterEach(() => server.resetHandlers());
 * afterAll(() => server.close());
 */

/**
 * For stricter tests, you can fail on unexpected console.error/console.warn by uncommenting below.
 * Beware this may require updating existing tests that expect warnings.
 */
/*
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    throw new Error(`console.error: ${args.map(String).join(' ')}`);
  };
  console.warn = (...args: unknown[]) => {
    throw new Error(`console.warn: ${args.map(String).join(' ')}`);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
*/
