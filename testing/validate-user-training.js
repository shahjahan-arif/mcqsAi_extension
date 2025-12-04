#!/usr/bin/env node

/**
 * Validation script for UserTrainingManager
 * Tests core functionality without Jest
 */

// Mock document for Node.js environment
if (typeof document === 'undefined') {
  global.document = {
    createElement: (tag) => ({
      className: '',
      classList: { add: function() {}, contains: function() { return false; } },
      setAttribute: function() {},
      getAttribute: function() {},
      style: { cssText: '' },
      textContent: '',
      remove: function() {},
      appendChild: function() {}
    }),
    body: { appendChild: function() {} }
  };
}

import { UserTrainingManager } from './src/learning/user-training.js';

console.log('🔍 Validating UserTrainingManager Implementation\n');

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

  // Mock element
  const mockElement = {
    tagName: 'DIV',
    id: 'quiz-container',
    classList: ['quiz', 'active'],
    children: [
      { tagName: 'H2', classList: ['question'], id: 'q1' },
      { tagName: 'DIV', classList: ['options'], id: 'opts1' }
    ],
    innerText: 'Question 1 of 5?\nA) Option A\nB) Option B',
    getAttribute: (attr) => attr === 'data-quiz' ? 'true' : null
  };

  // Test 1: Constructor
  try {
    new UserTrainingManager(null);
    assert(false, 'Constructor throws error when cache is null');
  } catch (error) {
    assert(error.message.includes('Cache'), 'Constructor throws error when cache is null');
  }

  const manager = new UserTrainingManager(mockCache);
  assert(manager.cache === mockCache, 'Cache is set');
  assert(Array.isArray(manager.patterns), 'Patterns is initialized as array');
  assert(manager.maxPatterns === 1000, 'Max patterns is 1000');

  // Test 2: extractPattern
  const pattern = manager.extractPattern(mockElement);
  assert(pattern.id !== undefined, 'Pattern has ID');
  assert(pattern.url !== undefined, 'Pattern has URL');
  assert(pattern.domStructure !== undefined, 'Pattern has DOM structure');
  assert(pattern.cssSelectors !== undefined, 'Pattern has CSS selectors');
  assert(pattern.textPatterns !== undefined, 'Pattern has text patterns');
  assert(pattern.confidence === 100, 'Pattern confidence is 100');

  // Test 3: extractPattern validation
  try {
    manager.extractPattern(null);
    assert(false, 'extractPattern rejects null element');
  } catch (error) {
    assert(error.message.includes('Element'), 'extractPattern rejects null element');
  }

  // Test 4: serializeDOM
  const serialized = manager.serializeDOM(mockElement);
  assert(serialized.tagName === 'DIV', 'Serialized DOM has tag name');
  assert(serialized.id === 'quiz-container', 'Serialized DOM has ID');
  assert(Array.isArray(serialized.classes), 'Serialized DOM has classes');
  assert(Array.isArray(serialized.children), 'Serialized DOM has children');

  // Test 5: extractSelectors
  const selectors = manager.extractSelectors(mockElement);
  assert(selectors.includes('#quiz-container'), 'Selectors include ID');
  assert(selectors.some(s => s.includes('quiz')), 'Selectors include classes');
  assert(selectors.includes('div'), 'Selectors include tag name');

  // Test 6: extractTextPatterns
  const textPatterns = manager.extractTextPatterns(mockElement);
  assert(textPatterns.includes('contains_question_mark'), 'Detects question mark');
  assert(textPatterns.includes('has_option_prefixes'), 'Detects option prefixes');
  assert(textPatterns.includes('has_question_counter'), 'Detects question counter');

  // Test 7: storePattern
  await manager.storePattern(pattern);
  assert(manager.patterns.length === 1, 'Pattern is stored');

  // Test 8: storePattern validation
  try {
    await manager.storePattern(null);
    assert(false, 'storePattern rejects null');
  } catch (error) {
    assert(error.message.includes('Pattern must be'), 'storePattern rejects null');
  }

  // Test 9: generatePatternId
  const id1 = manager.generatePatternId();
  const id2 = manager.generatePatternId();
  assert(id1 !== id2, 'Generated IDs are unique');
  assert(id1.startsWith('pattern_'), 'Generated ID has correct prefix');

  // Test 10: getPatterns
  const patterns = manager.getPatterns();
  assert(patterns.length === 1, 'getPatterns returns all patterns');
  assert(patterns !== manager.patterns, 'getPatterns returns copy');

  // Test 11: getPatternsForUrl
  const urlPatterns = manager.getPatternsForUrl(pattern.url);
  assert(urlPatterns.length === 1, 'getPatternsForUrl filters correctly');

  // Test 12: getPatternsForUrl validation
  try {
    manager.getPatternsForUrl('');
    assert(false, 'getPatternsForUrl rejects empty URL');
  } catch (error) {
    assert(error.message.includes('URL must be'), 'getPatternsForUrl rejects empty URL');
  }

  // Test 13: getStats
  const stats = manager.getStats();
  assert(stats.totalPatterns === 1, 'Stats show correct total');
  assert(stats.maxPatterns === 1000, 'Stats show max patterns');
  assert(stats.averageConfidence !== undefined, 'Stats show average confidence');

  // Test 14: clearPatterns
  manager.clearPatterns();
  assert(manager.patterns.length === 0, 'clearPatterns removes all');

  // Test 15: deletePattern
  await manager.storePattern(pattern);
  const deleted = manager.deletePattern(pattern.id);
  assert(deleted === true, 'deletePattern returns true on success');
  assert(manager.patterns.length === 0, 'Pattern is deleted');

  // Test 16: deletePattern validation
  try {
    manager.deletePattern('');
    assert(false, 'deletePattern rejects empty ID');
  } catch (error) {
    assert(error.message.includes('Pattern ID'), 'deletePattern rejects empty ID');
  }

  // Test 17: updatePatternSuccess
  await manager.storePattern(pattern);
  manager.updatePatternSuccess(pattern.id);
  assert(manager.patterns[0].successCount === 1, 'Success count incremented');

  // Test 18: updatePatternSuccess validation
  try {
    manager.updatePatternSuccess('');
    assert(false, 'updatePatternSuccess rejects empty ID');
  } catch (error) {
    assert(error.message.includes('Pattern ID'), 'updatePatternSuccess rejects empty ID');
  }

  // Test 19: findMatchingPattern
  const match = manager.findMatchingPattern(mockElement);
  assert(match !== null, 'findMatchingPattern finds pattern');
  assert(match.id === pattern.id, 'findMatchingPattern returns correct pattern');

  // Test 20: findMatchingPattern with no match
  manager.clearPatterns();
  const noMatch = manager.findMatchingPattern(mockElement);
  assert(noMatch === null, 'findMatchingPattern returns null when no match');

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
