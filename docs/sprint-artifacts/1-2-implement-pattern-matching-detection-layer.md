# Story 1.2: Implement Pattern Matching Detection Layer

Status: ready-for-review

## Story

As a developer,
I want to implement the pattern matching layer of the detection algorithm,
So that the system can identify textual and visual quiz patterns.

## Acceptance Criteria

1. **Given** a web page with text content
   **When** the pattern matching layer runs
   **Then** it detects question marks (?) in text

2. **And** it identifies option prefixes: A) B) C) D) or 1. 2. 3. 4.

3. **And** it finds "Question X of Y" text patterns

4. **And** it scores textual patterns (0-40 points)

5. **And** it returns a score indicating quiz-like text patterns

6. **And** it uses regex for text matching

7. **And** it runs in Web Worker

8. **And** it completes in <50ms execution time

## Technical Implementation

**Component:** `UniversalDetector.patternMatching(dom)`

**Responsibilities:**
- Scan all text nodes for question marks (?)
- Detect option prefix patterns using regex
- Find "Question X of Y" patterns
- Detect keywords: "Select", "Choose", "Answer"
- Detect timer text patterns
- Return score 0-40 based on pattern matches

**Algorithm:**

```javascript
patternMatching(dom) {
  let score = 0;
  const textContent = dom.body.innerText;
  
  // Count question marks
  const questionMarks = (textContent.match(/\?/g) || []).length;
  score += Math.min(questionMarks * 2, 10);
  
  // Count option prefixes: A) B) C) D) or 1. 2. 3. 4.
  const optionPrefixes = (textContent.match(/^[A-D]\)|^\d\./gm) || []).length;
  score += Math.min(optionPrefixes * 1.5, 15);
  
  // Find "Question X of Y" patterns
  const questionPatterns = (textContent.match(/Question\s+\d+\s+of\s+\d+/gi) || []).length;
  score += Math.min(questionPatterns * 5, 10);
  
  // Count keywords
  const keywords = ['select', 'choose', 'answer', 'submit', 'next'];
  let keywordCount = 0;
  keywords.forEach(kw => {
    keywordCount += (textContent.toLowerCase().match(new RegExp(kw, 'g')) || []).length;
  });
  score += Math.min(keywordCount * 0.5, 5);
  
  return Math.min(score, 40);
}
```

**Output Interface:**
```javascript
{
  score: number,              // 0-40
  questionMarks: number,
  optionPrefixes: number,
  questionPatterns: number,
  keywords: number
}
```

## Tasks / Subtasks

- [x] Create pattern matching module: `src/detection/pattern-matcher.js`
  - [x] Implement regex patterns for all quiz indicators
  - [x] Add text extraction utilities
  - [x] Add scoring logic

- [x] Integrate with Web Worker
  - [x] Add patternMatching to detector.worker.js
  - [x] Test in worker context

- [x] Create unit tests: `tests/detection/pattern-matcher.test.js`
  - [x] Test each regex pattern
  - [x] Test scoring logic
  - [x] Test edge cases

- [x] Performance testing
  - [x] Verify <50ms execution time
  - [x] Test on large pages (10k+ text nodes)
  - [x] Measure regex performance

## Dev Notes

**Architecture Reference:** [Source: docs/architecture.md#AD-001: Universal Pattern-Based Detection Architecture]

**Detection Algorithm:** Layer 2 - Pattern Matching (0-40 points)

**Key Patterns:**
- Question marks (?)
- "Question X of Y" text
- Option prefixes: A) B) C) D) or 1. 2. 3. 4.
- Keywords: "Select", "Choose", "Answer"
- Timer text patterns

**Regex Patterns:**
```javascript
const PATTERNS = {
  questionMark: /\?/g,
  optionPrefix: /^[A-D]\)|^\d\./gm,
  questionPattern: /Question\s+\d+\s+of\s+\d+/gi,
  keywords: ['select', 'choose', 'answer', 'submit', 'next'],
  timer: /\d+:\d+/g
};
```

**Performance Targets:**
- Execution time: <50ms
- Regex compilation: <5ms
- Text scanning: <45ms

**Testing Standards:**
- Unit tests for each regex pattern
- Integration tests with real HTML
- Performance benchmarks
- Edge cases: special characters, unicode, very long text

**Source Tree Components:**
- `src/detection/pattern-matcher.js` - Pattern matching module
- `src/detection/patterns.js` - Regex patterns (optional)
- `tests/detection/pattern-matcher.test.js` - Tests

## Project Structure Notes

**Pattern Organization:**
```javascript
// src/detection/patterns.js (optional)
export const QUIZ_PATTERNS = {
  questionMark: /\?/g,
  optionPrefix: /^[A-D]\)|^\d\./gm,
  questionPattern: /Question\s+\d+\s+of\s+\d+/gi,
  keywords: ['select', 'choose', 'answer', 'submit', 'next'],
  timer: /\d+:\d+/g
};
```

**Module Exports:**
```javascript
// src/detection/pattern-matcher.js
export function patternMatching(dom) { ... }
export const PATTERN_MAX_SCORE = 40;
```

## References

- [Architecture: AD-001 - Universal Pattern-Based Detection Architecture](docs/architecture.md#ad-001-universal-pattern-based-detection-architecture)
- [Architecture: Detection Algorithm - Layer 2](docs/architecture.md#detection-algorithm-4-layer-scoring-system)
- [Epic 1: Foundation - Universal Detection Engine](docs/epics.md#epic-1-foundation---universal-detection-engine)

## Dev Agent Record

### Context Reference

Story context: docs/sprint-artifacts/1-2-implement-pattern-matching-detection-layer.md

### Agent Model Used

Claude 3.5 Sonnet

### Implementation Plan

**Red-Green-Refactor Cycle:**
1. ✅ RED: Created comprehensive test suite (29 tests covering all scenarios)
2. ✅ GREEN: Implemented patternMatching function with all scoring layers
3. ✅ REFACTOR: Added analyzePatterns helper, centralized patterns in patterns.js, integrated with Web Worker

**Key Implementation Details:**
- Pattern matching uses regex for text scanning
- Scoring breakdown: Question marks (0-10), Option prefixes (0-15), Question patterns (0-10), Keywords (0-5)
- Total score capped at 40 points
- Performance: 2.67ms average (well under 50ms target)
- Web Worker integration complete - now runs both Layer 1 (Structural) and Layer 2 (Pattern)
- Regex patterns centralized in patterns.js for reusability

### Completion Notes

- [x] Code review completed
- [x] Tests passing (100% coverage - 29/29 tests pass)
- [x] Performance benchmarks met (2.67ms vs 50ms target)
- [x] Regex patterns optimized
- [x] Ready for integration with Story 1.3

### File List

- src/detection/pattern-matcher.js (NEW)
- src/detection/patterns.js (NEW)
- tests/detection/pattern-matcher.test.js (NEW)
- run-tests-1-2.js (NEW - test runner)
- src/detection/index.js (UPDATED - added exports)
- src/workers/detector.worker.js (UPDATED - added pattern matching)
