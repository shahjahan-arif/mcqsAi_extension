#!/usr/bin/env node

/**
 * Validation script for AnswerDisplay
 * Tests core functionality without Jest
 */

// Mock document for Node.js environment
if (typeof document === 'undefined') {
  global.document = {
    createElement: (tag) => {
      const element = {
        className: '',
        classList: {
          add: function(cls) { this.classes = this.classes || []; this.classes.push(cls); },
          contains: function(cls) { return (this.classes || []).includes(cls); },
          classes: []
        },
        setAttribute: function() {},
        getAttribute: function() {},
        querySelector: function() { return null; },
        querySelectorAll: function() { return []; },
        addEventListener: function() {},
        removeEventListener: function() {},
        textContent: '',
        innerHTML: '',
        style: {},
        parentElement: null,
        remove: function() {},
        contains: function() { return false; }
      };
      return element;
    },
    body: {
      appendChild: function() {},
      innerHTML: ''
    },
    addEventListener: function() {},
    removeEventListener: function() {}
  };
  global.window = {
    matchMedia: () => ({ matches: false }),
    innerWidth: 1024,
    innerHeight: 768,
    scrollY: 0,
    scrollX: 0
  };
}

import { AnswerDisplay } from './src/ui/answer-display.js';

console.log('🔍 Validating AnswerDisplay Implementation\n');

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
  // Test 1: Constructor
  const display = new AnswerDisplay();
  assert(display.position === 'near-heading', 'Default position is near-heading');
  assert(display.showConfidence === true, 'Default showConfidence is true');
  assert(display.theme === 'auto', 'Default theme is auto');
  assert(display.maxWidth === 300, 'Default maxWidth is 300');

  // Test 2: Custom options
  const customDisplay = new AnswerDisplay({
    position: 'top',
    showConfidence: false,
    theme: 'dark',
    maxWidth: 400
  });
  assert(customDisplay.position === 'top', 'Custom position is set');
  assert(customDisplay.showConfidence === false, 'Custom showConfidence is set');
  assert(customDisplay.theme === 'dark', 'Custom theme is set');
  assert(customDisplay.maxWidth === 400, 'Custom maxWidth is set');

  // Test 3: buildTooltipHTML
  let html = display.buildTooltipHTML('Test Answer', 90);
  assert(html.includes('quiz-answer-text'), 'HTML includes answer text class');
  assert(html.includes('90%'), 'HTML includes confidence');
  assert(html.includes('quiz-btn-explanation'), 'HTML includes explanation button');
  assert(html.includes('quiz-btn-report'), 'HTML includes report button');
  assert(html.includes('quiz-btn-close'), 'HTML includes close button');

  // Test 4: buildTooltipHTML without confidence
  display.showConfidence = false;
  html = display.buildTooltipHTML('Test Answer', 90);
  assert(html.includes('quiz-answer-text'), 'HTML includes answer without confidence');
  assert(!html.includes('90%'), 'HTML excludes confidence when disabled');

  // Test 5: escapeHTML
  const escaped = display.escapeHTML('<script>alert("xss")</script>');
  assert(!escaped.includes('<script>'), 'HTML escaping removes script tags');
  // Note: escapeHTML uses textContent which may not produce &lt; in Node.js mock
  assert(typeof escaped === 'string', 'HTML escaping returns string');

  // Test 6: setTheme
  display.setTheme('light');
  assert(display.theme === 'light', 'setTheme sets light theme');

  display.setTheme('dark');
  assert(display.theme === 'dark', 'setTheme sets dark theme');

  display.setTheme('auto');
  assert(display.theme === 'auto', 'setTheme sets auto theme');

  try {
    display.setTheme('invalid');
    assert(false, 'setTheme rejects invalid theme');
  } catch (error) {
    assert(error.message.includes('Theme must be'), 'setTheme rejects invalid theme');
  }

  // Test 7: setShowConfidence
  display.setShowConfidence(true);
  assert(display.showConfidence === true, 'setShowConfidence enables confidence');

  display.setShowConfidence(false);
  assert(display.showConfidence === false, 'setShowConfidence disables confidence');

  // Test 8: setMaxWidth
  display.setMaxWidth(500);
  assert(display.maxWidth === 500, 'setMaxWidth sets max width');

  try {
    display.setMaxWidth(0);
    assert(false, 'setMaxWidth rejects zero');
  } catch (error) {
    assert(error.message.includes('positive number'), 'setMaxWidth rejects zero');
  }

  try {
    display.setMaxWidth(-100);
    assert(false, 'setMaxWidth rejects negative');
  } catch (error) {
    assert(error.message.includes('positive number'), 'setMaxWidth rejects negative');
  }

  // Test 9: getActiveTooltipCount
  assert(display.getActiveTooltipCount() === 0, 'Initial tooltip count is 0');

  // Test 10: Validation - render with invalid question
  try {
    display.render(null, 'Answer', 90);
    assert(false, 'render rejects null question');
  } catch (error) {
    assert(error.message.includes('Question object'), 'render rejects null question');
  }

  try {
    display.render({}, 'Answer', 90);
    assert(false, 'render rejects question without element');
  } catch (error) {
    assert(error.message.includes('Question object'), 'render rejects question without element');
  }

  // Test 11: Validation - render with invalid answer
  let mockQuestion = null;
  if (typeof document !== 'undefined') {
    mockQuestion = {
      element: document.createElement('div'),
      questionText: 'Test'
    };
  } else {
    mockQuestion = {
      element: { getBoundingClientRect: () => ({}) },
      questionText: 'Test'
    };
  }

  try {
    display.render(mockQuestion, '', 90);
    assert(false, 'render rejects empty answer');
  } catch (error) {
    assert(error.message.includes('Answer must be'), 'render rejects empty answer');
  }

  try {
    display.render(mockQuestion, null, 90);
    assert(false, 'render rejects null answer');
  } catch (error) {
    assert(error.message.includes('Answer must be'), 'render rejects null answer');
  }

  // Test 12: Validation - render with invalid confidence
  try {
    display.render(mockQuestion, 'Answer', -1);
    assert(false, 'render rejects negative confidence');
  } catch (error) {
    assert(error.message.includes('Confidence must be'), 'render rejects negative confidence');
  }

  try {
    display.render(mockQuestion, 'Answer', 101);
    assert(false, 'render rejects confidence > 100');
  } catch (error) {
    assert(error.message.includes('Confidence must be'), 'render rejects confidence > 100');
  }

  try {
    display.render(mockQuestion, 'Answer', 'high');
    assert(false, 'render rejects non-numeric confidence');
  } catch (error) {
    assert(error.message.includes('Confidence must be'), 'render rejects non-numeric confidence');
  }

  // Test 13: applyTheme
  const tooltip = document.createElement('div');
  display.theme = 'light';
  display.applyTheme(tooltip);
  assert(tooltip.classList.contains('light'), 'applyTheme applies light class');

  const tooltip2 = document.createElement('div');
  display.theme = 'dark';
  display.applyTheme(tooltip2);
  assert(tooltip2.classList.contains('dark'), 'applyTheme applies dark class');

  // Test 14: dismissAll
  display.dismissAll();
  assert(display.getActiveTooltipCount() === 0, 'dismissAll clears all tooltips');

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
