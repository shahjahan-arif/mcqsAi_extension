#!/usr/bin/env node

/**
 * Test Runner for Story 2.4: Rate Limiting Management
 * Runs all tests for the RateLimiter module
 */

import { execSync } from 'child_process';

console.log('🧪 Running Story 2.4 Tests: Rate Limiting Management\n');

try {
  execSync('npx jest tests/api/rate-limiter.test.js --verbose --coverage', {
    stdio: 'inherit'
  });

  console.log('\n✅ All Story 2.4 tests passed!\n');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Tests failed\n');
  process.exit(1);
}
