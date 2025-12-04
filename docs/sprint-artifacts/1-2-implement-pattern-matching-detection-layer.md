# Story 1.2: Implement Pattern Matching Detection Layer

Status: ready-for-dev

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

- [ ] Create pattern matching module: `src/detection/pattern-matcher.js`
  - [ ] Implement regex patterns for all quiz indicators
  - [ ] Add text extraction utilities
  - [ ] Add scoring logic

- [ ] Integrate with Web Worker
  - [ ] Add patternMatching to detector.worker.js
  - [ ] Test in worker context

- [ ] Create unit tests: `tests/detection/pattern-matcher.test.js`
  - [ ] Test each regex pattern
  - [ ] Test scoring logic
  - [ ] Test edge cases

- [ ] Performance testing
  - [ ] Verify <50ms execution time
  - [ ] Test on large pages (10k+ text nodes)
  - [ ] Measure regex performance

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

### Completion Notes

- [ ] Code review completed
- [ ] Tests passing (100% coverage)
- [ ] Performance benchmarks met
- [ ] Regex patterns optimized
- [ ] Ready for integration with Story 1.3

### File List

- src/detection/pattern-matcher.js
- src/detection/patterns.js (optional)
- tests/detection/pattern-matcher.test.js
