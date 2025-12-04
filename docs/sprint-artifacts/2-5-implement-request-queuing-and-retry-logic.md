# Story 2.5: Implement Request Queuing and Retry Logic

Status: ready-for-dev

## Story

As a developer,
I want to implement request queuing and retry logic,
So that the system handles multiple simultaneous requests and recovers from transient failures.

## Acceptance Criteria

1. **Given** multiple quiz questions on a page
   **When** answers are requested simultaneously
   **Then** it queues requests at 1-2 per second

2. **And** it processes queue in FIFO order

3. **And** it implements exponential backoff retry: 1s, 2s

4. **And** it retries up to 2 times on transient errors

5. **And** it fails fast on permanent errors (401, 403)

6. **And** it logs all requests and responses for debugging

## Technical Implementation

**Component:** `RequestQueue` class

```javascript
class RequestQueue {
  constructor(rateLimiter, apiClient) {
    this.rateLimiter = rateLimiter;
    this.apiClient = apiClient;
    this.queue = [];
    this.processing = false;
    this.logs = [];
  }

  async enqueue(question, context = null) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        question,
        context,
        resolve,
        reject,
        retries: 0,
        createdAt: Date.now()
      });
      
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const request = this.queue.shift();
      
      try {
        // Check rate limit
        const limitCheck = await this.rateLimiter.checkLimit();
        if (!limitCheck.allowed) {
          request.reject(new Error(limitCheck.reason));
          continue;
        }
        
        // Wait for rate limit slot
        await this.rateLimiter.waitForSlot();
        
        // Execute request with retry logic
        const result = await this.executeWithRetry(request);
        
        // Record request
        this.rateLimiter.recordRequest();
        this.log('success', request.question, result);
        
        request.resolve(result);
      } catch (error) {
        this.log('error', request.question, error);
        request.reject(error);
      }
    }
    
    this.processing = false;
  }

  async executeWithRetry(request) {
    const maxRetries = 2;
    const retryDelays = [1000, 2000]; // exponential backoff
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.apiClient.getAnswer(request.question, request.context);
      } catch (error) {
        // Check if error is retryable
        if (!this.isRetryable(error) || attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retry
        const delay = retryDelays[attempt];
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  isRetryable(error) {
    // Transient errors: timeout, 408, 429, 500, 502, 503, 504
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    
    if (error instanceof TimeoutError) return true;
    if (error instanceof APIError && retryableStatuses.includes(error.status)) return true;
    
    // Permanent errors: 400, 401, 403, 404
    const permanentStatuses = [400, 401, 403, 404];
    if (error instanceof APIError && permanentStatuses.includes(error.status)) return false;
    
    return false;
  }

  log(status, question, result) {
    this.logs.push({
      timestamp: Date.now(),
      status,
      question: question.substring(0, 100), // Truncate for logging
      result: result instanceof Error ? result.message : 'success'
    });
    
    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs.shift();
    }
  }

  getLogs() {
    return this.logs;
  }

  getQueueStats() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      totalLogged: this.logs.length
    };
  }
}
```

## Tasks / Subtasks

- [ ] Create request queue module: `src/api/request-queue.js`
  - [ ] Implement RequestQueue class
  - [ ] Implement FIFO queue processing
  - [ ] Implement retry logic with exponential backoff
  - [ ] Implement logging

- [ ] Create unit tests: `tests/api/request-queue.test.js`
  - [ ] Test queue processing
  - [ ] Test retry logic
  - [ ] Test error handling
  - [ ] Test logging

- [ ] Integration tests
  - [ ] Test with multiple simultaneous requests
  - [ ] Test retry scenarios
  - [ ] Test rate limiting integration

## Dev Notes

**Architecture Reference:** [Source: docs/architecture.md#AD-003: Rate Limiting Strategy]

**Queue Strategy:**
- FIFO processing
- 1-2 requests per second
- Exponential backoff: 1s, 2s
- Max 2 retries

**Retryable Errors:**
- Timeout (408)
- Rate limit (429)
- Server errors (500, 502, 503, 504)

**Permanent Errors:**
- Bad request (400)
- Unauthorized (401)
- Forbidden (403)
- Not found (404)

**Performance Targets:**
- Queue processing: <100ms overhead
- Retry overhead: <2 seconds max
- Logging: <1ms per request

**Testing Standards:**
- Unit tests for queue processing
- Integration tests with API
- Error scenario testing
- Performance benchmarks

**Source Tree Components:**
- `src/api/request-queue.js` - Request queue
- `tests/api/request-queue.test.js` - Tests

## References

- [Architecture: AD-003 - Gemini 1.5 Flash as Primary AI Backend](docs/architecture.md#ad-003-gemini-15-flash-as-primary-ai-backend)
- [Architecture: Rate Limiting Strategy](docs/architecture.md#rate-limiting-strategy)
- [Epic 2: AI Integration & Caching](docs/epics.md#epic-2-ai-integration--caching---answer-generation)

## Dev Agent Record

### Completion Notes

- [ ] Code review completed
- [ ] Tests passing (100% coverage)
- [ ] Queue processing verified
- [ ] Retry logic tested
- [ ] Rate limiting integration verified
- [ ] Ready for Epic 3 (Performance & Adaptation)

### File List

- src/api/request-queue.js
- tests/api/request-queue.test.js
