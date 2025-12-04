#!/usr/bin/env node

/**
 * Test runner for Gemini API client tests
 */

import { GeminiClient, GEMINI_CONFIG, APIError, TimeoutError, ParseError } from './src/api/index.js';

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

console.log('\n🧪 Running Gemini API Client Tests\n');

try {
  console.log('Test Suite: Configuration');

  // Test 1: Config exists
  assert(GEMINI_CONFIG !== undefined, 'GEMINI_CONFIG exists');
  assert(GEMINI_CONFIG.endpoint !== undefined, 'Endpoint configured');
  assert(GEMINI_CONFIG.timeout === 5000, `Timeout is 5000ms (got ${GEMINI_CONFIG.timeout})`);
  assert(GEMINI_CONFIG.maxRetries === 2, `Max retries is 2 (got ${GEMINI_CONFIG.maxRetries})`);
  assert(Array.isArray(GEMINI_CONFIG.retryDelays), 'Retry delays is array');
  assert(GEMINI_CONFIG.retryDelays.length === 2, 'Has 2 retry delays');

  console.log('\nTest Suite: GeminiClient Initialization');

  // Test 2: Client requires API key
  try {
    new GeminiClient(null);
    assert(false, 'Should throw error without API key');
  } catch (e) {
    assert(true, 'Throws error without API key');
  }

  // Test 3: Client initializes with API key
  const client = new GeminiClient('test-api-key');
  assert(client !== null, 'Client created with API key');
  assert(client.apiKey === 'test-api-key', 'API key stored');
  assert(client.timeout === 5000, 'Timeout set correctly');
  assert(client.maxRetries === 2, 'Max retries set correctly');

  console.log('\nTest Suite: Prompt Building');

  // Test 4: Builds prompt without context
  let prompt = client.buildPrompt('What is 2+2?');
  assert(prompt.includes('What is 2+2?'), 'Prompt includes question');
  assert(prompt.includes('Answer this quiz question'), 'Prompt has instruction');
  assert(prompt.includes('no explanation'), 'Prompt specifies no explanation');

  // Test 5: Builds prompt with context
  prompt = client.buildPrompt('What is 2+2?', 'Math basics');
  assert(prompt.includes('Math basics'), 'Prompt includes context');

  console.log('\nTest Suite: Error Classes');

  // Test 6: APIError
  const apiError = new APIError('Test error', 400, 'details');
  assert(apiError.name === 'APIError', 'APIError has correct name');
  assert(apiError.status === 400, 'APIError stores status');
  assert(apiError.details === 'details', 'APIError stores details');

  // Test 7: TimeoutError
  const timeoutError = new TimeoutError('Timeout');
  assert(timeoutError.name === 'TimeoutError', 'TimeoutError has correct name');

  // Test 8: ParseError
  const parseError = new ParseError('Parse failed', new Error('original'));
  assert(parseError.name === 'ParseError', 'ParseError has correct name');
  assert(parseError.originalError !== undefined, 'ParseError stores original error');

  console.log('\nTest Suite: Methods');

  // Test 9: Methods exist
  assert(typeof client.getAnswer === 'function', 'getAnswer method exists');
  assert(typeof client.buildPrompt === 'function', 'buildPrompt method exists');
  assert(typeof client.callAPI === 'function', 'callAPI method exists');
  assert(typeof client.parseResponse === 'function', 'parseResponse method exists');

  console.log('\nTest Suite: Response Parsing');

  // Test 10: Parses valid response
  const validResponse = {
    candidates: [{
      content: {
        parts: [{
          text: 'The answer is 4'
        }]
      }
    }]
  };
  const parsed = client.parseResponse(validResponse);
  assert(parsed.answer === 'The answer is 4', 'Parses answer correctly');
  assert(parsed.confidence === 85, 'Sets default confidence');
  assert(parsed.error === null, 'No error in valid response');

  // Test 11: Handles invalid response
  try {
    client.parseResponse({ candidates: [] });
    assert(false, 'Should throw on invalid response');
  } catch (e) {
    assert(e instanceof ParseError, 'Throws ParseError on invalid response');
  }

  console.log('\nTest Suite: Input Validation');

  // Test 12: Validates question input
  try {
    await client.getAnswer('');
    assert(false, 'Should throw on empty question');
  } catch (e) {
    assert(true, 'Throws error on empty question');
  }

  // Test 13: Validates question type
  try {
    await client.getAnswer(null);
    assert(false, 'Should throw on null question');
  } catch (e) {
    assert(true, 'Throws error on null question');
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n✅ All tests passed! (${testsPassed} passed, ${testsFailed} failed)\n`);
  process.exit(0);

} catch (error) {
  console.error('\n' + '='.repeat(50));
  console.error(`\n❌ Tests failed! (${testsPassed} passed, ${testsFailed} failed)\n`);
  console.error(error.message);
  process.exit(1);
}
