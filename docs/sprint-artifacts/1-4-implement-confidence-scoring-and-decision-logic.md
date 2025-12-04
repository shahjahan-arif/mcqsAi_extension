# Story 1.4: Implement Confidence Scoring and Decision Logic

Status: ready-for-dev

## Story

As a developer,
I want to implement the confidence scoring system and decision logic,
So that the system can determine if a page contains a quiz with appropriate confidence thresholds.

## Acceptance Criteria

1. **Given** scores from all three detection layers (Structural, Pattern, Context)
   **When** the confidence scoring runs
   **Then** it calculates total confidence: (Structural + Pattern + Context) / 100

2. **And** it applies decision thresholds:
   - Score > 80%: High confidence (proceed with answer generation)
   - Score 50-80%: Medium confidence (request AI verification)
   - Score < 50%: Not a quiz (skip)

3. **And** it returns a DetectionResult with isQuiz, confidence, quizType, questions array

4. **And** it identifies quiz type: 'mcq', 'true-false', 'fill-blank', 'short-answer', 'multiple-select'

5. **And** it extracts question elements and options

6. **And** it runs in Web Worker

7. **And** it completes in <200ms total detection time (desktop), <100ms (mobile)

## Technical Implementation

**Component:** `UniversalDetector.scoreAndDecide(scores, dom)`

**Responsibilities:**
- Combine scores from layers 1-3
- Calculate total confidence percentage
- Apply threshold logic
- Identify quiz type based on detected patterns
- Extract question elements and options
- Return structured DetectionResult object

**Algorithm:**

```javascript
scoreAndDecide(scores, dom) {
  // Calculate total confidence
  const totalScore = scores.structural + scores.pattern + scores.context;
  const confidence = Math.round((totalScore / 100) * 100);
  
  // Apply thresholds
  let isQuiz = false;
  let requiresAIVerification = false;
  
  if (confidence > 80) {
    isQuiz = true;
  } else if (confidence >= 50 && confidence <= 80) {
    isQuiz = true;
    requiresAIVerification = true;
  }
  
  // Identify quiz type
  const quizType = this.identifyQuizType(dom);
  
  // Extract questions
  const questions = this.extractQuestions(dom);
  
  return {
    isQuiz,
    confidence,
    quizType,
    questions,
    requiresAIVerification,
    scores: {
      structural: scores.structural,
      pattern: scores.pattern,
      context: scores.context
    }
  };
}

identifyQuizType(dom) {
  const textContent = dom.body.innerText.toLowerCase();
  
  // Check for true/false
  if (/(true|false)/gi.test(textContent) && 
      dom.querySelectorAll('input[type="radio"]').length <= 10) {
    return 'true-false';
  }
  
  // Check for multiple select
  if (dom.querySelectorAll('input[type="checkbox"]').length > 0) {
    return 'multiple-select';
  }
  
  // Check for fill-in-blank
  if (dom.querySelectorAll('input[type="text"], textarea').length > 0 &&
      dom.querySelectorAll('input[type="radio"]').length === 0) {
    return 'fill-blank';
  }
  
  // Check for short answer
  if (dom.querySelectorAll('textarea').length > 0) {
    return 'short-answer';
  }
  
  // Default to MCQ
  return 'mcq';
}

extractQuestions(dom) {
  const questions = [];
  
  // Find question containers (usually divs with question text)
  const questionElements = dom.querySelectorAll('[class*="question"], [id*="question"]');
  
  questionElements.forEach((el, index) => {
    const questionText = el.innerText;
    const options = this.extractOptions(el);
    
    if (questionText && options.length > 0) {
      questions.push({
        element: el,
        questionText,
        options,
        questionNumber: index + 1
      });
    }
  });
  
  return questions;
}

extractOptions(questionElement) {
  const options = [];
  
  // Look for radio buttons or checkboxes
  const inputs = questionElement.querySelectorAll('input[type="radio"], input[type="checkbox"]');
  
  inputs.forEach(input => {
    const label = input.nextElementSibling || input.parentElement;
    const optionText = label?.innerText || input.value;
    
    if (optionText) {
      options.push({
        element: input,
        text: optionText
      });
    }
  });
  
  return options;
}
```

**Output Interface:**
```javascript
interface DetectionResult {
  isQuiz: boolean;
  confidence: number;              // 0-100
  quizType: 'mcq' | 'true-false' | 'fill-blank' | 'short-answer' | 'multiple-select';
  questions: QuestionElement[];
  requiresAIVerification: boolean;
  scores: {
    structural: number;
    pattern: number;
    context: number;
  };
}

interface QuestionElement {
  element: HTMLElement;
  questionText: string;
  options: OptionElement[];
  questionNumber: number;
}

interface OptionElement {
  element: HTMLElement;
  text: string;
}
```

