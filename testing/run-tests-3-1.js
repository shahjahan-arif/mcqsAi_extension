#!/usr/bin/env node

/**
 * Test Runner for Story 3.1: Device Detection and Mode Switching
 * Runs all tests for the AdaptivePerformance module
 */

import { execSync } from 'child_process';

console.log('🧪 Running Story 3.1 Tests: Device Detection and Mode Switching\n');

try {
  execSync('npx jest tests/performance/adaptive.test.js --verbose --coverage', {
    stdio: 'inherit'
  });

  console.log('\n✅ All Story 3.1 tests passed!\n');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Tests failed\n');
  process.exit(1);
}
