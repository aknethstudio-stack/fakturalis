/**
 * ESLint Flat config (ESLint 9+) for InvoiceForge
 * - Next.js core-web-vitals rules
 * - TypeScript support
 * - Prettier integration (plugin:prettier/recommended)
 *
 * Future-proof notes:
 * - Uses FlatCompat to bridge legacy "extends" configs into the flat format.
 * - Projects using TypeScript are project-aware via parserOptions.project.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import tsParser from '@typescript-eslint/parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bridge for legacy-style "extends" (e.g., next/core-web-vitals, plugin:@typescript-eslint/recommended, plugin:prettier/recommended)
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const config = [
  // Ignore generated artifacts and caches
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/.swc/**',
      '**/.vite/**',
      '**/*.min.js',
      '**/*.bundle.*',
      // Generated Next.js files
      'next-env.d.ts',
      // Config files that can have anonymous exports (except eslint.config and jest.config)
      'next.config.{js,ts}',
      'postcss.config.{js,cjs}',
      'commitlint.config.{js,cjs}',
      'tailwind.config.{js,ts}',
    ],
  },

  // Report unnecessary eslint-disable comments
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },

  // Base recommended JS rules
  js.configs.recommended,

  // Next.js rules (includes react and react-hooks best practices)
  ...compat.extends('next/core-web-vitals'),

  // TypeScript recommended rules
  ...compat.extends('plugin:@typescript-eslint/recommended'),

  // Prettier: turn off conflicting formatting rules + run prettier as an ESLint rule
  ...compat.extends('plugin:prettier/recommended'),

  // Global language options and environments
  ...compat.config({
    env: {
      es2023: true,
      browser: true,
      node: true,
      jest: true,
    },
  }),

  // Global settings for React/Next
  {
    settings: {
      react: { version: 'detect' },
      next: { rootDir: ['.'] },
    },
  },

  // TypeScript-specific: project-aware parsing + a few sensible rule tweaks
  {
    files: ['src/**/*.ts', 'src/**/*.tsx', '__tests__/**/*.ts', '__tests__/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: path.join(__dirname, 'tsconfig.json'),
        tsconfigRootDir: __dirname,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      // Defer to the TS-aware rule for unused variables and ignore intentionally-prefixed underscores
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // Test files: allow console for diagnostics and ensure test env is recognized
  {
    files: ['__tests__/**/*.{js,jsx,ts,tsx}', '**/*.{test,spec}.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        jest: true,
        describe: true,
        test: true,
        it: true,
        expect: true,
        beforeAll: true,
        afterAll: true,
        beforeEach: true,
        afterEach: true,
      },
    },
    rules: {
      'no-console': 'off',
    },
  },

  // Config and scripts in the repo root (Node context)
  {
    files: ['*.config.{js,cjs,mjs,ts}', '.*rc.{js,cjs,mjs,ts}', 'jest.setup.ts', 'eslint.config.{js,cjs,mjs}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      // Config files can have anonymous default exports
      'import/no-anonymous-default-export': 'off',
    },
  },
];

export default config;
