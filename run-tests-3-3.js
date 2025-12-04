#!/usr/bin/env node

/**
 * Test Runner for Story 3.3: Mobile Speed Mode Optimization
 * Runs all tests for the MobileOptimizer module
 */

import { execSync } from 'child_process';

console.log('🧪 Running Story 3.3 Tests: Mobile Speed Mode Optimization\n');

try {
  execSync('npx jest tests/performance/mobile-optimizer.test.js --verbose --coverage', {
    stdio: 'inherit'
  });

  console.log('\n✅ All Story 3.3 tests passed!\n');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Tests failed\n');
  process.exit(1);
}
