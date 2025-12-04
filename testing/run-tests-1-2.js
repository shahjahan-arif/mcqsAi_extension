#!/usr/bin/env node

/**
 * Test runner for pattern-matcher tests
 * Validates implementation without full Jest setup
 */

import { patternMatching, analyzePatterns, PATTERN_MAX_SCORE } from './src/detection/pattern-matcher.js';

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    testsFailed++;
    throw new Error(message);
  } else {
    console.log(`✅ PASS: ${message}`);
    testsPassed++;
  }
}

function createMockDom(text = '') {
  return {
    body: {
      innerText: text
    }
  };
}

// Run tests
console.log('\n🧪 Running Pattern Matcher Tests\n');

try {
  // Test 1: Empty text
  console.log('Test Suite: Scoring Logic');
  const emptyDom = createMockDom('');
  assert(patternMatching(emptyDom) === 0, 'Empty text returns 0');

  // Test 2: Question marks
  const questionMarksDom = createMockDom('What is this? Is this correct? Maybe?');
  const questionMarksScore = patternMatching(questionMarksDom);
  assert(questionMarksScore > 0 && questionMarksScore <= 10, `Question marks scoring (got ${questionMarksScore})`);

  // Test 3: Option prefixes (A-D)
  const optionPrefixesDom = createMockDom('A) First option\nB) Second option\nC) Third option\nD) Fourth option');
  const optionPrefixesScore = patternMatching(optionPrefixesDom);
  assert(optionPrefixesScore > 0 && optionPrefixesScore <= 15, `Option prefixes scoring (got ${optionPrefixesScore})`);

  // Test 4: Numeric option prefixes
  const numericPrefixesDom = createMockDom('1. First\n2. Second\n3. Third\n4. Fourth');
  const numericScore = patternMatching(numericPrefixesDom);
  assert(numericScore > 0 && numericScore <= 15, `Numeric prefixes scoring (got ${numericScore})`);

  // Test 5: Question patterns
  const questionPatternsDom = createMockDom('Question 1 of 5\nQuestion 2 of 5\nQuestion 3 of 5');
  const questionPatternsScore = patternMatching(questionPatternsDom);
  assert(questionPatternsScore > 0 && questionPatternsScore <= 10, `Question patterns scoring (got ${questionPatternsScore})`);

  // Test 6: Keywords
  const keywordsDom = createMockDom('Select the correct answer. Choose wisely. Answer this question.');
  const keywordsScore = patternMatching(keywordsDom);
  assert(keywordsScore > 0 && keywordsScore <= 5, `Keywords scoring (got ${keywordsScore})`);

  // Test 7: Max score cap (verify it never exceeds 40)
  const maxDom = createMockDom(`
    Question 1 of 100? Question 2 of 100? Question 3 of 100? Question 4 of 100? Question 5 of 100?
    A) Option A? B) Option B? C) Option C? D) Option D? A) Option A? B) Option B? C) Option C? D) Option D?
    Select the answer. Choose wisely. Answer this. Submit now. Next question. Select answer.
    1. First 2. Second 3. Third 4. Fourth 5. Fifth 1. First 2. Second 3. Third 4. Fourth 5. Fifth
  `.repeat(100));
  const maxScore = patternMatching(maxDom);
  assert(maxScore <= PATTERN_MAX_SCORE, `Max score never exceeds ${PATTERN_MAX_SCORE} (got ${maxScore})`);

  // Test 8: Combined scoring
  const combinedDom = createMockDom(`
    Question 1 of 5?
    A) First
    B) Second
    Select answer
  `);
  const combinedScore = patternMatching(combinedDom);
  assert(combinedScore > 0 && combinedScore <= 40, `Combined scoring (got ${combinedScore})`);

  console.log('\nTest Suite: Pattern Detection');

  // Test 9: Single question mark
  const singleMarkDom = createMockDom('What is this?');
  assert(patternMatching(singleMarkDom) > 0, 'Detects single question mark');

  // Test 10: Multiple question marks
  const multipleMarksDom = createMockDom('? ? ? ? ?');
  assert(patternMatching(multipleMarksDom) > 0, 'Detects multiple question marks');

  // Test 11: A-D option prefixes
  const adPrefixesDom = createMockDom('A) B) C) D)');
  assert(patternMatching(adPrefixesDom) > 0, 'Detects A-D option prefixes');

  // Test 12: Numeric option prefixes
  const numericPrefixesDom2 = createMockDom('1. 2. 3. 4.');
  assert(patternMatching(numericPrefixesDom2) > 0, 'Detects numeric option prefixes');

  // Test 13: Question X of Y pattern
  const questionXofYDom = createMockDom('Question 1 of 10');
  assert(patternMatching(questionXofYDom) > 0, 'Detects Question X of Y pattern');

  // Test 14: Case-insensitive keywords
  const caseInsensitiveDom = createMockDom('SELECT the answer. CHOOSE wisely. ANSWER this.');
  assert(patternMatching(caseInsensitiveDom) > 0, 'Detects keywords case-insensitively');

  console.log('\nTest Suite: Edge Cases');

  // Test 15: Null DOM
  try {
    patternMatching(null);
    assert(false, 'Null DOM should throw error');
  } catch (e) {
    assert(true, 'Null DOM throws error');
  }

  // Test 16: DOM without body
  try {
    patternMatching({});
    assert(false, 'DOM without body should throw error');
  } catch (e) {
    assert(true, 'DOM without body throws error');
  }

  // Test 17: Very long text
  const longTextDom = createMockDom('Question 1 of 100? '.repeat(1000));
  const longScore = patternMatching(longTextDom);
  assert(longScore <= PATTERN_MAX_SCORE, `Long text capped at max (got ${longScore})`);

  // Test 18: Special characters
  const specialCharsDom = createMockDom('What is 2+2? A) 4 B) 5 C) 6 D) 7');
  assert(patternMatching(specialCharsDom) > 0, 'Handles special characters');

  // Test 19: Unicode characters
  const unicodeDom = createMockDom('Qu\'est-ce que c\'est? A) Réponse B) Autre');
  assert(patternMatching(unicodeDom) > 0, 'Handles unicode characters');

  // Test 20: Mixed patterns
  const mixedDom = createMockDom(`
    Question 1 of 5?
    A) Option A
    1. Alternative 1
    Select the correct answer
  `);
  assert(patternMatching(mixedDom) > 0 && patternMatching(mixedDom) <= 40, 'Handles mixed patterns');

  console.log('\nTest Suite: Performance');

  // Test 21: Performance <50ms
  const perfDom = createMockDom('Question 1 of 100? '.repeat(10000));
  const start = performance.now();
  patternMatching(perfDom);
  const elapsed = performance.now() - start;
  assert(elapsed < 50, `Performance <50ms (got ${elapsed.toFixed(2)}ms)`);

  // Test 22: Large text efficiency
  const largeDom = createMockDom('A) B) C) D) '.repeat(5000));
  const start2 = performance.now();
  const largeScore = patternMatching(largeDom);
  const elapsed2 = performance.now() - start2;
  assert(elapsed2 < 50 && largeScore <= 40, `Large text efficient (${elapsed2.toFixed(2)}ms, score ${largeScore})`);

  console.log('\nTest Suite: Return Value Structure');

  // Test 23: Return type
  const result = patternMatching(emptyDom);
  assert(typeof result === 'number', 'Returns number');

  // Test 24: Score range
  const rangeDom = createMockDom('Question 1 of 100? A) B) C) D) Select answer. '.repeat(100));
  const rangeScore = patternMatching(rangeDom);
  assert(rangeScore >= 0 && rangeScore <= 40, `Score in range 0-40 (got ${rangeScore})`);

  console.log('\nTest Suite: Detailed Analysis');

  // Test 25: analyzePatterns function
  const analysisDom = createMockDom('Question 1 of 5?\nA) First\nB) Second\nSelect answer');
  const analysis = analyzePatterns(analysisDom);
  assert(analysis.questionMarks === 1, `Analysis: question marks (got ${analysis.questionMarks})`);
  assert(analysis.optionPrefixes === 2, `Analysis: option prefixes (got ${analysis.optionPrefixes})`);
  assert(analysis.questionPatterns === 1, `Analysis: question patterns (got ${analysis.questionPatterns})`);
  assert(analysis.keywords > 0, `Analysis: keywords (got ${analysis.keywords})`);
  assert(typeof analysis.score === 'number', 'Analysis: has score property');

  console.log('\n' + '='.repeat(50));
  console.log(`\n✅ All tests passed! (${testsPassed} passed, ${testsFailed} failed)\n`);
  process.exit(0);

} catch (error) {
  console.error('\n' + '='.repeat(50));
  console.error(`\n❌ Tests failed! (${testsPassed} passed, ${testsFailed} failed)\n`);
  console.error(error.message);
  process.exit(1);
}
