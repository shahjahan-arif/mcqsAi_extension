#!/usr/bin/env node

/**
 * Test Runner for Story 3.2: Web Worker for Parallel Detection
 * Runs all tests for the DetectionManager module
 */

import { execSync } from 'child_process';

console.log('🧪 Running Story 3.2 Tests: Web Worker for Parallel Detection\n');

try {
  execSync('npx jest tests/detection/manager.test.js --verbose --coverage', {
    stdio: 'inherit'
  });

  console.log('\n✅ All Story 3.2 tests passed!\n');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Tests failed\n');
  process.exit(1);
}
