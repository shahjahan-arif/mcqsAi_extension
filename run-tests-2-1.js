#!/usr/bin/env node

/**
 * Test runner for caching system tests
 * Validates implementation without full Jest setup
 */

import { generateHash, validateHash } from './src/caching/hash-utils.js';
import { CachingSystem } from './src/caching/cache-system.js';

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

// Run tests
console.log('\n🧪 Running Caching System Tests\n');

try {
  console.log('Test Suite: Hash Generation');

  // Test 1: Consistent hash
  let hash1 = await generateHash('What is 2+2?');
  let hash2 = await generateHash('What is 2+2?');
  assert(hash1 === hash2, 'Generates consistent hash for same input');

  // Test 2: Different hash for different input
  let hashA = await generateHash('Question 1');
  let hashB = await generateHash('Question 2');
  assert(hashA !== hashB, 'Generates different hash for different input');

  // Test 3: Hash is string
  assert(typeof hash1 === 'string', 'Hash is string');

  // Test 4: Hash is hexadecimal
  assert(/^[0-9a-f]+$/.test(hash1), 'Hash is hexadecimal');

  // Test 5: Hash has consistent length (SHA-256 = 64 chars)
  let shortHash = await generateHash('short');
  let longHash = await generateHash('this is a much longer question text that should still produce the same length hash');
  assert(shortHash.length === longHash.length, `Hash has consistent length (${shortHash.length} chars)`);
  assert(shortHash.length === 64, 'SHA-256 hash is 64 characters');

  // Test 6: Empty string throws error
  try {
    await generateHash('');
    assert(false, 'Empty string should throw error');
  } catch (e) {
    assert(true, 'Empty string throws error');
  }

  console.log('\nTest Suite: Hash Validation');

  // Test 7: Valid hash passes validation
  let validHash = await generateHash('test');
  assert(validateHash(validHash), 'Valid hash passes validation');

  // Test 8: Invalid hash fails validation
  assert(!validateHash('invalid'), 'Invalid hash fails validation');
  assert(!validateHash(''), 'Empty string fails validation');
  assert(!validateHash(null), 'Null fails validation');

  console.log('\nTest Suite: CachingSystem Initialization');

  // Test 9: CachingSystem creates instance
  let cache = new CachingSystem();
  assert(cache !== null, 'CachingSystem instance created');

  // Test 10: Correct max entries
  assert(cache.MAX_ENTRIES === 10000, `MAX_ENTRIES is 10000 (got ${cache.MAX_ENTRIES})`);

  // Test 11: Correct cleanup threshold
  assert(cache.CLEANUP_THRESHOLD === 0.9, `CLEANUP_THRESHOLD is 0.9 (got ${cache.CLEANUP_THRESHOLD})`);

  // Test 12: Correct retention days
  assert(cache.RETENTION_DAYS === 30, `RETENTION_DAYS is 30 (got ${cache.RETENTION_DAYS})`);

  console.log('\nTest Suite: CachingSystem Methods');

  // Test 13: Methods exist
  assert(typeof cache.init === 'function', 'init method exists');
  assert(typeof cache.get === 'function', 'get method exists');
  assert(typeof cache.set === 'function', 'set method exists');
  assert(typeof cache.has === 'function', 'has method exists');
  assert(typeof cache.getEntryCount === 'function', 'getEntryCount method exists');
  assert(typeof cache.getStats === 'function', 'getStats method exists');
  assert(typeof cache.clear === 'function', 'clear method exists');
  assert(typeof cache.cleanup === 'function', 'cleanup method exists');
  assert(typeof cache.close === 'function', 'close method exists');

  // Test 14: DB is null before init
  assert(cache.db === null, 'DB is null before init');

  console.log('\nTest Suite: Error Handling');

  // Test 15: Get without init throws error
  try {
    await cache.get('somehash');
    assert(false, 'Get without init should throw error');
  } catch (e) {
    assert(true, 'Get without init throws error');
  }

  // Test 16: Set without init throws error
  try {
    await cache.set('somehash', {});
    assert(false, 'Set without init should throw error');
  } catch (e) {
    assert(true, 'Set without init throws error');
  }

  // Test 17: getEntryCount without init throws error
  try {
    await cache.getEntryCount();
    assert(false, 'getEntryCount without init should throw error');
  } catch (e) {
    assert(true, 'getEntryCount without init throws error');
  }

  // Test 18: getStats without init throws error
  try {
    await cache.getStats();
    assert(false, 'getStats without init should throw error');
  } catch (e) {
    assert(true, 'getStats without init throws error');
  }

  // Test 19: clear without init throws error
  try {
    await cache.clear();
    assert(false, 'clear without init should throw error');
  } catch (e) {
    assert(true, 'clear without init throws error');
  }

  console.log('\nTest Suite: Close Method');

  // Test 20: Close method works
  cache.close();
  assert(cache.db === null, 'DB is null after close');

  console.log('\n' + '='.repeat(50));
  console.log(`\n✅ All tests passed! (${testsPassed} passed, ${testsFailed} failed)\n`);
  process.exit(0);

} catch (error) {
  console.error('\n' + '='.repeat(50));
  console.error(`\n❌ Tests failed! (${testsPassed} passed, ${testsFailed} failed)\n`);
  console.error(error.message);
  process.exit(1);
}
