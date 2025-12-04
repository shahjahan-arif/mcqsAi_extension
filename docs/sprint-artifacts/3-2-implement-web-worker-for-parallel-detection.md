# Story 3.2: Implement Web Worker for Parallel Detection

Status: ready-for-dev

## Story

As a developer,
I want to implement Web Worker for parallel detection processing,
So that the detection algorithm runs without blocking the main thread.

## Acceptance Criteria

1. **Given** a web page with quiz content
   **When** detection is triggered
   **Then** it spawns a Web Worker

2. **And** it sends DOM snapshot to worker

3. **And** it runs all detection layers in parallel (Structural, Pattern, Context)

4. **And** it returns detection results to main thread

5. **And** the main thread remains responsive during detection

6. **And** it terminates worker after detection completes

## Technical Implementation

**Main Thread (content-script.js):**

```javascript
class DetectionManager {
  constructor() {
    this.worker = null;
  }

  async detectQuiz(dom) {
    return new Promise((resolve, reject) => {
      // Create worker
      this.worker = new Worker(chrome.runtime.getURL('workers/detector.worker.js'));
      
      // Set timeout
      const timeout = setTimeout(() => {
        this.worker.terminate();
        reject(new Error('Detection timeout'));
      }, 5000);
      
      // Handle response
      this.worker.onmessage = (event) => {
        clearTimeout(timeout);
        this.worker.terminate();
        resolve(event.data);
      };
      
      // Handle error
      this.worker.onerror = (error) => {
        clearTimeout(timeout);
        this.worker.terminate();
        reject(error);
      };
      
      // Send DOM snapshot
      const domSnapshot = this.serializeDOM(dom);
      this.worker.postMessage({ dom: domSnapshot });
    });
  }

  serializeDOM(dom) {
    // Create a serializable representation of the DOM
    return {
      html: dom.documentElement.outerHTML,
      bodyText: dom.body.innerText,
      bodyHTML: dom.body.innerHTML
    };
  }
}
```

**Web Worker (detector.worker.js):**

```javascript
import { structuralScan, patternMatching, contextAnalysis, scoreAndDecide } from '../detection/index.js';

self.onmessage = (event) => {
  try {
    const { dom: domSnapshot } = event.data;
    
    // Recreate DOM from snapshot
    const parser = new DOMParser();
    const doc = parser.parseFromString(domSnapshot.html, 'text/html');
    
    // Run all detection layers
    const scores = {
      structural: structuralScan(doc),
      pattern: patternMatching(doc),
      context: contextAnalysis(doc)
    };
    
    // Score and decide
    const result = scoreAndDecide(scores, doc);
    
    // Send result back
    self.postMessage(result);
  } catch (error) {
    self.postMessage({
      error: error.message,
      stack: error.stack
    });
  }
};
```

## Tasks / Subtasks

- [ ] Create Web Worker file: `src/workers/detector.worker.js`
  - [ ] Import detection modules
  - [ ] Implement message handler
  - [ ] Implement error handling

- [ ] Create detection manager: `src/detection/manager.js`
  - [ ] Implement worker spawning
  - [ ] Implement DOM serialization
  - [ ] Implement timeout handling

- [ ] Create unit tests: `tests/detection/manager.test.js`
  - [ ] Test worker spawning
  - [ ] Test message passing
  - [ ] Test timeout handling

- [ ] Performance testing
  - [ ] Verify <200ms detection time
  - [ ] Test on various page sizes
  - [ ] Measure main thread responsiveness

## Dev Notes

**Architecture Reference:** [Source: docs/architecture.md#AD-006: Web Workers for Parallel Processing]

**Worker Communication:**
- Main thread sends DOM snapshot
- Worker runs detection
- Worker sends results back
- Main thread terminates worker

**Performance Targets:**
- Detection time: <200ms (desktop), <100ms (mobile)
- Main thread blocking: 0ms
- Worker overhead: <10ms

## References

- [Architecture: AD-006 - Web Workers for Parallel Processing](docs/architecture.md#ad-006-web-workers-for-parallel-processing)
- [Epic 3: Performance & Adaptation](docs/epics.md#epic-3-performance--adaptation---adaptive-performance)

## Dev Agent Record

### Completion Notes

- [ ] Code review completed
- [ ] Tests passing
- [ ] Worker communication verified
- [ ] Performance benchmarks met
- [ ] Ready for Story 3.3

### File List

- src/workers/detector.worker.js
- src/detection/manager.js
- tests/detection/manager.test.js
