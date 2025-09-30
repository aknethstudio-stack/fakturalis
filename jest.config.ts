import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Path to your Next.js app to make the transformer aware of Next config and env
  dir: './',
});

const config = {
  // Simulate browser environment for component tests
  testEnvironment: 'jsdom',

  // Setup file for extending expect, mocks, MSW, etc.
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Keep paths in sync with tsconfig.json ("@/*": ["src/*"])
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Test file patterns - only files ending with .test.ts/.test.tsx
  testMatch: ['**/__tests__/**/*.(test|spec).{ts,tsx,js,jsx}', '**/*.(test|spec).{ts,tsx,js,jsx}'],

  // Ignore build artifacts and dependencies
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/', '<rootDir>/dist/', '<rootDir>/build/'],

  // Coverage defaults (tweak as needed)
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!__tests__/test-helpers.ts',
    '!__tests__/helpers.ts',
    '!**/?(*.)+(spec|test).[tj]s?(x)',
  ],

  // Transform is handled by next/jest (SWC/Babel), no ts-jest needed
};

export default createJestConfig(config);
