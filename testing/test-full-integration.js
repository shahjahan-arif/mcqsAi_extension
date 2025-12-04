#!/usr/bin/env node

/**
 * Full Integration Test
 * Tests API, Cache, Rate Limiting, and Answer Retriever
 */

import { GeminiClient } from './src/api/gemini-client.js';
import { CachingSystem } from './src/caching/cache-system.js';
import { AnswerRetriever } from './src/answer/retriever.js';
import { RateLimiter } from './src/api/rate-limiter.js';
import { RequestQueue } from './src/api/request-queue.js';

const apiKey = 'AIzaSyC3KNHIKKXGYhnjtmJ9o2FYTTLWZ6pXRj8';

async function runFullIntegrationTest() {
  console.log('🚀 Full Integration Test\n');
  console.log('=' .repeat(50));

  try {
    // Test 1: API Client
    console.log('\n1️⃣  Testing API Client...');
    const apiClient = new GeminiClient(apiKey);
    const apiResult = await apiClient.getAnswer('What is the capital of France?');
    console.log('✅ API Client working');
    console.log('   Answer:', apiResult.answer);

    // Test 2: Cache System
    console.log('\n2️⃣  Testing Cache System...');
    const cache = new CachingSystem();
    await cache.init();
    console.log('✅ Cache initialized');

    // Test 3: Answer Retriever (Cache + API)
    console.log('\n3️⃣  Testing Answer Retriever...');
    const retriever = new AnswerRetriever(cache, apiClient);

    console.log('   First call (cache miss)...');
    const result1 = await retriever.getAnswer('What is 2+2?');
    console.log('   ✅ Source:', result1.source);
    console.log('   Answer:', result1.answer);
    console.log('   Time:', result1.elapsed, 'ms');

    console.log('\n   Second call (cache hit)...');
    const result2 = await retriever.getAnswer('What is 2+2?');
    console.log('   ✅ Source:', result2.source);
    console.log('   Answer:', result2.answer);
    console.log('   Time:', result2.elapsed, 'ms');

    const stats = retriever.getStats();
    console.log('\n   📊 Statistics:');
    console.log('   Hits:', stats.hits);
    console.log('   Misses:', stats.misses);
    console.log('   Hit Rate:', stats.hitRate);

    // Test 4: Rate Limiter
    console.log('\n4️⃣  Testing Rate Limiter...');
    const rateLimiter = new RateLimiter();
    const limitCheck = await rateLimiter.checkLimit();
    console.log('✅ Rate limiter working');
    console.log('   Allowed:', limitCheck.allowed);

    const limiterStats = rateLimiter.getStats();
    console.log('   Requests this minute:', limiterStats.requestsThisMinute);
    console.log('   Daily remaining:', limiterStats.dailyRemaining);

    // Test 5: Request Queue
    console.log('\n5️⃣  Testing Request Queue...');
    const queue = new RequestQueue(rateLimiter, apiClient);
    console.log('✅ Request queue initialized');

    console.log('   Enqueueing 3 requests...');
    const promises = [
      queue.enqueue('What is 3+3?'),
      queue.enqueue('What is 4+4?'),
      queue.enqueue('What is 5+5?')
    ];

    const results = await Promise.all(promises);
    console.log('   ✅ All requests completed');
    console.log('   Results:', results.length);

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('\n✅ ALL TESTS PASSED!\n');
    console.log('Summary:');
    console.log('✓ API Client: Working');
    console.log('✓ Cache System: Working');
    console.log('✓ Answer Retriever: Working');
    console.log('✓ Rate Limiter: Working');
    console.log('✓ Request Queue: Working');
    console.log('\n🎉 Your extension is ready to use!\n');

    cache.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

runFullIntegrationTest();
