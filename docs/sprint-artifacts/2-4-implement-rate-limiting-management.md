# Story 2.4: Implement Rate Limiting Management

Status: ready-for-dev

## Story

As a developer,
I want to implement rate limiting management,
So that the system respects Gemini free tier limits and queues requests appropriately.

## Acceptance Criteria

1. **Given** the Gemini free tier limits (15 req/min, 1500 req/day)
   **When** requests are made to the API
   **Then** it tracks request count per minute

2. **And** it tracks request count per day

3. **And** it queues requests at 1-2 per second

4. **And** it prevents exceeding 15 requests per minute

5. **And** it prevents exceeding 1500 requests per day

6. **And** it notifies user when rate limit is reached

7. **And** it falls back to cached answers only when limit exceeded

## Technical Implementation

**Component:** `RateLimiter` class

```javascript
class RateLimiter {
  constructor() {
    this.perMinuteLimit = 15;
    this.perDayLimit = 1500;
    this.requestsPerSecond = 2;
    
    this.requestTimestamps = [];
    this.dailyCount = 0;
    this.dailyResetTime = this.getNextMidnight();
  }

  async checkLimit() {
    // Check daily limit
    if (this.isDayReset()) {
      this.dailyCount = 0;
      this.dailyResetTime = this.getNextMidnight();
    }
    
    if (this.dailyCount >= this.perDayLimit) {
      return {
        allowed: false,
        reason: 'Daily limit exceeded (1500/day)',
        retryAfter: this.dailyResetTime - Date.now()
      };
    }
    
    // Check per-minute limit
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    this.requestTimestamps = this.requestTimestamps.filter(t => t > oneMinuteAgo);
    
    if (this.requestTimestamps.length >= this.perMinuteLimit) {
      const oldestRequest = this.requestTimestamps[0];
      const retryAfter = oldestRequest + 60000 - now;
      
      return {
        allowed: false,
        reason: 'Per-minute limit exceeded (15/min)',
        retryAfter
      };
    }
    
    return { allowed: true };
  }

  async recordRequest() {
    this.requestTimestamps.push(Date.now());
    this.dailyCount++;
  }

  async waitForSlot() {
    // Ensure 1-2 requests per second
    const minInterval = 1000 / this.requestsPerSecond;
    const lastRequest = this.requestTimestamps[this.requestTimestamps.length - 1];
    
    if (lastRequest) {
      const timeSinceLastRequest = Date.now() - lastRequest;
      if (timeSinceLastRequest < minInterval) {
        await new Promise(resolve => 
          setTimeout(resolve, minInterval - timeSinceLastRequest)
        );
      }
    }
  }

  getStats() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const requestsThisMinute = this.requestTimestamps.filter(t => t > oneMinuteAgo).length;
    
    return {
      requestsThisMinute,
      perMinuteLimit: this.perMinuteLimit,
      dailyCount: this.dailyCount,
      perDayLimit: this.perDayLimit,
      dailyRemaining: this.perDayLimit - this.dailyCount,
      minuteRemaining: this.perMinuteLimit - requestsThisMinute
    };
  }

  isDayReset() {
    return Date.now() >= this.dailyResetTime;
  }

  getNextMidnight() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }
}
```

## Tasks / Subtasks

- [ ] Create rate limiter module: `src/api/rate-limiter.js`
  - [ ] Implement RateLimiter class
  - [ ] Implement per-minute tracking
  - [ ] Implement per-day tracking
  - [ ] Implement request queuing

- [ ] Create unit tests: `tests/api/rate-limiter.test.js`
  - [ ] Test per-minute limit
  - [ ] Test per-day limit
  - [ ] Test request queuing
  - [ ] Test statistics

- [ ] Integration with API client
  - [ ] Check limits before API call
  - [ ] Queue requests appropriately
  - [ ] Notify user on limit exceeded

## Dev Notes

**Architecture Reference:** [Source: docs/architecture.md#AD-003: Rate Limiting Strategy]

**Rate Limits:**
- Per minute: 15 requests
- Per day: 1500 requests
- Request rate: 1-2 per second

**Expected Usage:**
- Average user: 50-100 questions/day
- Cache hit rate: 70-80%
- Actual API calls: 10-30/day
- Well within free tier limits

**Performance Targets:**
- Limit check: <1ms
- Request queuing: <100ms overhead

**Testing Standards:**
- Unit tests for all limits
- Integration tests with API
- Performance benchmarks
- Edge cases: limit exceeded, day reset

**Source Tree Components:**
- `src/api/rate-limiter.js` - Rate limiter
- `tests/api/rate-limiter.test.js` - Tests

## References

- [Architecture: AD-003 - Gemini 1.5 Flash as Primary AI Backend](docs/architecture.md#ad-003-gemini-15-flash-as-primary-ai-backend)
- [Architecture: Rate Limiting Strategy](docs/architecture.md#rate-limiting-strategy)
- [Epic 2: AI Integration & Caching](docs/epics.md#epic-2-ai-integration--caching---answer-generation)

## Dev Agent Record

### Completion Notes

- [ ] Code review completed
- [ ] Tests passing (100% coverage)
- [ ] Limit tracking verified
- [ ] Request queuing tested
- [ ] Ready for Story 2.5 (Request Queuing & Retry)

### File List

- src/api/rate-limiter.js
- tests/api/rate-limiter.test.js
