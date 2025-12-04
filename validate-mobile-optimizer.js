#!/usr/bin/env node

/**
 * Validation script for MobileOptimizer
 * Tests core functionality without Jest
 */

import { MobileOptimizer } from './src/performance/mobile-optimizer.js';
import { PERFORMANCE_MODES } from './src/performance/adaptive.js';

console.log('🔍 Validating MobileOptimizer Implementation\n');

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
  // Mock dependencies
  const mockCache = {
    get: async () => null,
    set: async () => {}
  };

  const mockRetriever = {
    getAnswer: async () => ({
      answer: 'Test Answer',
      source: 'api',
      confidence: 90,
      elapsed: 100
    })
  };

  const mockAdaptive = {
    mode: PERFORMANCE_MODES.SPEED_MODE
  };

  // Test 1: Constructor validation
  try {
    new MobileOptimizer(null, mockRetriever, mockAdaptive);
    assert(false, 'Constructor throws error when cache is null');
  } catch (error) {
    assert(error.message.includes('Cache'), 'Constructor throws error when cache is null');
  }

  try {
    new MobileOptimizer(mockCache, null, mockAdaptive);
    assert(false, 'Constructor throws error when retriever is null');
  } catch (error) {
    assert(error.message.includes('Retriever'), 'Constructor throws error when retriever is null');
  }

  try {
    new MobileOptimizer(mockCache, mockRetriever, null);
    assert(false, 'Constructor throws error when adaptive is null');
  } catch (error) {
    assert(error.message.includes('Adaptive'), 'Constructor throws error when adaptive is null');
  }

  const optimizer = new MobileOptimizer(mockCache, mockRetriever, mockAdaptive);
  assert(optimizer.batteryMonitor === null, 'Battery monitor starts as null');
  assert(optimizer.isContinuousMonitoringEnabled === true, 'Continuous monitoring starts enabled');

  // Test 2: optimizeDetection - not in speed mode
  mockAdaptive.mode = PERFORMANCE_MODES.ACCURACY_MODE;
  const mockDOMBasic = {
    body: { innerText: '' },
    querySelectorAll: () => []
  };
  let result = optimizer.optimizeDetection(mockDOMBasic);
  assert(result === null, 'optimizeDetection returns null when not in speed mode');

  // Test 3: optimizeDetection - in speed mode
  mockAdaptive.mode = PERFORMANCE_MODES.SPEED_MODE;
  const mockDOM = {
    body: {
      innerText: 'Question 1? A) Option A B) Option B'
    },
    querySelectorAll: () => []
  };

  result = optimizer.optimizeDetection(mockDOM);
  assert(result !== null, 'optimizeDetection returns result in speed mode');
  assert(result.isQuiz !== undefined, 'Result includes isQuiz');
  assert(result.confidence !== undefined, 'Result includes confidence');
  assert(result.requiresAIVerification === false, 'AI verification is skipped');

  // Test 4: structuralScanFast
  const mockDOM2 = {
    querySelectorAll: (selector) => {
      if (selector === 'form') return [1, 2];
      if (selector === 'input[type="radio"], input[type="checkbox"]') return [1, 2, 3];
      if (selector === 'button[type="submit"]') return [1];
      return [];
    }
  };

  const structuralScore = optimizer.structuralScanFast(mockDOM2);
  assert(structuralScore > 0, 'Structural scan returns positive score');
  assert(structuralScore <= 40, 'Structural scan score is capped at 40');

  // Test 5: patternMatchingFast
  const mockDOM3 = {
    body: {
      innerText: 'Question 1? A) Option A B) Option B'
    }
  };

  const patternScore = optimizer.patternMatchingFast(mockDOM3);
  assert(patternScore > 0, 'Pattern matching returns positive score');
  assert(patternScore <= 40, 'Pattern matching score is capped at 40');

  // Test 6: getAnswerOptimized - cache hit
  mockCache.get = async () => ({
    answer: 'Cached Answer',
    confidence: 95
  });

  let answer = await optimizer.getAnswerOptimized('Question?');
  assert(answer.source === 'cache', 'Cache hit returns source as cache');
  assert(answer.answer === 'Cached Answer', 'Cache hit returns cached answer');

  // Test 7: getAnswerOptimized - cache miss
  mockCache.get = async () => null;
  answer = await optimizer.getAnswerOptimized('Question?');
  assert(answer.source === 'api', 'Cache miss calls API');

  // Test 8: disableContinuousMonitoring
  optimizer.isContinuousMonitoringEnabled = true;
  optimizer.disableContinuousMonitoring();
  assert(optimizer.isContinuousMonitoringEnabled === false, 'disableContinuousMonitoring works');

  // Test 9: enableContinuousMonitoring
  optimizer.enableContinuousMonitoring();
  assert(optimizer.isContinuousMonitoringEnabled === true, 'enableContinuousMonitoring works');

  // Test 10: isContinuousMonitoringActive
  optimizer.isContinuousMonitoringEnabled = true;
  assert(optimizer.isContinuousMonitoringActive() === true, 'isContinuousMonitoringActive returns true');

  optimizer.isContinuousMonitoringEnabled = false;
  assert(optimizer.isContinuousMonitoringActive() === false, 'isContinuousMonitoringActive returns false');

  // Test 11: getStats
  optimizer.isContinuousMonitoringEnabled = true;
  optimizer.batteryMonitor = null;
  const stats = optimizer.getStats();
  assert(stats.mode === PERFORMANCE_MODES.SPEED_MODE, 'Stats include mode');
  assert(stats.continuousMonitoringEnabled === true, 'Stats include monitoring status');
  assert(stats.batteryMonitorActive === false, 'Stats include battery monitor status');

  // Test 12: stopMonitoring
  optimizer.batteryMonitor = { removeEventListener: () => {} };
  optimizer.stopMonitoring();
  assert(optimizer.batteryMonitor === null, 'stopMonitoring clears battery monitor');

  // Test 13: Cache-first strategy verification
  mockCache.get = async () => ({ answer: 'Cached', confidence: 90 });
  mockRetriever.getAnswer = async () => {
    throw new Error('Should not be called');
  };

  answer = await optimizer.getAnswerOptimized('Question');
  assert(answer.source === 'cache', 'Cache-first strategy prioritizes cache');

  // Test 14: Error handling
  mockCache.get = async () => {
    throw new Error('Cache error');
  };

  answer = await optimizer.getAnswerOptimized('Question');
  assert(answer.source === 'error', 'Error handling returns error source');
  assert(answer.answer === null, 'Error handling returns null answer');

  // Test 15: Confidence normalization
  mockAdaptive.mode = PERFORMANCE_MODES.SPEED_MODE;
  result = optimizer.optimizeDetection(mockDOM);
  assert(result.confidence >= 0 && result.confidence <= 100, 'Confidence is normalized to 0-100');

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
