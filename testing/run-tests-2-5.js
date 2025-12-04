#!/usr/bin/env node

/**
 * Test Runner for Story 2.5: Request Queuing and Retry Logic
 * Runs all tests for the RequestQueue module
 */

import { execSync } from 'child_process';

console.log('🧪 Running Story 2.5 Tests: Request Queuing and Retry Logic\n');

try {
  execSync('npx jest tests/api/request-queue.test.js --verbose --coverage', {
    stdio: 'inherit'
  });

  console.log('\n✅ All Story 2.5 tests passed!\n');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Tests failed\n');
  process.exit(1);
}
