import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Path to your Next.js app to make the transformer aware of Next config and env
  dir: './',
});

const config: import('@jest/types').Config.InitialOptions = {
  // Simulate browser environment for component tests
  testEnvironment: 'jsdom',

  // Setup file for extending expect, mocks, MSW, etc.
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Keep paths in sync with tsconfig.json ("@/*": ["src/*"])
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock problematic ES modules
    '^@supabase/auth-helpers-nextjs$': '<rootDir>/__tests__/__mocks__/@supabase.ts',
    '^jose$': '<rootDir>/__tests__/__mocks__/jose.ts',
  },

  // Test file patterns - only files ending with .test.ts/.test.tsx
  testMatch: ['**/__tests__/**/*.(test|spec).{ts,tsx,js,jsx}'],

  // Ignore build artifacts and dependencies
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/', '<rootDir>/dist/', '<rootDir>/build/'],

  // Coverage configuration optimized for Codacy
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/**/*.config.{ts,js}',
    '!src/**/*.stories.{ts,tsx}',
    '!__tests__/**',
    '!**/?(*.)+(spec|test).[tj]s?(x)',
    // Exclude generated files and configs
    '!src/instrumentation.ts',
    '!src/middleware.ts',
    // Exclude specific directories with lower priority
    '!src/app/**/layout.tsx',
    '!src/app/**/loading.tsx',
    '!src/app/**/error.tsx',
    '!src/app/**/not-found.tsx',
  ],

  // Coverage thresholds (disabled initially, enable as we add tests)
  // coverageThreshold: {
  //   global: {
  //     branches: 30,
  //     functions: 30,
  //     lines: 40,
  //     statements: 40,
  //   },
  //   // Higher thresholds for core business logic (when implemented)
  //   'src/lib/validations/**/*.ts': {
  //     branches: 60,
  //     functions: 70,
  //     lines: 65,
  //     statements: 65,
  //   },
  //   'src/lib/ksef/**/*.ts': {
  //     branches: 50,
  //     functions: 60,
  //     lines: 55,
  //     statements: 55,
  //   },
  // },

  // Coverage reporters for different use cases
  coverageReporters: ['text', 'text-summary', 'html', 'lcov', 'json-summary', 'clover'],

  // Transform is handled by next/jest (SWC/Babel), no ts-jest needed
};

export default createJestConfig(config);
