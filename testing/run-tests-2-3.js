#!/usr/bin/env node

/**
 * Test Runner for Story 2.3: Cache-First Answer Retrieval
 * Runs all tests for the AnswerRetriever module
 */

const { execSync } = require('child_process');

console.log('🧪 Running Story 2.3 Tests: Cache-First Answer Retrieval\n');

try {
  execSync('npx jest tests/answer/retriever.test.js --verbose --coverage', {
    stdio: 'inherit'
  });

  console.log('\n✅ All Story 2.3 tests passed!\n');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Tests failed\n');
  process.exit(1);
}
