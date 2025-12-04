#!/usr/bin/env node

/**
 * Validation script for ExplanationManager
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
    scrollX: 0,
    location: { hostname: 'example.com' }
  };
}

import { ExplanationManager } from './src/ui/explanation-manager.js';

console.log('🔍 Validating ExplanationManager Implementation\n');

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
    get: async () => null,
    set: async () => {}
  };

  // Mock API client
  const mockApiClient = {
    getAnswer: async () => ({
      answer: 'This is an explanation',
      confidence: 90
    })
  };

  // Test 1: Constructor validation
  try {
    new ExplanationManager(null);
    assert(false, 'Constructor throws error when cache is null');
  } catch (error) {
    assert(error.message.includes('Cache'), 'Constructor throws error when cache is null');
  }

  const manager = new ExplanationManager(mockCache, mockApiClient);
  assert(manager.cache === mockCache, 'Cache is set');
  assert(manager.apiClient === mockApiClient, 'API client is set');
  assert(Array.isArray(manager.feedbackLog), 'Feedback log is initialized');

  // Test 2: Constructor without API client
  const managerNoApi = new ExplanationManager(mockCache);
  assert(managerNoApi.apiClient === null, 'API client can be null');

  // Test 3: getExplanation validation
  try {
    await manager.getExplanation('', 'Answer');
    assert(false, 'getExplanation rejects empty question');
  } catch (error) {
    assert(error.message.includes('Question'), 'getExplanation rejects empty question');
  }

  try {
    await manager.getExplanation('Question?', '');
    assert(false, 'getExplanation rejects empty answer');
  } catch (error) {
    assert(error.message.includes('Answer'), 'getExplanation rejects empty answer');
  }

  // Test 4: getExplanation with API
  const explanation = await manager.getExplanation('Question?', 'Answer');
  assert(explanation === 'This is an explanation', 'getExplanation returns API response');

  // Test 5: getExplanation without API
  const explanationNoApi = await managerNoApi.getExplanation('Question?', 'Answer');
  assert(explanationNoApi.includes('not available'), 'getExplanation returns fallback without API');

  // Test 6: reportWrongAnswer validation
  try {
    await manager.reportWrongAnswer('', 'Answer');
    assert(false, 'reportWrongAnswer rejects empty question');
  } catch (error) {
    assert(error.message.includes('Question'), 'reportWrongAnswer rejects empty question');
  }

  try {
    await manager.reportWrongAnswer('Question?', '');
    assert(false, 'reportWrongAnswer rejects empty answer');
  } catch (error) {
    assert(error.message.includes('Answer'), 'reportWrongAnswer rejects empty answer');
  }

  // Test 7: reportWrongAnswer creates feedback
  const feedback = await manager.reportWrongAnswer('Question?', 'Wrong answer');
  assert(feedback.question === 'Question?', 'Feedback includes question');
  assert(feedback.answer === 'Wrong answer', 'Feedback includes answer');
  assert(feedback.timestamp !== undefined, 'Feedback includes timestamp');

  // Test 8: reportWrongAnswer stores feedback
  assert(manager.feedbackLog.length === 1, 'Feedback is stored');
  assert(manager.feedbackLog[0].question === 'Question?', 'Stored feedback is correct');

  // Test 9: reportWrongAnswer with user feedback
  const feedbackWithComment = await manager.reportWrongAnswer('Q2', 'A2', 'This is wrong');
  assert(feedbackWithComment.userFeedback === 'This is wrong', 'User feedback is stored');

  // Test 10: storeFeedback
  await manager.storeFeedback({ question: 'Q3', answer: 'A3', timestamp: Date.now() });
  assert(manager.feedbackLog.length === 3, 'storeFeedback adds to log');

  // Test 11: storeFeedback validation
  try {
    await manager.storeFeedback(null);
    assert(false, 'storeFeedback rejects null');
  } catch (error) {
    assert(error.message.includes('Feedback must be'), 'storeFeedback rejects null');
  }

  // Test 12: getFeedbackStats
  const stats = manager.getFeedbackStats();
  assert(stats.totalFeedback === 3, 'Stats show correct total');
  assert(stats.maxLogs === 100, 'Stats show max logs');
  assert(stats.lastUpdated !== null, 'Stats show last updated');

  // Test 13: getFeedbackLogs
  const logs = manager.getFeedbackLogs();
  assert(logs.length === 3, 'getFeedbackLogs returns all logs');
  assert(logs !== manager.feedbackLog, 'getFeedbackLogs returns copy');

  // Test 14: clearFeedbackLogs
  manager.clearFeedbackLogs();
  assert(manager.feedbackLog.length === 0, 'clearFeedbackLogs clears all');

  // Test 15: escapeHTML
  const escaped = manager.escapeHTML('<script>alert("xss")</script>');
  assert(!escaped.includes('<script>'), 'escapeHTML removes script tags');

  // Test 16: setApiClient
  const newApiClient = {
    getAnswer: async () => ({ answer: 'New explanation', confidence: 95 })
  };
  manager.setApiClient(newApiClient);
  assert(manager.apiClient === newApiClient, 'setApiClient updates API client');

  // Test 17: setApiClient validation
  try {
    manager.setApiClient(null);
    assert(false, 'setApiClient rejects null');
  } catch (error) {
    assert(error.message.includes('API client'), 'setApiClient rejects null');
  }

  try {
    manager.setApiClient({});
    assert(false, 'setApiClient rejects invalid client');
  } catch (error) {
    assert(error.message.includes('getAnswer'), 'setApiClient rejects invalid client');
  }

  // Test 18: getApiClient
  assert(manager.getApiClient() === newApiClient, 'getApiClient returns current client');

  // Test 19: Max feedback logs
  manager.maxFeedbackLogs = 5;
  for (let i = 0; i < 10; i++) {
    await manager.storeFeedback({ question: `Q${i}`, answer: `A${i}`, timestamp: Date.now() });
  }
  assert(manager.feedbackLog.length <= 5, 'Max feedback logs is enforced');

  // Test 20: displayExplanation validation
  try {
    manager.displayExplanation(null, 'Explanation');
    assert(false, 'displayExplanation rejects null tooltip');
  } catch (error) {
    assert(error.message.includes('Tooltip'), 'displayExplanation rejects null tooltip');
  }

  try {
    const tooltip = document.createElement('div');
    manager.displayExplanation(tooltip, '');
    assert(false, 'displayExplanation rejects empty explanation');
  } catch (error) {
    assert(error.message.includes('Explanation'), 'displayExplanation rejects empty explanation');
  }

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
