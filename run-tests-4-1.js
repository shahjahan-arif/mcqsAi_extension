#!/usr/bin/env node

/**
 * Test Runner for Story 4.1: Answer Display UI Component
 * Runs all tests for the AnswerDisplay module
 */

import { execSync } from 'child_process';

console.log('🧪 Running Story 4.1 Tests: Answer Display UI Component\n');

try {
  execSync('npx jest tests/ui/answer-display.test.js --verbose --coverage', {
    stdio: 'inherit'
  });

  console.log('\n✅ All Story 4.1 tests passed!\n');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Tests failed\n');
  process.exit(1);
}
