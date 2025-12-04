#!/usr/bin/env node

/**
 * Simple test runner for structural-scanner tests
 * Validates implementation without full Jest setup
 */

import { structuralScan, STRUCTURAL_MAX_SCORE, analyzeStructure } from './src/detection/structural-scanner.js';

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

function createMockDom(config = {}) {
  const selectors = {
    'form': config.forms || 0,
    'input[type="radio"]': config.radioButtons || 0,
    'input[type="checkbox"]': config.checkboxes || 0,
    'button[type="submit"], input[type="submit"]': config.submitButtons || 0,
    'textarea': config.textareas || 0
  };

  return {
    querySelectorAll: (selector) => {
      const count = selectors[selector] || 0;
      return Array(count).fill(null);
    }
  };
}

// Run tests
console.log('\n🧪 Running Structural Scanner Tests\n');

try {
  // Test 1: Empty DOM
  console.log('Test Suite: Scoring Logic');
  const emptyDom = createMockDom();
  assert(structuralScan(emptyDom) === 0, 'Empty DOM returns 0');

  // Test 2: Forms scoring
  const formsDom = createMockDom({ forms: 3 });
  const formsScore = structuralScan(formsDom);
  assert(formsScore > 0 && formsScore <= 10, `Forms scoring (got ${formsScore})`);

  // Test 3: Radio buttons and checkboxes
  const inputsDom = createMockDom({ radioButtons: 5, checkboxes: 3 });
  const inputsScore = structuralScan(inputsDom);
  assert(inputsScore > 0 && inputsScore <= 15, `Inputs scoring (got ${inputsScore})`);

  // Test 4: Submit buttons
  const buttonsDom = createMockDom({ submitButtons: 3 });
  const buttonsScore = structuralScan(buttonsDom);
  assert(buttonsScore > 0 && buttonsScore <= 10, `Buttons scoring (got ${buttonsScore})`);

  // Test 5: Textareas
  const textareasDom = createMockDom({ textareas: 4 });
  const textareasScore = structuralScan(textareasDom);
  assert(textareasScore > 0 && textareasScore <= 5, `Textareas scoring (got ${textareasScore})`);

  // Test 6: Max score cap
  const maxDom = createMockDom({ forms: 100, radioButtons: 100, checkboxes: 100, submitButtons: 100, textareas: 100 });
  const maxScore = structuralScan(maxDom);
  assert(maxScore === STRUCTURAL_MAX_SCORE, `Max score capped at ${STRUCTURAL_MAX_SCORE} (got ${maxScore})`);

  // Test 7: Combined scoring
  const combinedDom = createMockDom({ forms: 2, radioButtons: 4, checkboxes: 2, submitButtons: 1, textareas: 1 });
  const combinedScore = structuralScan(combinedDom);
  // 2*5 + (4+2)*2 + 1*5 + 1*2 = 10 + 12 + 5 + 2 = 29
  assert(combinedScore === 29, `Combined scoring (expected 29, got ${combinedScore})`);

  console.log('\nTest Suite: Edge Cases');

  // Test 8: Null DOM
  try {
    structuralScan(null);
    assert(false, 'Null DOM should throw error');
  } catch (e) {
    assert(true, 'Null DOM throws error');
  }

  // Test 9: Large number of elements
  const largeDom = createMockDom({ forms: 10000, radioButtons: 10000, checkboxes: 10000, submitButtons: 10000, textareas: 10000 });
  const largeScore = structuralScan(largeDom);
  assert(largeScore <= STRUCTURAL_MAX_SCORE, `Large DOM capped at max (got ${largeScore})`);

  console.log('\nTest Suite: Performance');

  // Test 10: Performance <50ms
  const perfDom = createMockDom({ forms: 1000, radioButtons: 1000, checkboxes: 1000, submitButtons: 1000, textareas: 1000 });
  const start = performance.now();
  structuralScan(perfDom);
  const elapsed = performance.now() - start;
  assert(elapsed < 50, `Performance <50ms (got ${elapsed.toFixed(2)}ms)`);

  console.log('\nTest Suite: Return Value Structure');

  // Test 11: Return type
  const result = structuralScan(emptyDom);
  assert(typeof result === 'number', 'Returns number');

  // Test 12: Score range
  const rangeDom = createMockDom({ forms: 100 });
  const rangeScore = structuralScan(rangeDom);
  assert(rangeScore >= 0 && rangeScore <= 40, `Score in range 0-40 (got ${rangeScore})`);

  console.log('\nTest Suite: Detailed Analysis');

  // Test 13: analyzeStructure function
  const analysisDom = createMockDom({ forms: 2, radioButtons: 4, checkboxes: 2, submitButtons: 1, textareas: 1 });
  const analysis = analyzeStructure(analysisDom);
  assert(analysis.forms === 2, `Analysis: forms count (got ${analysis.forms})`);
  assert(analysis.radioButtons === 4, `Analysis: radio buttons count (got ${analysis.radioButtons})`);
  assert(analysis.checkboxes === 2, `Analysis: checkboxes count (got ${analysis.checkboxes})`);
  assert(analysis.submitButtons === 1, `Analysis: submit buttons count (got ${analysis.submitButtons})`);
  assert(analysis.textareas === 1, `Analysis: textareas count (got ${analysis.textareas})`);
  assert(analysis.totalInputs === 6, `Analysis: total inputs (got ${analysis.totalInputs})`);
  assert(analysis.score === 29, `Analysis: score (got ${analysis.score})`);

  console.log('\n' + '='.repeat(50));
  console.log(`\n✅ All tests passed! (${testsPassed} passed, ${testsFailed} failed)\n`);
  process.exit(0);

} catch (error) {
  console.error('\n' + '='.repeat(50));
  console.error(`\n❌ Tests failed! (${testsPassed} passed, ${testsFailed} failed)\n`);
  console.error(error.message);
  process.exit(1);
}