## Tasks / Subtasks

- [ ] Create scoring module: `src/detection/scorer.js`
  - [ ] Implement scoreAndDecide function
  - [ ] Implement identifyQuizType function
  - [ ] Implement extractQuestions function
  - [ ] Implement extractOptions function

- [ ] Create detection result types: `src/detection/types.ts` (or .js with JSDoc)
  - [ ] Define DetectionResult interface
  - [ ] Define QuestionElement interface
  - [ ] Define OptionElement interface

- [ ] Integrate with Web Worker
  - [ ] Add scorer to detector.worker.js
  - [ ] Combine all layers (1-3) with scoring
  - [ ] Return complete DetectionResult

- [ ] Create unit tests: `tests/detection/scorer.test.js`
  - [ ] Test confidence calculation
  - [ ] Test threshold logic
  - [ ] Test quiz type identification
  - [ ] Test question extraction

- [ ] Integration tests
  - [ ] Test full detection pipeline (all layers)
  - [ ] Test on various quiz types
  - [ ] Test performance: <200ms desktop, <100ms mobile

## Dev Notes

**Architecture Reference:** [Source: docs/architecture.md#AD-001: Universal Pattern-Based Detection Architecture]

**Detection Algorithm:** Layer 4 - Confidence Scoring & Decision Logic

**Confidence Thresholds:**
- Score > 80%: High confidence (proceed)
- Score 50-80%: Medium confidence (AI verification)
- Score < 50%: Not a quiz (skip)

**Quiz Type Detection:**
- MCQ: Multiple choice with radio buttons
- True/False: Binary choice questions
- Fill-in-blank: Text input fields
- Short Answer: Textarea fields
- Multiple Select: Checkboxes

**Performance Targets:**
- Total detection time: <200ms (desktop), <100ms (mobile)
- Scoring: <10ms
- Question extraction: <50ms
- Type identification: <5ms

**Testing Standards:**
- Unit tests for each function
- Integration tests with real HTML
- Performance benchmarks
- Edge cases: no questions, malformed HTML, dynamic content

**Source Tree Components:**
- `src/detection/scorer.js` - Scoring module
- `src/detection/types.js` - Type definitions
- `src/detection/index.js` - Export all detection modules
- `tests/detection/scorer.test.js` - Tests
- `tests/detection/integration.test.js` - Integration tests

## Project Structure Notes

**Module Exports:**
```javascript
// src/detection/index.js
export { structuralScan } from './structural-scanner.js';
export { patternMatching } from './pattern-matcher.js';
export { contextAnalysis } from './context-analyzer.js';
export { scoreAndDecide } from './scorer.js';
export * from './types.js';
```

**Web Worker Integration:**
```javascript
// src/workers/detector.worker.js
import { structuralScan, patternMatching, contextAnalysis, scoreAndDecide } from '../detection/index.js';

self.onmessage = (event) => {
  const dom = event.data;
  
  const scores = {
    structural: structuralScan(dom),
    pattern: patternMatching(dom),
    context: contextAnalysis(dom)
  };
  
  const result = scoreAndDecide(scores, dom);
  self.postMessage(result);
};
```

## References

- [Architecture: AD-001 - Universal Pattern-Based Detection Architecture](docs/architecture.md#ad-001-universal-pattern-based-detection-architecture)
- [Architecture: Detection Algorithm - Confidence Threshold](docs/architecture.md#detection-algorithm-4-layer-scoring-system)
- [Architecture: Web Workers for Parallel Processing](docs/architecture.md#ad-006-web-workers-for-parallel-processing)
- [Epic 1: Foundation - Universal Detection Engine](docs/epics.md#epic-1-foundation---universal-detection-engine)

## Dev Agent Record

### Context Reference

Story context: docs/sprint-artifacts/1-4-implement-confidence-scoring-and-decision-logic.md

### Agent Model Used

Claude 3.5 Sonnet

### Completion Notes

- [ ] Code review completed
- [ ] Tests passing (100% coverage)
- [ ] Performance benchmarks met (<200ms desktop, <100ms mobile)
- [ ] All detection layers integrated
- [ ] Web Worker integration verified
- [ ] Ready for Epic 2 (AI Integration)

### File List

- src/detection/scorer.js
- src/detection/types.js
- src/detection/index.js
- src/workers/detector.worker.js
- tests/detection/scorer.test.js
- tests/detection/integration.test.js
