#!/usr/bin/env node

/**
 * Test Runner for Story 4.2: Explanation and Feedback Features
 * Runs all tests for the ExplanationManager module
 */

import { execSync } from 'child_process';

console.log('🧪 Running Story 4.2 Tests: Explanation and Feedback Features\n');

try {
  execSync('npx jest tests/ui/explanation-manager.test.js --verbose --coverage', {
    stdio: 'inherit'
  });

  console.log('\n✅ All Story 4.2 tests passed!\n');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Tests failed\n');
  process.exit(1);
}
