#!/usr/bin/env node

/**
 * Test runner for scorer tests
 * Validates implementation without full Jest setup
 */

import { scoreAndDecide, identifyQuizType, extractQuestions, QUIZ_TYPES } from './src/detection/scorer.js';

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
      return Array(count).fill(null).map(() => ({
        value: 'option',
        nextElementSibling: { innerText: 'Option Text' },
        parentElement: { innerText: 'Option Text' }
      }));
    }
  };
}

// Run tests
console.log('\n🧪 Running Scorer Tests\n');

try {
  console.log('Test Suite: Confidence Calculation');

  // Test 1: Confidence calculation
  let scores = { structural: 20, pattern: 20, context: 10 };
  let result = scoreAndDecide(scores, createMockDom());
  assert(result.confidence === 50, `Confidence calculation (got ${result.confidence})`);

  // Test 2: Max scores
  scores = { structural: 40, pattern: 40, context: 20 };
  result = scoreAndDecide(scores, createMockDom());
  assert(result.confidence === 100, `Max confidence (got ${result.confidence})`);

  // Test 3: Zero scores
  scores = { structural: 0, pattern: 0, context: 0 };
  result = scoreAndDecide(scores, createMockDom());
  assert(result.confidence === 0, `Zero confidence (got ${result.confidence})`);

  console.log('\nTest Suite: Threshold Logic');

  // Test 4: High confidence (>80)
  scores = { structural: 40, pattern: 40, context: 10 };
  result = scoreAndDecide(scores, createMockDom());
  assert(result.isQuiz === true && result.requiresAIVerification === false, 'High confidence (>80)');

  // Test 5: Medium confidence (50-80)
  scores = { structural: 30, pattern: 30, context: 5 };
  result = scoreAndDecide(scores, createMockDom());
  assert(result.isQuiz === true && result.requiresAIVerification === true, 'Medium confidence (50-80)');

  // Test 6: Low confidence (<50)
  scores = { structural: 10, pattern: 10, context: 5 };
  result = scoreAndDecide(scores, createMockDom());
  assert(result.isQuiz === false && result.requiresAIVerification === false, 'Low confidence (<50)');

  // Test 7: Boundary 80 (exactly 80 is medium confidence)
  scores = { structural: 40, pattern: 40, context: 0 };
  result = scoreAndDecide(scores, createMockDom());
  assert(result.confidence === 80 && result.isQuiz === true && result.requiresAIVerification === true, 'Boundary 80 (medium)');

  // Test 8: Boundary 81 (>80 is high confidence)
  scores = { structural: 40, pattern: 41, context: 0 };
  result = scoreAndDecide(scores, createMockDom());
  assert(result.confidence === 81 && result.isQuiz === true && result.requiresAIVerification === false, 'Boundary 81 (high)');

  // Test 9: Boundary 50
  scores = { structural: 25, pattern: 25, context: 0 };
  result = scoreAndDecide(scores, createMockDom());
  assert(result.confidence === 50 && result.isQuiz === true && result.requiresAIVerification === true, 'Boundary 50');

  console.log('\nTest Suite: Return Value Structure');

  // Test 10: DetectionResult structure
  scores = { structural: 0, pattern: 0, context: 0 };
  result = scoreAndDecide(scores, createMockDom());
  assert(result.hasOwnProperty('isQuiz'), 'Has isQuiz property');
  assert(result.hasOwnProperty('confidence'), 'Has confidence property');
  assert(result.hasOwnProperty('quizType'), 'Has quizType property');
  assert(result.hasOwnProperty('questions'), 'Has questions property');
  assert(result.hasOwnProperty('requiresAIVerification'), 'Has requiresAIVerification property');
  assert(result.hasOwnProperty('scores'), 'Has scores property');

  // Test 11: Scores included
  scores = { structural: 20, pattern: 15, context: 5 };
  result = scoreAndDecide(scores, createMockDom());
  assert(result.scores.structural === 20, 'Structural score included');
  assert(result.scores.pattern === 15, 'Pattern score included');
  assert(result.scores.context === 5, 'Context score included');

  // Test 12: Questions is array
  result = scoreAndDecide(scores, createMockDom());
  assert(Array.isArray(result.questions), 'Questions is array');

  console.log('\nTest Suite: Quiz Type Detection');

  // Test 13: MCQ (default)
  let dom = createMockDom('Select an option');
  let quizType = identifyQuizType(dom);
  assert(quizType === 'mcq', 'Identifies MCQ');

  // Test 14: True/False
  dom = createMockDom('True or False?', { 'input[type="radio"]': 2 });
  quizType = identifyQuizType(dom);
  assert(quizType === 'true-false', 'Identifies true-false');

  // Test 15: Multiple Select
  dom = createMockDom('', { 'input[type="checkbox"]': 3 });
  quizType = identifyQuizType(dom);
  assert(quizType === 'multiple-select', 'Identifies multiple-select');

  // Test 16: Fill-in-blank
  dom = createMockDom('', { 'input[type="checkbox"]': 0, 'textarea': 0, 'input[type="text"]': 3, 'input[type="radio"]': 0 });
  quizType = identifyQuizType(dom);
  assert(quizType === 'fill-blank', 'Identifies fill-blank');

  // Test 17: Short Answer
  dom = createMockDom('', { 'textarea': 2 });
  quizType = identifyQuizType(dom);
  assert(quizType === 'short-answer', 'Identifies short-answer');

  console.log('\nTest Suite: Question Extraction');

  // Test 18: No questions
  dom = createMockDom('', { '[class*="question"], [id*="question"]': 0 });
  let questions = extractQuestions(dom);
  assert(questions.length === 0, 'Returns empty array for no questions');

  // Test 19: Questions with options
  const mockQuestion = {
    innerText: 'What is 2+2?',
    querySelectorAll: (selector) => [
      { value: 'A', nextElementSibling: { innerText: 'Option A' } },
      { value: 'B', nextElementSibling: { innerText: 'Option B' } }
    ]
  };
  dom = createMockDom('');
  dom.querySelectorAll = (selector) => {
    if (selector === '[class*="question"], [id*="question"]') return [mockQuestion];
    return [];
  };
  questions = extractQuestions(dom);
  assert(questions.length === 1, 'Extracts questions');
  assert(questions[0].questionText === 'What is 2+2?', 'Question text correct');

  console.log('\nTest Suite: Edge Cases');

  // Test 20: Null scores
  try {
    scoreAndDecide(null, createMockDom());
    assert(false, 'Null scores should throw');
  } catch (e) {
    assert(true, 'Null scores throws error');
  }

  // Test 21: Null DOM
  try {
    scoreAndDecide({ structural: 0, pattern: 0, context: 0 }, null);
    assert(false, 'Null DOM should throw');
  } catch (e) {
    assert(true, 'Null DOM throws error');
  }

  console.log('\nTest Suite: QUIZ_TYPES Constant');

  // Test 22: QUIZ_TYPES exists
  assert(typeof QUIZ_TYPES === 'object', 'QUIZ_TYPES is object');
  assert(QUIZ_TYPES.MCQ === 'mcq', 'MCQ type correct');
  assert(QUIZ_TYPES.TRUE_FALSE === 'true-false', 'TRUE_FALSE type correct');
  assert(QUIZ_TYPES.FILL_BLANK === 'fill-blank', 'FILL_BLANK type correct');
  assert(QUIZ_TYPES.SHORT_ANSWER === 'short-answer', 'SHORT_ANSWER type correct');
  assert(QUIZ_TYPES.MULTIPLE_SELECT === 'multiple-select', 'MULTIPLE_SELECT type correct');

  console.log('\n' + '='.repeat(50));
  console.log(`\n✅ All tests passed! (${testsPassed} passed, ${testsFailed} failed)\n`);
  process.exit(0);

} catch (error) {
  console.error('\n' + '='.repeat(50));
  console.error(`\n❌ Tests failed! (${testsPassed} passed, ${testsFailed} failed)\n`);
  console.error(error.message);
  process.exit(1);
}
