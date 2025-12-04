#!/usr/bin/env node

/**
 * Validation script for RateLimiter
 * Tests core functionality without Jest
 */

import { RateLimiter } from './src/api/rate-limiter.js';

console.log('🔍 Validating RateLimiter Implementation\n');

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
  const limiter = new RateLimiter();
  assert(limiter.perMinuteLimit === 15, 'Per-minute limit is 15');
  assert(limiter.perDayLimit === 1500, 'Per-day limit is 1500');
  assert(limiter.requestsPerSecond === 2, 'Request rate is 2 per second');
  assert(limiter.dailyCount === 0, 'Daily count starts at 0');
  assert(limiter.requestTimestamps.length === 0, 'Request timestamps start empty');

  // Test 2: Initial check limit
  const initialCheck = await limiter.checkLimit();
  assert(initialCheck.allowed === true, 'Initial request is allowed');

  // Test 3: Record request
  await limiter.recordRequest();
  assert(limiter.dailyCount === 1, 'Daily count increments after record');
  assert(limiter.requestTimestamps.length === 1, 'Timestamp recorded');

  // Test 4: Stats
  const stats = limiter.getStats();
  assert(stats.dailyCount === 1, 'Stats show correct daily count');
  assert(stats.dailyRemaining === 1499, 'Stats show correct daily remaining');
  assert(stats.requestsThisMinute === 1, 'Stats show correct requests this minute');
  assert(stats.minuteRemaining === 14, 'Stats show correct minute remaining');

  // Test 5: Multiple requests
  for (let i = 0; i < 14; i++) {
    await limiter.recordRequest();
  }
  assert(limiter.dailyCount === 15, 'Daily count is 15 after 15 requests');

  // Test 6: Per-minute limit exceeded
  const limitCheck = await limiter.checkLimit();
  assert(limitCheck.allowed === false, 'Request denied when per-minute limit exceeded');
  assert(limitCheck.reason.includes('Per-minute limit exceeded'), 'Correct error reason');
  assert(limitCheck.retryAfter > 0, 'Retry-after is positive');

  // Test 7: Reset
  limiter.reset();
  assert(limiter.dailyCount === 0, 'Daily count reset to 0');
  assert(limiter.requestTimestamps.length === 0, 'Timestamps cleared on reset');

  // Test 8: Daily limit
  limiter.dailyCount = 1500;
  const dailyLimitCheck = await limiter.checkLimit();
  assert(dailyLimitCheck.allowed === false, 'Request denied when daily limit exceeded');
  assert(dailyLimitCheck.reason.includes('Daily limit exceeded'), 'Correct daily limit error');

  // Test 9: Next midnight calculation
  const midnight = limiter.getNextMidnight();
  assert(midnight > Date.now(), 'Next midnight is in the future');

  // Test 10: Day reset check
  const isDayReset = limiter.isDayReset();
  assert(typeof isDayReset === 'boolean', 'isDayReset returns boolean');

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
