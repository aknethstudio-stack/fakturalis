#!/usr/bin/env node

/**
 * Script to upload coverage to Codacy manually
 * Usage: node scripts/upload-coverage.mjs
 *
 * Note: This is a simplified version for development testing.
 * Production uploads should use GitHub Actions with codacy-coverage-reporter-action.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if coverage file exists
const coverageFile = path.join(__dirname, '..', 'coverage', 'lcov.info');

if (!fs.existsSync(coverageFile)) {
  console.error('❌ Coverage file not found. Run tests first:');
  console.error('npm run test:ci');
  process.exit(1);
}

// Check for project token
const projectToken = process.env.CODACY_PROJECT_TOKEN;

if (!projectToken) {
  console.error('❌ CODACY_PROJECT_TOKEN environment variable not set');
  console.error('Get your token from: https://app.codacy.com/gh/aknethstudio-stack/fakturalis/settings/coverage');
  console.error('💡 For automated uploads, use GitHub Actions instead');
  process.exit(1);
}

try {
  console.log('📊 Uploading coverage to Codacy...');
  console.log('🔍 Coverage file:', coverageFile);

  // For simplicity, we'll use curl command if available
  if (process.platform === 'win32') {
    console.log('🪟 Windows detected');
    console.log('💡 Manual upload not fully supported on Windows');
    console.log('📤 Use GitHub Actions for reliable coverage uploads');
    console.log('📁 Coverage file ready at:', coverageFile);
  } else {
    // Unix/Linux/macOS - use curl
    const curlCmd =
      `curl -L -X POST ` +
      `--data-binary @${coverageFile} ` +
      `-H "project-token: ${projectToken}" ` +
      `-H "Content-Type: text/plain" ` +
      `https://api.codacy.com/2.0/coverage/language/typescript`;

    console.log('🚀 Executing upload...');
    execSync(curlCmd, { stdio: 'inherit' });
    console.log('✅ Coverage uploaded successfully to Codacy!');
  }
} catch (error) {
  console.error('❌ Failed to upload coverage:', error.message);
  console.error('💡 Use GitHub Actions for reliable automated uploads');
  process.exit(1);
}
