#!/usr/bin/env node

/**
 * Validation script for AdaptivePerformance
 * Tests core functionality without Jest
 */

import { AdaptivePerformance, PERFORMANCE_MODES } from './src/performance/adaptive.js';

console.log('🔍 Validating AdaptivePerformance Implementation\n');

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
  const adaptive = new AdaptivePerformance();
  assert(adaptive.mode === null, 'Mode starts as null');
  assert(adaptive.isMobileDevice === false, 'isMobileDevice starts as false');
  assert(adaptive.batteryLevel === 100, 'batteryLevel starts at 100');
  assert(Array.isArray(adaptive.listeners), 'listeners is an array');

  // Test 2: Device detection
  const isMobile = adaptive.detectMobile();
  assert(typeof isMobile === 'boolean', 'detectMobile returns boolean');

  // Test 3: Battery level
  const batteryLevel = await adaptive.getBatteryLevel();
  assert(typeof batteryLevel === 'number', 'getBatteryLevel returns number');
  assert(batteryLevel >= 0 && batteryLevel <= 100, 'Battery level is 0-100');

  // Test 4: Mode determination
  adaptive.isMobileDevice = false;
  adaptive.batteryLevel = 100;
  let mode = adaptive.determineMode();
  assert(mode === PERFORMANCE_MODES.ACCURACY_MODE, 'Desktop with good battery = ACCURACY_MODE');

  adaptive.isMobileDevice = true;
  adaptive.batteryLevel = 100;
  mode = adaptive.determineMode();
  assert(mode === PERFORMANCE_MODES.SPEED_MODE, 'Mobile device = SPEED_MODE');

  adaptive.isMobileDevice = false;
  adaptive.batteryLevel = 15;
  mode = adaptive.determineMode();
  assert(mode === PERFORMANCE_MODES.SPEED_MODE, 'Low battery (<20%) = SPEED_MODE');

  adaptive.isMobileDevice = false;
  adaptive.batteryLevel = 20;
  mode = adaptive.determineMode();
  assert(mode === PERFORMANCE_MODES.ACCURACY_MODE, 'Battery at 20% = ACCURACY_MODE');

  // Test 5: Config for SPEED_MODE
  adaptive.mode = PERFORMANCE_MODES.SPEED_MODE;
  let config = adaptive.getConfig();
  assert(config.useCSSSelectors === true, 'SPEED_MODE uses CSS selectors');
  assert(config.useXPath === true, 'SPEED_MODE uses XPath');
  assert(config.useDOMAnalysis === false, 'SPEED_MODE skips DOM analysis');
  assert(config.useAIVerification === false, 'SPEED_MODE skips AI verification');
  assert(config.cacheFirst === true, 'SPEED_MODE uses cache-first');
  assert(config.maxDetectionTime === 100, 'SPEED_MODE max time is 100ms');

  // Test 6: Config for ACCURACY_MODE
  adaptive.mode = PERFORMANCE_MODES.ACCURACY_MODE;
  config = adaptive.getConfig();
  assert(config.useCSSSelectors === true, 'ACCURACY_MODE uses CSS selectors');
  assert(config.useXPath === true, 'ACCURACY_MODE uses XPath');
  assert(config.useDOMAnalysis === true, 'ACCURACY_MODE uses DOM analysis');
  assert(config.useAIVerification === true, 'ACCURACY_MODE uses AI verification');
  assert(config.cacheFirst === false, 'ACCURACY_MODE does not use cache-first');
  assert(config.maxDetectionTime === 200, 'ACCURACY_MODE max time is 200ms');

  // Test 7: Status
  adaptive.mode = PERFORMANCE_MODES.SPEED_MODE;
  adaptive.isMobileDevice = true;
  adaptive.batteryLevel = 50;
  const status = adaptive.getStatus();
  assert(status.mode === PERFORMANCE_MODES.SPEED_MODE, 'Status includes mode');
  assert(status.isMobileDevice === true, 'Status includes isMobileDevice');
  assert(status.batteryLevel === 50, 'Status includes batteryLevel');
  assert(status.config !== undefined, 'Status includes config');

  // Test 8: Set mode
  await adaptive.setMode(PERFORMANCE_MODES.ACCURACY_MODE);
  assert(adaptive.mode === PERFORMANCE_MODES.ACCURACY_MODE, 'setMode updates mode');

  try {
    await adaptive.setMode('INVALID');
    assert(false, 'setMode rejects invalid mode');
  } catch (error) {
    assert(error.message.includes('Invalid mode'), 'setMode rejects invalid mode');
  }

  // Test 9: Listeners
  let modeChangeCount = 0;
  adaptive.onModeChange(() => {
    modeChangeCount++;
  });
  assert(adaptive.listeners.length === 1, 'onModeChange registers listener');

  let batteryChangeCount = 0;
  adaptive.onBatteryChange(() => {
    batteryChangeCount++;
  });
  assert(adaptive.listeners.length === 2, 'onBatteryChange registers listener');

  // Test 10: Notify listeners
  adaptive.notifyListeners('modeChanged', { oldMode: 'OLD', newMode: 'NEW' });
  assert(modeChangeCount === 1, 'notifyListeners calls mode change listeners');

  adaptive.notifyListeners('batteryChanged', { level: 50 });
  assert(batteryChangeCount === 1, 'notifyListeners calls battery change listeners');

  // Test 11: Clear listeners
  adaptive.clearListeners();
  assert(adaptive.listeners.length === 0, 'clearListeners removes all listeners');

  // Test 12: Init
  const adaptive2 = new AdaptivePerformance();
  await adaptive2.init();
  assert(adaptive2.mode !== null, 'init sets mode');
  assert(typeof adaptive2.isMobileDevice === 'boolean', 'init detects device');
  assert(typeof adaptive2.batteryLevel === 'number', 'init gets battery level');

  // Test 13: Stop monitoring
  adaptive2.batteryMonitor = { removeEventListener: () => {} };
  adaptive2.stopMonitoring();
  assert(adaptive2.batteryMonitor === null, 'stopMonitoring clears battery monitor');

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
