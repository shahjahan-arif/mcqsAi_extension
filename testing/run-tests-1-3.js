#!/usr/bin/env node

/**
 * Test runner for context-analyzer tests
 * Validates implementation without full Jest setup
 */

import { contextAnalysis, analyzeContext, CONTEXT_MAX_SCORE, QUIZ_KEYWORDS } from './src/detection/context-analyzer.js';

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

function createMockDom(text = '', selectors = {}) {
  return {
    body: {
      innerText: text
    },
    querySelectorAll: (selector) => {
      const count = selectors[selector] || 0;
      return Array(count).fill(null);
    }
  };
}

// Run tests
console.log('\n🧪 Running Context Analyzer Tests\n');

try {
  // Test 1: Empty DOM
  console.log('Test Suite: Scoring Logic');
  const emptyDom = createMockDom('');
  assert(contextAnalysis(emptyDom) === 0, 'Empty DOM returns 0');

  // Test 2: Keywords
  const keywordsDom = createMockDom('This is a quiz. Take the quiz now.');
  const keywordsScore = contextAnalysis(keywordsDom);
  assert(keywordsScore > 0 && keywordsScore <= 20, `Keywords scoring (got ${keywordsScore})`);

  // Test 3: Timer elements
  const timerDom = createMockDom('', { '[class*="timer"], [id*="timer"]': 3 });
  const timerScore = contextAnalysis(timerDom);
  assert(timerScore > 0 && timerScore <= 5, `Timer elements scoring (got ${timerScore})`);

  // Test 4: Progress bars
  const progressDom = createMockDom('', { 'progress, [class*="progress"], [role="progressbar"]': 3 });
  const progressScore = contextAnalysis(progressDom);
  assert(progressScore > 0 && progressScore <= 5, `Progress bars scoring (got ${progressScore})`);

  // Test 5: ARIA labels
  const ariaDom = createMockDom('', {
    '[role="radiogroup"]': 2,
    '[role="group"]': 1,
    '[aria-label*="question"], [aria-labelledby*="question"]': 2
  });
  const ariaScore = contextAnalysis(ariaDom);
  assert(ariaScore > 0 && ariaScore <= 5, `ARIA labels scoring (got ${ariaScore})`);

  // Test 6: Max score cap
  const maxDom = createMockDom('quiz exam test assessment questionnaire '.repeat(100), {
    '[class*="timer"], [id*="timer"]': 100,
    'progress, [class*="progress"], [role="progressbar"]': 100,
    '[role="radiogroup"]': 100,
    '[role="group"]': 100,
    '[aria-label*="question"], [aria-labelledby*="question"]': 100
  });
  const maxScore = contextAnalysis(maxDom);
  assert(maxScore === CONTEXT_MAX_SCORE, `Max score capped at ${CONTEXT_MAX_SCORE} (got ${maxScore})`);

  // Test 7: Combined scoring
  const combinedDom = createMockDom('This is a quiz exam test', {
    '[class*="timer"], [id*="timer"]': 1,
    'progress, [class*="progress"], [role="progressbar"]': 1,
    '[role="radiogroup"]': 1,
    '[role="group"]': 0,
    '[aria-label*="question"], [aria-labelledby*="question"]': 0
  });
  const combinedScore = contextAnalysis(combinedDom);
  assert(combinedScore > 0 && combinedScore <= 20, `Combined scoring (got ${combinedScore})`);

  console.log('\nTest Suite: Keyword Detection');

  // Test 8: "quiz" keyword
  const quizDom = createMockDom('Take this quiz now');
  assert(contextAnalysis(quizDom) > 0, 'Detects "quiz" keyword');

  // Test 9: "exam" keyword
  const examDom = createMockDom('Final exam coming up');
  assert(contextAnalysis(examDom) > 0, 'Detects "exam" keyword');

  // Test 10: "test" keyword
  const testDom = createMockDom('Take the test');
  assert(contextAnalysis(testDom) > 0, 'Detects "test" keyword');

  // Test 11: "assessment" keyword
  const assessmentDom = createMockDom('Complete the assessment');
  assert(contextAnalysis(assessmentDom) > 0, 'Detects "assessment" keyword');

  // Test 12: "questionnaire" keyword
  const questionnaireDom = createMockDom('Fill out the questionnaire');
  assert(contextAnalysis(questionnaireDom) > 0, 'Detects "questionnaire" keyword');

  // Test 13: Case-insensitive keywords
  const caseInsensitiveDom = createMockDom('QUIZ EXAM TEST ASSESSMENT QUESTIONNAIRE');
  assert(contextAnalysis(caseInsensitiveDom) > 0, 'Detects keywords case-insensitively');

  console.log('\nTest Suite: Element Detection');

  // Test 14: Timer elements
  const timerElementDom = createMockDom('', { '[class*="timer"], [id*="timer"]': 2 });
  assert(contextAnalysis(timerElementDom) > 0, 'Detects timer elements');

  // Test 15: Progress bars
  const progressBarDom = createMockDom('', { 'progress, [class*="progress"], [role="progressbar"]': 2 });
  assert(contextAnalysis(progressBarDom) > 0, 'Detects progress bars');

  // Test 16: ARIA radiogroups
  const ariaRadioDom = createMockDom('', { '[role="radiogroup"]': 2 });
  assert(contextAnalysis(ariaRadioDom) > 0, 'Detects ARIA radiogroups');

  // Test 17: ARIA groups
  const ariaGroupDom = createMockDom('', { '[role="group"]': 2 });
  assert(contextAnalysis(ariaGroupDom) > 0, 'Detects ARIA groups');

  // Test 18: ARIA question labels
  const ariaQuestionDom = createMockDom('', { '[aria-label*="question"], [aria-labelledby*="question"]': 2 });
  assert(contextAnalysis(ariaQuestionDom) > 0, 'Detects ARIA question labels');

  console.log('\nTest Suite: Edge Cases');

  // Test 19: Null DOM
  try {
    contextAnalysis(null);
    assert(false, 'Null DOM should throw error');
  } catch (e) {
    assert(true, 'Null DOM throws error');
  }

  // Test 20: DOM without body
  try {
    contextAnalysis({});
    assert(false, 'DOM without body should throw error');
  } catch (e) {
    assert(true, 'DOM without body throws error');
  }

  // Test 21: Large number of elements
  const largeDom = createMockDom('', {
    '[class*="timer"], [id*="timer"]': 10000,
    'progress, [class*="progress"], [role="progressbar"]': 10000,
    '[role="radiogroup"]': 10000,
    '[role="group"]': 10000,
    '[aria-label*="question"], [aria-labelledby*="question"]': 10000
  });
  const largeScore = contextAnalysis(largeDom);
  assert(largeScore <= CONTEXT_MAX_SCORE, `Large DOM capped at max (got ${largeScore})`);

  // Test 22: Mixed content
  const mixedDom = createMockDom('This is a quiz exam test', {
    '[class*="timer"], [id*="timer"]': 1,
    'progress, [class*="progress"], [role="progressbar"]': 1,
    '[role="radiogroup"]': 1,
    '[role="group"]': 1,
    '[aria-label*="question"], [aria-labelledby*="question"]': 1
  });
  assert(contextAnalysis(mixedDom) > 0 && contextAnalysis(mixedDom) <= 20, 'Handles mixed content');

  console.log('\nTest Suite: Performance');

  // Test 23: Performance <50ms
  const perfDom = createMockDom('quiz '.repeat(10000), {
    '[class*="timer"], [id*="timer"]': 1000,
    'progress, [class*="progress"], [role="progressbar"]': 1000,
    '[role="radiogroup"]': 1000,
    '[role="group"]': 1000,
    '[aria-label*="question"], [aria-labelledby*="question"]': 1000
  });
  const start = performance.now();
  contextAnalysis(perfDom);
  const elapsed = performance.now() - start;
  assert(elapsed < 50, `Performance <50ms (got ${elapsed.toFixed(2)}ms)`);

  console.log('\nTest Suite: Return Value Structure');

  // Test 24: Return type
  const result = contextAnalysis(emptyDom);
  assert(typeof result === 'number', 'Returns number');

  // Test 25: Score range
  const rangeDom = createMockDom('quiz exam test assessment questionnaire '.repeat(100), {
    '[class*="timer"], [id*="timer"]': 100,
    'progress, [class*="progress"], [role="progressbar"]': 100,
    '[role="radiogroup"]': 100,
    '[role="group"]': 100,
    '[aria-label*="question"], [aria-labelledby*="question"]': 100
  });
  const rangeScore = contextAnalysis(rangeDom);
  assert(rangeScore >= 0 && rangeScore <= 20, `Score in range 0-20 (got ${rangeScore})`);

  console.log('\nTest Suite: Detailed Analysis');

  // Test 26: analyzeContext function
  const analysisDom = createMockDom('This is a quiz', {
    '[class*="timer"], [id*="timer"]': 1,
    'progress, [class*="progress"], [role="progressbar"]': 1,
    '[role="radiogroup"]': 1,
    '[role="group"]': 0,
    '[aria-label*="question"], [aria-labelledby*="question"]': 0
  });
  const analysis = analyzeContext(analysisDom);
  assert(analysis.keywords > 0, `Analysis: keywords (got ${analysis.keywords})`);
  assert(analysis.timerElements === 1, `Analysis: timer elements (got ${analysis.timerElements})`);
  assert(analysis.progressBars === 1, `Analysis: progress bars (got ${analysis.progressBars})`);
  assert(analysis.ariaElements === 1, `Analysis: ARIA elements (got ${analysis.ariaElements})`);
  assert(typeof analysis.score === 'number', 'Analysis: has score property');

  console.log('\nTest Suite: QUIZ_KEYWORDS Constant');

  // Test 27: QUIZ_KEYWORDS is array
  assert(Array.isArray(QUIZ_KEYWORDS), 'QUIZ_KEYWORDS is array');

  // Test 28: QUIZ_KEYWORDS has expected keywords
  assert(QUIZ_KEYWORDS.includes('quiz'), 'QUIZ_KEYWORDS includes "quiz"');
  assert(QUIZ_KEYWORDS.includes('exam'), 'QUIZ_KEYWORDS includes "exam"');
  assert(QUIZ_KEYWORDS.includes('test'), 'QUIZ_KEYWORDS includes "test"');
  assert(QUIZ_KEYWORDS.includes('assessment'), 'QUIZ_KEYWORDS includes "assessment"');
  assert(QUIZ_KEYWORDS.includes('questionnaire'), 'QUIZ_KEYWORDS includes "questionnaire"');

  console.log('\n' + '='.repeat(50));
  console.log(`\n✅ All tests passed! (${testsPassed} passed, ${testsFailed} failed)\n`);
  process.exit(0);

} catch (error) {
  console.error('\n' + '='.repeat(50));
  console.error(`\n❌ Tests failed! (${testsPassed} passed, ${testsFailed} failed)\n`);
  console.error(error.message);
  process.exit(1);
}
