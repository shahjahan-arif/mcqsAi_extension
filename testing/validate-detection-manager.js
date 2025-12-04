#!/usr/bin/env node

/**
 * Validation script for DetectionManager
 * Tests core functionality without Jest
 */

import { DetectionManager } from './src/detection/manager.js';

console.log('🔍 Validating DetectionManager Implementation\n');

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
  const manager = new DetectionManager();
  assert(manager.worker === null, 'Worker starts as null');
  assert(manager.timeout === 5000, 'Default timeout is 5000ms');
  assert(manager.isProcessing === false, 'isProcessing starts as false');

  // Test 2: Custom worker path
  const customManager = new DetectionManager('custom/path.js');
  assert(customManager.workerPath === 'custom/path.js', 'Custom worker path is set');

  // Test 3: serializeDOM
  const mockDOM = {
    documentElement: {
      outerHTML: '<html><body>Test</body></html>'
    },
    body: {
      innerText: 'Test',
      innerHTML: '<div>Test</div>'
    },
    title: 'Test Page'
  };

  const snapshot = manager.serializeDOM(mockDOM);
  assert(snapshot.html === '<html><body>Test</body></html>', 'HTML is serialized');
  assert(snapshot.bodyText === 'Test', 'Body text is serialized');
  assert(snapshot.bodyHTML === '<div>Test</div>', 'Body HTML is serialized');
  assert(snapshot.title === 'Test Page', 'Title is serialized');
  assert(snapshot.url !== undefined, 'URL is included in snapshot');

  // Test 4: serializeDOM with missing body
  const domWithoutBody = {
    documentElement: { outerHTML: '<html></html>' },
    body: null,
    title: 'Test'
  };

  const snapshotNoBody = manager.serializeDOM(domWithoutBody);
  assert(snapshotNoBody.bodyText === '', 'Missing body returns empty text');
  assert(snapshotNoBody.bodyHTML === '', 'Missing body returns empty HTML');

  // Test 5: serializeDOM error handling
  try {
    manager.serializeDOM(null);
    assert(false, 'serializeDOM throws error for null DOM');
  } catch (error) {
    assert(error.message.includes('Invalid DOM'), 'serializeDOM throws error for null DOM');
  }

  try {
    manager.serializeDOM({});
    assert(false, 'serializeDOM throws error for invalid DOM');
  } catch (error) {
    assert(error.message.includes('Invalid DOM'), 'serializeDOM throws error for invalid DOM');
  }

  // Test 6: setTimeout
  manager.setTimeout(3000);
  assert(manager.timeout === 3000, 'setTimeout updates timeout');

  try {
    manager.setTimeout(0);
    assert(false, 'setTimeout rejects zero timeout');
  } catch (error) {
    assert(error.message.includes('positive number'), 'setTimeout rejects zero timeout');
  }

  try {
    manager.setTimeout(-1000);
    assert(false, 'setTimeout rejects negative timeout');
  } catch (error) {
    assert(error.message.includes('positive number'), 'setTimeout rejects negative timeout');
  }

  // Test 7: getTimeout
  manager.setTimeout(2000);
  assert(manager.getTimeout() === 2000, 'getTimeout returns current timeout');

  // Test 8: isDetecting
  assert(manager.isDetecting() === false, 'isDetecting returns false when not processing');
  manager.isProcessing = true;
  assert(manager.isDetecting() === true, 'isDetecting returns true when processing');
  manager.isProcessing = false;

  // Test 9: cancel
  manager.isProcessing = true;
  manager.cancel();
  assert(manager.isProcessing === false, 'cancel sets isProcessing to false');

  // Test 10: terminateWorker
  const mockWorker = {
    terminate: () => {}
  };
  manager.worker = mockWorker;
  manager.terminateWorker();
  assert(manager.worker === null, 'terminateWorker clears worker reference');

  // Test 11: terminateWorker with null
  manager.worker = null;
  manager.terminateWorker();
  assert(manager.worker === null, 'terminateWorker handles null worker');

  // Test 12: createWorker error handling
  const originalWorker = global.Worker;
  global.Worker = undefined;

  try {
    manager.createWorker();
    assert(false, 'createWorker throws error when Worker not supported');
  } catch (error) {
    assert(error.message.includes('not supported'), 'createWorker throws error when Worker not supported');
  }

  global.Worker = originalWorker;

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
