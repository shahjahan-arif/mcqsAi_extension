#!/usr/bin/env node

/**
 * Validation script for RequestQueue
 * Tests core functionality without Jest
 */

import { RequestQueue } from './src/api/request-queue.js';
import { APIError, TimeoutError } from './src/api/errors.js';

console.log('🔍 Validating RequestQueue Implementation\n');

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
  // Mock rate limiter
  const mockRateLimiter = {
    checkLimit: async () => ({ allowed: true }),
    waitForSlot: async () => {},
    recordRequest: async () => {}
  };

  // Mock API client
  let callCount = 0;
  const mockApiClient = {
    getAnswer: async (question, context) => {
      callCount++;
      return { answer: 'Test Answer', confidence: 90 };
    }
  };

  // Test 1: Constructor validation
  try {
    new RequestQueue(null, mockApiClient);
    assert(false, 'Constructor throws error when rate limiter is null');
  } catch (error) {
    assert(error.message.includes('Rate limiter'), 'Constructor throws error when rate limiter is null');
  }

  try {
    new RequestQueue(mockRateLimiter, null);
    assert(false, 'Constructor throws error when API client is null');
  } catch (error) {
    assert(error.message.includes('API client'), 'Constructor throws error when API client is null');
  }

  const queue = new RequestQueue(mockRateLimiter, mockApiClient);
  assert(queue.queue.length === 0, 'Queue starts empty');
  assert(queue.processing === false, 'Processing starts as false');
  assert(queue.logs.length === 0, 'Logs start empty');

  // Test 2: Enqueue and process
  callCount = 0;
  const result = await queue.enqueue('What is 2+2?');
  assert(result.answer === 'Test Answer', 'Enqueue returns API response');
  assert(callCount === 1, 'API called once for single request');

  // Test 3: FIFO order
  callCount = 0;
  const callOrder = [];
  mockApiClient.getAnswer = async (question) => {
    callOrder.push(question);
    return { answer: 'Answer', confidence: 90 };
  };

  const p1 = queue.enqueue('Q1');
  const p2 = queue.enqueue('Q2');
  const p3 = queue.enqueue('Q3');

  await Promise.all([p1, p2, p3]);
  assert(callOrder[0] === 'Q1', 'First request processed first');
  assert(callOrder[1] === 'Q2', 'Second request processed second');
  assert(callOrder[2] === 'Q3', 'Third request processed third');

  // Test 4: Retry logic - transient error
  callCount = 0;
  let attemptCount = 0;
  mockApiClient.getAnswer = async () => {
    attemptCount++;
    if (attemptCount === 1) {
      throw new TimeoutError('Timeout');
    }
    return { answer: 'Success', confidence: 90 };
  };

  const retryResult = await queue.enqueue('Retry test');
  assert(retryResult.answer === 'Success', 'Retry succeeds after transient error');
  assert(attemptCount === 2, 'API called twice (1 initial + 1 retry)');

  // Test 5: No retry on permanent error
  attemptCount = 0;
  mockApiClient.getAnswer = async () => {
    attemptCount++;
    throw new APIError('Unauthorized', 401, 'Invalid key');
  };

  const permanentErrorPromise = queue.enqueue('Permanent error test');
  try {
    await permanentErrorPromise;
    assert(false, 'Permanent error is rejected');
  } catch (error) {
    assert(attemptCount === 1, 'API called once for permanent error (no retry)');
    assert(error.message.includes('Unauthorized'), 'Error message preserved');
  }

  // Test 6: isRetryable
  assert(queue.isRetryable(new TimeoutError('Timeout')), 'Timeout is retryable');
  assert(queue.isRetryable(new APIError('Error', 429, 'Rate limit')), '429 is retryable');
  assert(queue.isRetryable(new APIError('Error', 500, 'Server error')), '500 is retryable');
  assert(!queue.isRetryable(new APIError('Error', 401, 'Unauthorized')), '401 is not retryable');
  assert(!queue.isRetryable(new APIError('Error', 403, 'Forbidden')), '403 is not retryable');
  assert(!queue.isRetryable(new Error('Unknown')), 'Unknown error is not retryable');

  // Test 7: Logging
  queue.clearLogs();
  mockApiClient.getAnswer = async () => ({ answer: 'Test', confidence: 90 });

  await queue.enqueue('Log test');
  assert(queue.logs.length > 0, 'Request is logged');
  assert(queue.logs[0].status === 'success', 'Success status is logged');
  assert(queue.logs[0].timestamp > 0, 'Timestamp is recorded');

  // Test 8: Log truncation
  queue.clearLogs();
  const longQuestion = 'A'.repeat(200);
  await queue.enqueue(longQuestion);
  assert(queue.logs[0].question.length <= 100, 'Long questions are truncated in logs');

  // Test 9: Queue stats
  const stats = queue.getQueueStats();
  assert(stats.hasOwnProperty('queueLength'), 'Stats include queueLength');
  assert(stats.hasOwnProperty('processing'), 'Stats include processing');
  assert(stats.hasOwnProperty('totalLogged'), 'Stats include totalLogged');

  // Test 10: Queue length and processing status
  assert(queue.getQueueLength() === 0, 'Queue length is 0 when empty');
  assert(queue.isProcessing() === false, 'Processing is false when idle');

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
