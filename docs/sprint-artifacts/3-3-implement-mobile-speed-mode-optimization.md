# Story 3.3: Implement Mobile Speed Mode Optimization

Status: ready-for-dev

## Story

As a developer,
I want to implement mobile speed mode optimization,
So that the system uses cache-first strategy and reduced detection on mobile.

## Acceptance Criteria

1. **Given** the system is in mobile speed mode
   **When** a quiz is detected
   **Then** it uses CSS + XPath selectors only (no DOM analysis)

2. **And** it uses cache-first strategy: check cache before API

3. **And** it skips AI verification layer

4. **And** it returns answers from cache when available

5. **And** it only calls API on cache miss

6. **And** it monitors battery usage and disables features if needed

## Technical Implementation

```javascript
class MobileOptimizer {
  constructor(cache, retriever, adaptive) {
    this.cache = cache;
    this.retriever = retriever;
    this.adaptive = adaptive;
  }

  async optimizeDetection(dom) {
    if (this.adaptive.mode !== 'SPEED_MODE') {
      return null; // Not in speed mode
    }
    
    // Use CSS + XPath only (no DOM analysis)
    const scores = {
      structural: this.structuralScanFast(dom),
      pattern: this.patternMatchingFast(dom),
      context: 0 // Skip context analysis
    };
    
    const totalScore = scores.structural + scores.pattern;
    const confidence = Math.round((totalScore / 80) * 100); // Normalize to 0-100
    
    return {
      isQuiz: confidence > 50,
      confidence,
      requiresAIVerification: false // Skip AI verification
    };
  }

  structuralScanFast(dom) {
    // Fast CSS selector only scan
    const forms = dom.querySelectorAll('form').length;
    const inputs = dom.querySelectorAll('input[type="radio"], input[type="checkbox"]').length;
    const buttons = dom.querySelectorAll('button[type="submit"]').length;
    
    return Math.min((forms * 5 + inputs * 2 + buttons * 5), 40);
  }

  patternMatchingFast(dom) {
    // Fast text pattern matching
    const text = dom.body.innerText;
    const questionMarks = (text.match(/\?/g) || []).length;
    const optionPrefixes = (text.match(/^[A-D]\)|^\d\./gm) || []).length;
    
    return Math.min((questionMarks * 2 + optionPrefixes * 1.5), 40);
  }

  async getAnswerOptimized(question) {
    // Cache-first strategy
    const hash = await generateHash(question);
    const cached = await this.cache.get(hash);
    
    if (cached) {
      return {
        answer: cached.answer,
        source: 'cache',
        confidence: cached.confidence
      };
    }
    
    // Only call API on cache miss
    return await this.retriever.getAnswer(question);
  }

  async monitorBattery() {
    if (!navigator.getBattery) return;
    
    const battery = await navigator.getBattery();
    
    battery.addEventListener('levelchange', () => {
      if (battery.level < 0.1) {
        // Disable continuous monitoring
        this.disableContinuousMonitoring();
      }
    });
  }

  disableContinuousMonitoring() {
    // Disable MutationObserver and other continuous features
    // Only detect on page load
  }
}
```

## Tasks / Subtasks

- [ ] Create mobile optimizer module: `src/performance/mobile-optimizer.js`
  - [ ] Implement fast detection methods
  - [ ] Implement cache-first strategy
  - [ ] Implement battery monitoring

- [ ] Create unit tests: `tests/performance/mobile-optimizer.test.js`
  - [ ] Test fast detection
  - [ ] Test cache-first strategy
  - [ ] Test battery monitoring

- [ ] Integration tests
  - [ ] Test on mobile devices
  - [ ] Test battery impact
  - [ ] Test performance metrics

## Dev Notes

**Architecture Reference:** [Source: docs/architecture.md#AD-002: Adaptive Performance Architecture]

**Speed Mode Optimizations:**
- CSS + XPath only (no DOM analysis)
- Cache-first strategy
- Skip AI verification
- Disable continuous monitoring

**Performance Targets:**
- Detection: 50-100ms
- Cache hit: <5ms
- Battery impact: <1% per hour
- Cache hit rate: 80%+

## References

- [Architecture: AD-002 - Adaptive Performance Architecture](docs/architecture.md#ad-002-adaptive-performance-architecture)
- [Epic 3: Performance & Adaptation](docs/epics.md#epic-3-performance--adaptation---adaptive-performance)

## Dev Agent Record

### Completion Notes

- [ ] Code review completed
- [ ] Tests passing
- [ ] Performance targets met
- [ ] Battery impact verified
- [ ] Ready for Epic 4 (UI)

### File List

- src/performance/mobile-optimizer.js
- tests/performance/mobile-optimizer.test.js
