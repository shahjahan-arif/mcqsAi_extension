# Story 1.1: Implement Structural Scan Detection Layer

Status: ready-for-dev

## Story

As a developer,
I want to implement the structural scan layer of the detection algorithm,
So that the system can identify quiz-like DOM structures.

## Acceptance Criteria

1. **Given** a web page with various HTML elements
   **When** the structural scan runs
   **Then** it identifies forms, input groups, radio buttons, checkboxes, and submit buttons

2. **And** it scores the structural similarity to quiz patterns (0-40 points)

3. **And** it returns a score indicating quiz-like structure

4. **And** it uses CSS selectors for performance (XPath only if needed)

5. **And** it runs in Web Worker to avoid blocking main thread

6. **And** it completes in <50ms execution time

## Technical Implementation

**Component:** `UniversalDetector.structuralScan(dom)`

**Responsibilities:**
- Scan for `<form>` elements and input groups
- Identify radio button/checkbox clusters using CSS selectors: `input[type="radio"]`, `input[type="checkbox"]`
- Locate submit/next buttons: `button[type="submit"]`, `input[type="submit"]`
- Count quiz-like structural patterns
- Return score 0-40 based on pattern density

**Algorithm:**

```javascript
structuralScan(dom) {
  let score = 0;
  
  // Find forms
  const forms = dom.querySelectorAll('form');
  score += Math.min(forms.length * 5, 10);
  
  // Find input groups
  const radioGroups = dom.querySelectorAll('input[type="radio"]');
  const checkboxes = dom.querySelectorAll('input[type="checkbox"]');
  score += Math.min((radioGroups.length + checkboxes.length) * 2, 15);
  
  // Find submit buttons
  const submitButtons = dom.querySelectorAll('button[type="submit"], input[type="submit"]');
  score += Math.min(submitButtons.length * 5, 10);
  
  // Find textareas (for short answer questions)
  const textareas = dom.querySelectorAll('textarea');
  score += Math.min(textareas.length * 2, 5);
  
  return Math.min(score, 40);
}
```

**Output Interface:**
```javascript
{
  score: number,        // 0-40
  forms: number,
  inputs: number,
  buttons: number,
  textareas: number
}
```

## Tasks / Subtasks

- [ ] Create Web Worker file: `src/workers/detector.worker.js`
  - [ ] Implement structuralScan method
  - [ ] Add DOM traversal utilities
  - [ ] Add scoring logic

- [ ] Create detector module: `src/detection/structural-scanner.js`
  - [ ] Export structuralScan function
  - [ ] Add unit tests

- [ ] Integrate with detection engine
  - [ ] Call structuralScan in detection pipeline
  - [ ] Pass results to next layer

- [ ] Performance testing
  - [ ] Verify <50ms execution time
  - [ ] Test on various page types
  - [ ] Measure memory usage

## Dev Notes

**Architecture Reference:** [Source: docs/architecture.md#AD-001: Universal Pattern-Based Detection Architecture]

**Detection Algorithm:** Layer 1 - Structural Scan (0-40 points)

**Key Patterns:**
- Forms with multiple input groups
- Radio buttons/checkboxes in clusters
- Question text + options pattern
- Submit/next buttons near inputs
- Numbered or lettered options

**Performance Targets:**
- Execution time: <50ms
- Memory overhead: <1MB
- CSS selector performance: <10ms

**Testing Standards:**
- Unit tests for scoring logic
- Integration tests with real DOM
- Performance benchmarks
- Edge cases: empty forms, nested forms, hidden elements

**Source Tree Components:**
- `src/workers/detector.worker.js` - Web Worker
- `src/detection/structural-scanner.js` - Scanner module
- `src/detection/index.js` - Export
- `tests/detection/structural-scanner.test.js` - Tests

## Project Structure Notes

**File Organization:**
- Detection logic in `src/detection/` folder
- Web Workers in `src/workers/` folder
- Tests mirror source structure in `tests/` folder

**Naming Conventions:**
- Functions: camelCase (structuralScan)
- Classes: PascalCase (UniversalDetector)
- Files: kebab-case (structural-scanner.js)
- Constants: UPPER_SNAKE_CASE (MAX_SCORE)

**Module Exports:**
```javascript
// src/detection/structural-scanner.js
export function structuralScan(dom) { ... }
export const STRUCTURAL_MAX_SCORE = 40;
```

## References

- [Architecture: AD-001 - Universal Pattern-Based Detection Architecture](docs/architecture.md#ad-001-universal-pattern-based-detection-architecture)
- [Architecture: Detection Algorithm - Layer 1](docs/architecture.md#detection-algorithm-4-layer-scoring-system)
- [Architecture: Web Workers for Parallel Processing](docs/architecture.md#ad-006-web-workers-for-parallel-processing)
- [Epic 1: Foundation - Universal Detection Engine](docs/epics.md#epic-1-foundation---universal-detection-engine)

## Dev Agent Record

### Context Reference

Story context: docs/sprint-artifacts/1-1-implement-structural-scan-detection-layer.md

### Agent Model Used

Claude 3.5 Sonnet

### Completion Notes

- [ ] Code review completed
- [ ] Tests passing (100% coverage)
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Ready for integration with Story 1.2

### File List

- src/workers/detector.worker.js
- src/detection/structural-scanner.js
- src/detection/index.js
- tests/detection/structural-scanner.test.js
