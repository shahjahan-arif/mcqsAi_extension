#!/usr/bin/env node

/**
 * Test Runner for Story 5.2: User Pattern Priority Detection
 * Runs all tests for the PatternPriorityDetector module
 */

import { execSync } from 'child_process';

console.log('🧪 Running Story 5.2 Tests: User Pattern Priority Detection\n');

try {
  execSync('npx jest tests/learning/pattern-priority-detector.test.js --verbose --coverage', {
    stdio: 'inherit'
  });

  console.log('\n✅ All Story 5.2 tests passed!\n');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Tests failed\n');
  process.exit(1);
}
