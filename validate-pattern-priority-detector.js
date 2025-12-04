#!/usr/bin/env node

/**
 * Validation script for PatternPriorityDetector
 * Tests core functionality without Jest
 */

import { PatternPriorityDetector } from './src/learning/pattern-priority-detector.js';

console.log('🔍 Validating PatternPriorityDetector Implementation\n');

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
  // Mock cache
  const mockCache = {
    db: { transaction: () => {} }
  };

  // Mock universal detector
  const mockUniversalDetector = {
    detectQuiz: async () => ({
      isQuiz: true,
      confidence: 85
    })
  };

  // Mock DOM
  const mockDOM = {
    querySelector: (selector) => {
      if (selector === '#quiz-container' || selector === '.quiz') {
        return { tagName: 'DIV' };
      }
      return null;
    },
    querySelectorAll: (selector) => [
      { innerText: 'Question 1?', textContent: 'Question 1?' },
      { innerText: 'Question 2?', textContent: 'Question 2?' }
    ],
    body: {
      innerText: 'Question 1 of 5?\nA) Option A\nB) Option B'
    }
  };

  // Mock pattern
  const mockPattern = {
    id: 'pattern_123',
    url: 'example.com',
    cssSelectors: ['#quiz-container', '.quiz'],
    textPatterns: ['contains_question_mark', 'has_option_prefixes'],
    confidence: 100,
    successCount: 5,
    lastUsed: Date.now()
  };

  // Test 1: Constructor
  try {
    new PatternPriorityDetector(null);
    assert(false, 'Constructor throws error when cache is null');
  } catch (error) {
    assert(error.message.includes('Cache'), 'Constructor throws error when cache is null');
  }

  const detector = new PatternPriorityDetector(mockCache, mockUniversalDetector);
  assert(detector.cache === mockCache, 'Cache is set');
  assert(detector.universalDetector === mockUniversalDetector, 'Universal detector is set');

  // Test 2: detectQuiz validation
  try {
    await detector.detectQuiz(null);
    assert(false, 'detectQuiz rejects null DOM');
  } catch (error) {
    assert(error.message.includes('DOM'), 'detectQuiz rejects null DOM');
  }

  // Test 3: detectQuiz with user pattern
  const result = await detector.detectQuiz(mockDOM, [mockPattern]);
  assert(result.isQuiz === true, 'detectQuiz returns isQuiz true');
  assert(result.confidence === 100, 'detectQuiz returns 100% confidence for user pattern');
  assert(result.source === 'user-pattern', 'detectQuiz returns user-pattern source');
  assert(result.patternId === 'pattern_123', 'detectQuiz returns pattern ID');

  // Test 4: detectQuiz without user pattern
  const resultNoPattern = await detector.detectQuiz(mockDOM, []);
  assert(resultNoPattern.source === 'universal', 'detectQuiz falls back to universal');

  // Test 5: checkUserPatterns
  const pattern = detector.checkUserPatterns(mockDOM, [mockPattern]);
  assert(pattern === mockPattern, 'checkUserPatterns finds matching pattern');

  // Test 6: checkUserPatterns no match
  mockDOM.querySelector = () => null;
  const noPattern = detector.checkUserPatterns(mockDOM, [mockPattern]);
  assert(noPattern === null, 'checkUserPatterns returns null when no match');

  // Reset mock
  mockDOM.querySelector = (selector) => {
    if (selector === '#quiz-container' || selector === '.quiz') {
      return { tagName: 'DIV' };
    }
    return null;
  };

  // Test 7: matchesPattern
  const matches = detector.matchesPattern(mockDOM, mockPattern);
  assert(matches === true, 'matchesPattern returns true for matching pattern');

  // Test 8: recordPatternSuccess
  const patterns = [{ ...mockPattern }];
  const initialCount = patterns[0].successCount;
  detector.recordPatternSuccess(mockPattern.id, patterns);
  assert(patterns[0].successCount === initialCount + 1, 'recordPatternSuccess increments count');

  // Test 9: extractQuestionsFromPattern
  const questions = detector.extractQuestionsFromPattern(mockDOM, mockPattern);
  assert(questions.length > 0, 'extractQuestionsFromPattern returns questions');
  assert(questions[0].questionText !== undefined, 'Questions have text');

  // Test 10: cleanupOldPatterns
  const ninetyOneDaysAgo = Date.now() - (91 * 24 * 60 * 60 * 1000);
  const patternsToClean = [
    { ...mockPattern, lastUsed: ninetyOneDaysAgo },
    { ...mockPattern, id: 'p2', lastUsed: Date.now() }
  ];
  const cleaned = detector.cleanupOldPatterns(patternsToClean);
  assert(cleaned.length === 1, 'cleanupOldPatterns removes old patterns');
  assert(cleaned[0].id === 'p2', 'cleanupOldPatterns keeps recent patterns');

  // Test 11: getPatternStats
  const stats = detector.getPatternStats([mockPattern]);
  assert(stats.totalPatterns === 1, 'getPatternStats shows total patterns');
  assert(stats.totalSuccesses === mockPattern.successCount, `getPatternStats shows total successes (${stats.totalSuccesses} === ${mockPattern.successCount})`);
  assert(stats.patterns.length === 1, 'getPatternStats includes pattern details');

  // Test 12: setUniversalDetector
  const newDetector = { detectQuiz: async () => ({}) };
  detector.setUniversalDetector(newDetector);
  assert(detector.universalDetector === newDetector, 'setUniversalDetector updates detector');

  // Test 13: setUniversalDetector validation
  try {
    detector.setUniversalDetector(null);
    assert(false, 'setUniversalDetector rejects null');
  } catch (error) {
    assert(error.message.includes('detectQuiz'), 'setUniversalDetector rejects null');
  }

  // Test 14: getUniversalDetector
  assert(detector.getUniversalDetector() === newDetector, 'getUniversalDetector returns detector');

  // Test 15: Pattern priority
  const priorityResult = await detector.detectQuiz(mockDOM, [mockPattern]);
  assert(priorityResult.source === 'user-pattern', 'User patterns have priority');

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
