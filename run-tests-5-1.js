#!/usr/bin/env node

/**
 * Test Runner for Story 5.1: User Quiz Marking and Pattern Extraction
 * Runs all tests for the UserTrainingManager module
 */

import { execSync } from 'child_process';

console.log('🧪 Running Story 5.1 Tests: User Quiz Marking and Pattern Extraction\n');

try {
  execSync('npx jest tests/learning/user-training.test.js --verbose --coverage', {
    stdio: 'inherit'
  });

  console.log('\n✅ All Story 5.1 tests passed!\n');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Tests failed\n');
  process.exit(1);
}
