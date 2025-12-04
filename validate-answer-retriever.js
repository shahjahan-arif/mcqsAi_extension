#!/usr/bin/env node

/**
 * Validation script for AnswerRetriever
 * Tests core functionality without Jest
 */

import { AnswerRetriever } from './src/answer/retriever.js';

console.log('🔍 Validating AnswerRetriever Implementation\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ ${message}`);
    passed++;
  } else {
    console.log(`❌ ${message}`);
    failed++;
  }
}

async function runValidation() {
  // Mock cache and API client
  const cachedQuestions = new Map();
  
  const mockCache = {
    get: async (hash) => {
      return cachedQuestions.get(hash) || null;
    },
    set: async (hash, data) => {
      cachedQuestions.set(hash, data);
    }
  };

  const mockApiClient = {
    getAnswer: async (question, context) => {
      return { answer: 'API Answer', confidence: 85, explanation: null, error: null };
    }
  };

  // Test 1: Constructor validation
  try {
    new AnswerRetriever(null, mockApiClient);
    assert(false, 'Constructor throws error when cache is null');
  } catch (error) {
    assert(error.message.includes('Cache'), 'Constructor throws error when cache is null');
  }

  try {
    new AnswerRetriever(mockCache, null);
    assert(false, 'Constructor throws error when API client is null');
  } catch (error) {
    assert(error.message.includes('API client'), 'Constructor throws error when API client is null');
  }

  const retriever = new AnswerRetriever(mockCache, mockApiClient);
  assert(retriever.stats.hits === 0, 'Initial stats: hits = 0');
  assert(retriever.stats.misses === 0, 'Initial stats: misses = 0');
  assert(retriever.stats.totalTime === 0, 'Initial stats: totalTime = 0');

  // Test 2: Cache miss then hit scenario
  // First call - cache miss, API called
  const firstResult = await retriever.getAnswer('What is 2+2?');
  assert(firstResult.source === 'api', 'First call returns source as api');
  assert(firstResult.answer === 'API Answer', 'First call returns API answer');
  assert(retriever.stats.misses === 1, 'First call increments misses counter');

  // Second call - cache hit
  const cacheHitResult = await retriever.getAnswer('What is 2+2?');
  assert(cacheHitResult.source === 'cache', 'Cache hit returns source as cache');
  assert(cacheHitResult.answer === 'API Answer', 'Cache hit returns cached answer');
  assert(cacheHitResult.confidence === 85, 'Cache hit returns cached confidence');
  assert(cacheHitResult.elapsed > 0, 'Cache hit has elapsed time');
  assert(retriever.stats.hits === 1, 'Cache hit increments hits counter');

  // Test 3: Another cache miss scenario
  const cacheMissResult = await retriever.getAnswer('What is 3+3?');
  assert(cacheMissResult.source === 'api', 'Cache miss returns source as api');
  assert(cacheMissResult.answer === 'API Answer', 'Cache miss returns API answer');
  assert(cacheMissResult.confidence === 85, 'Cache miss returns API confidence');
  assert(retriever.stats.misses === 2, 'Second cache miss increments misses counter');

  // Test 4: Statistics
  const stats = retriever.getStats();
  assert(stats.hits === 1, 'Stats show correct hits');
  assert(stats.misses === 2, 'Stats show correct misses');
  assert(stats.total === 3, 'Stats show correct total');
  assert(stats.hitRate === '33.33%', 'Stats show correct hit rate');
  assert(stats.missRate === '66.67%', 'Stats show correct miss rate');
  assert(stats.avgTime.includes('ms'), 'Stats show average time in ms');

  // Test 5: Reset stats
  retriever.resetStats();
  assert(retriever.stats.hits === 0, 'Reset clears hits');
  assert(retriever.stats.misses === 0, 'Reset clears misses');
  assert(retriever.stats.totalTime === 0, 'Reset clears totalTime');

  // Test 6: Error handling
  const errorCache = {
    get: async () => {
      throw new Error('Cache error');
    },
    set: async () => {}
  };

  const errorRetriever = new AnswerRetriever(errorCache, mockApiClient);
  const errorResult = await errorRetriever.getAnswer('Test question');
  assert(errorResult.source === 'error', 'Error returns source as error');
  assert(errorResult.answer === null, 'Error returns null answer');
  assert(errorResult.confidence === 0, 'Error returns 0 confidence');
  assert(errorResult.error.includes('Cache error'), 'Error includes error message');

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log('✅ All validations passed!\n');
    process.exit(0);
  } else {
    console.log('❌ Some validations failed\n');
    process.exit(1);
  }
}

runValidation().catch(error => {
  console.error('❌ Validation error:', error.message);
  process.exit(1);
});
