# Story 2.3: Implement Cache-First Answer Retrieval

Status: ready-for-dev

## Story

As a developer,
I want to implement cache-first answer retrieval,
So that the system returns cached answers instantly and only calls API on cache miss.

## Acceptance Criteria

1. **Given** a quiz question
   **When** answer retrieval is requested
   **Then** it generates question hash

2. **And** it checks IndexedDB cache first

3. **And** if cache hit: returns cached answer instantly (<5ms)

4. **And** if cache miss: calls Gemini API

5. **And** it stores API response in cache

6. **And** it updates hitCount and lastAccessed timestamp

7. **And** it returns answer to content script

8. **And** it tracks cache statistics: hit rate, miss rate

## Technical Implementation

**Component:** `AnswerRetriever` class

```javascript
class AnswerRetriever {
  constructor(cache, apiClient) {
    this.cache = cache;
    this.apiClient = apiClient;
    this.stats = {
      hits: 0,
      misses: 0,
      totalTime: 0
    };
  }

  async getAnswer(question, context = null) {
    const startTime = performance.now();
    
    try {
      // Generate hash
      const hash = await generateHash(question);
      
      // Check cache
      const cached = await this.cache.get(hash);
      if (cached) {
        this.stats.hits++;
        const elapsed = performance.now() - startTime;
        this.stats.totalTime += elapsed;
        
        return {
          answer: cached.answer,
          confidence: cached.confidence,
          source: 'cache',
          elapsed
        };
      }
      
      // Cache miss - call API
      this.stats.misses++;
      const apiResult = await this.apiClient.getAnswer(question, context);
      
      // Store in cache
      await this.cache.set(hash, {
        questionHash: hash,
        question,
        answer: apiResult.answer,
        confidence: apiResult.confidence,
        timestamp: Date.now(),
        platform: window.location.hostname,
        quizType: 'unknown', // Will be set by detection engine
        hitCount: 0,
        lastAccessed: Date.now()
      });
      
      const elapsed = performance.now() - startTime;
      this.stats.totalTime += elapsed;
      
      return {
        answer: apiResult.answer,
        confidence: apiResult.confidence,
        source: 'api',
        elapsed
      };
    } catch (error) {
      return {
        answer: null,
        confidence: 0,
        error: error.message,
        source: 'error'
      };
    }
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      total,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : '0%',
      avgTime: total > 0 ? (this.stats.totalTime / total).toFixed(2) + 'ms' : '0ms'
    };
  }

  resetStats() {
    this.stats = { hits: 0, misses: 0, totalTime: 0 };
  }
}
```

## Tasks / Subtasks

- [ ] Create answer retriever module: `src/answer/retriever.js`
  - [ ] Implement AnswerRetriever class
  - [ ] Implement cache-first logic
  - [ ] Implement statistics tracking

- [ ] Create unit tests: `tests/answer/retriever.test.js`
  - [ ] Test cache hit scenario
  - [ ] Test cache miss scenario
  - [ ] Test API error handling
  - [ ] Test statistics tracking

- [ ] Integration tests
  - [ ] Test with real cache and API
  - [ ] Test performance: <5ms cache hit
  - [ ] Test statistics accuracy

## Dev Notes

**Architecture Reference:** [Source: docs/architecture.md#AD-004: IndexedDB Smart Caching Architecture]

**Cache Strategy:**
- Check cache first (0ms overhead)
- Return cached answer instantly on hit
- Call API only on cache miss
- Store API response in cache
- Track hit/miss statistics

**Performance Targets:**
- Cache hit: <5ms
- Cache miss: <1000ms (API call)
- Statistics tracking: <1ms

**Expected Cache Hit Rate:** 70-80%

**Testing Standards:**
- Unit tests for cache hit/miss
- Integration tests with real cache
- Performance benchmarks
- Error scenario testing

**Source Tree Components:**
- `src/answer/retriever.js` - Answer retriever
- `tests/answer/retriever.test.js` - Tests

## References

- [Architecture: AD-004 - IndexedDB Smart Caching Architecture](docs/architecture.md#ad-004-indexeddb-smart-caching-architecture)
- [Epic 2: AI Integration & Caching](docs/epics.md#epic-2-ai-integration--caching---answer-generation)

## Dev Agent Record

### Completion Notes

- [ ] Code review completed
- [ ] Tests passing (100% coverage)
- [ ] Performance benchmarks met
- [ ] Statistics tracking verified
- [ ] Ready for Story 2.4 (Rate Limiting)

### File List

- src/answer/retriever.js
- tests/answer/retriever.test.js
