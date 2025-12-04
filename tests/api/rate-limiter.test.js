/**
 * Rate Limiter Tests
 * Tests rate limiting functionality for Gemini API
 */

import { RateLimiter } from '../../src/api/rate-limiter.js';

describe('RateLimiter', () => {
  let limiter;

  beforeEach(() => {
    limiter = new RateLimiter();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize with correct limits', () => {
      expect(limiter.perMinuteLimit).toBe(15);
      expect(limiter.perDayLimit).toBe(1500);
      expect(limiter.requestsPerSecond).toBe(2);
    });

    it('should initialize with empty request timestamps', () => {
      expect(limiter.requestTimestamps).toEqual([]);
    });

    it('should initialize with zero daily count', () => {
      expect(limiter.dailyCount).toBe(0);
    });

    it('should set daily reset time to next midnight', () => {
      const now = Date.now();
      expect(limiter.dailyResetTime).toBeGreaterThan(now);
    });
  });

  describe('checkLimit - per-minute limit', () => {
    it('should allow request when under per-minute limit', async () => {
      const result = await limiter.checkLimit();

      expect(result.allowed).toBe(true);
    });

    it('should allow up to 15 requests per minute', async () => {
      for (let i = 0; i < 15; i++) {
        await limiter.recordRequest();
      }

      const result = await limiter.checkLimit();

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Per-minute limit exceeded');
    });

    it('should deny request when per-minute limit exceeded', async () => {
      // Record 15 requests
      for (let i = 0; i < 15; i++) {
        limiter.requestTimestamps.push(Date.now());
      }

      const result = await limiter.checkLimit();

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Per-minute limit exceeded (15/min)');
    });

    it('should return retryAfter when per-minute limit exceeded', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Record 15 requests at current time
      for (let i = 0; i < 15; i++) {
        limiter.requestTimestamps.push(now);
      }

      const result = await limiter.checkLimit();

      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(60000);
    });

    it('should clean up old timestamps outside 1-minute window', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Add request 2 minutes ago
      limiter.requestTimestamps.push(now - 120000);

      // Add request 30 seconds ago
      limiter.requestTimestamps.push(now - 30000);

      await limiter.checkLimit();

      // Old request should be cleaned up
      expect(limiter.requestTimestamps.length).toBe(1);
      expect(limiter.requestTimestamps[0]).toBe(now - 30000);
    });

    it('should allow new requests after 1 minute window passes', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Record 15 requests
      for (let i = 0; i < 15; i++) {
        limiter.requestTimestamps.push(now);
      }

      // Verify limit exceeded
      let result = await limiter.checkLimit();
      expect(result.allowed).toBe(false);

      // Advance time by 1 minute
      jest.setSystemTime(now + 60001);

      // Should allow new request
      result = await limiter.checkLimit();
      expect(result.allowed).toBe(true);
    });
  });

  describe('checkLimit - per-day limit', () => {
    it('should allow request when under per-day limit', async () => {
      limiter.dailyCount = 100;

      const result = await limiter.checkLimit();

      expect(result.allowed).toBe(true);
    });

    it('should deny request when per-day limit exceeded', async () => {
      limiter.dailyCount = 1500;

      const result = await limiter.checkLimit();

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Daily limit exceeded (1500/day)');
    });

    it('should return retryAfter when per-day limit exceeded', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      limiter.dailyCount = 1500;
      limiter.dailyResetTime = now + 3600000; // 1 hour from now

      const result = await limiter.checkLimit();

      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should reset daily count at midnight', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      limiter.dailyCount = 1500;
      limiter.dailyResetTime = now - 1; // Already past reset time

      await limiter.checkLimit();

      expect(limiter.dailyCount).toBe(0);
    });

    it('should set new daily reset time after reset', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      const oldResetTime = limiter.dailyResetTime;
      limiter.dailyResetTime = now - 1;

      await limiter.checkLimit();

      expect(limiter.dailyResetTime).not.toBe(oldResetTime);
      expect(limiter.dailyResetTime).toBeGreaterThan(now);
    });
  });

  describe('recordRequest', () => {
    it('should add timestamp to request list', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      await limiter.recordRequest();

      expect(limiter.requestTimestamps).toContain(now);
    });

    it('should increment daily count', async () => {
      expect(limiter.dailyCount).toBe(0);

      await limiter.recordRequest();

      expect(limiter.dailyCount).toBe(1);
    });

    it('should record multiple requests', async () => {
      for (let i = 0; i < 5; i++) {
        await limiter.recordRequest();
      }

      expect(limiter.requestTimestamps.length).toBe(5);
      expect(limiter.dailyCount).toBe(5);
    });
  });

  describe('waitForSlot', () => {
    it('should not wait if no previous requests', async () => {
      const start = Date.now();
      jest.setSystemTime(start);

      await limiter.waitForSlot();

      expect(Date.now()).toBe(start);
    });

    it('should wait to maintain 1-2 requests per second', async () => {
      const start = Date.now();
      jest.setSystemTime(start);

      // Record first request
      await limiter.recordRequest();

      // Advance time by 100ms (less than 500ms minimum)
      jest.setSystemTime(start + 100);

      // Wait for slot
      await limiter.waitForSlot();

      // Should have waited ~400ms
      expect(Date.now()).toBeGreaterThanOrEqual(start + 500);
    });

    it('should not wait if enough time has passed', async () => {
      const start = Date.now();
      jest.setSystemTime(start);

      // Record first request
      await limiter.recordRequest();

      // Advance time by 600ms (more than 500ms minimum)
      jest.setSystemTime(start + 600);

      // Wait for slot
      await limiter.waitForSlot();

      // Should not have waited
      expect(Date.now()).toBe(start + 600);
    });

    it('should enforce 500ms minimum interval for 2 req/sec', async () => {
      const start = Date.now();
      jest.setSystemTime(start);

      await limiter.recordRequest();
      jest.setSystemTime(start + 100);
      await limiter.waitForSlot();

      // Should wait 400ms to reach 500ms total
      expect(Date.now()).toBe(start + 500);
    });
  });

  describe('getStats', () => {
    it('should return initial stats', () => {
      const stats = limiter.getStats();

      expect(stats).toEqual({
        requestsThisMinute: 0,
        perMinuteLimit: 15,
        minuteRemaining: 15,
        dailyCount: 0,
        perDayLimit: 1500,
        dailyRemaining: 1500,
        dailyResetTime: expect.any(Number)
      });
    });

    it('should calculate requests this minute correctly', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Add 5 requests in current minute
      for (let i = 0; i < 5; i++) {
        limiter.requestTimestamps.push(now);
      }

      // Add 3 requests outside current minute
      limiter.requestTimestamps.push(now - 120000);
      limiter.requestTimestamps.push(now - 90000);
      limiter.requestTimestamps.push(now - 61000);

      const stats = limiter.getStats();

      expect(stats.requestsThisMinute).toBe(5);
    });

    it('should calculate minute remaining correctly', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      for (let i = 0; i < 7; i++) {
        limiter.requestTimestamps.push(now);
      }

      const stats = limiter.getStats();

      expect(stats.minuteRemaining).toBe(8); // 15 - 7
    });

    it('should calculate daily remaining correctly', () => {
      limiter.dailyCount = 500;

      const stats = limiter.getStats();

      expect(stats.dailyRemaining).toBe(1000); // 1500 - 500
    });

    it('should include daily reset time', () => {
      const stats = limiter.getStats();

      expect(stats.dailyResetTime).toBe(limiter.dailyResetTime);
    });
  });

  describe('isDayReset', () => {
    it('should return false if day has not reset', () => {
      const now = Date.now();
      jest.setSystemTime(now);

      limiter.dailyResetTime = now + 3600000; // 1 hour from now

      expect(limiter.isDayReset()).toBe(false);
    });

    it('should return true if day has reset', () => {
      const now = Date.now();
      jest.setSystemTime(now);

      limiter.dailyResetTime = now - 1; // Already passed

      expect(limiter.isDayReset()).toBe(true);
    });

    it('should return true at exact reset time', () => {
      const now = Date.now();
      jest.setSystemTime(now);

      limiter.dailyResetTime = now;

      expect(limiter.isDayReset()).toBe(true);
    });
  });

  describe('getNextMidnight', () => {
    it('should return a timestamp in the future', () => {
      const now = Date.now();
      jest.setSystemTime(now);

      const midnight = limiter.getNextMidnight();

      expect(midnight).toBeGreaterThan(now);
    });

    it('should return midnight of next day', () => {
      const now = new Date('2024-01-15T10:30:00Z').getTime();
      jest.setSystemTime(now);

      const midnight = limiter.getNextMidnight();
      const midnightDate = new Date(midnight);

      expect(midnightDate.getHours()).toBe(0);
      expect(midnightDate.getMinutes()).toBe(0);
      expect(midnightDate.getSeconds()).toBe(0);
      expect(midnightDate.getMilliseconds()).toBe(0);
    });

    it('should be approximately 24 hours away', () => {
      const now = Date.now();
      jest.setSystemTime(now);

      const midnight = limiter.getNextMidnight();
      const diff = midnight - now;

      // Should be between 0 and 24 hours
      expect(diff).toBeGreaterThan(0);
      expect(diff).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
    });
  });

  describe('reset', () => {
    it('should clear request timestamps', () => {
      limiter.requestTimestamps = [1, 2, 3];

      limiter.reset();

      expect(limiter.requestTimestamps).toEqual([]);
    });

    it('should reset daily count to zero', () => {
      limiter.dailyCount = 500;

      limiter.reset();

      expect(limiter.dailyCount).toBe(0);
    });

    it('should reset daily reset time', () => {
      const oldResetTime = limiter.dailyResetTime;

      limiter.reset();

      expect(limiter.dailyResetTime).not.toBe(oldResetTime);
    });
  });

  describe('integration scenarios', () => {
    it('should handle typical usage pattern', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Simulate 10 requests throughout the day
      for (let i = 0; i < 10; i++) {
        const checkResult = await limiter.checkLimit();
        expect(checkResult.allowed).toBe(true);

        await limiter.recordRequest();
        jest.setSystemTime(now + (i + 1) * 5000); // 5 seconds apart
      }

      const stats = limiter.getStats();
      expect(stats.dailyCount).toBe(10);
      expect(stats.dailyRemaining).toBe(1490);
    });

    it('should handle burst of requests within minute', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Record 15 requests rapidly
      for (let i = 0; i < 15; i++) {
        const checkResult = await limiter.checkLimit();
        if (i < 15) {
          expect(checkResult.allowed).toBe(true);
        }
        await limiter.recordRequest();
      }

      // 16th request should be denied
      const result = await limiter.checkLimit();
      expect(result.allowed).toBe(false);
    });

    it('should handle day boundary crossing', async () => {
      const now = new Date('2024-01-15T23:59:00Z').getTime();
      jest.setSystemTime(now);

      limiter.dailyCount = 1400;
      limiter.dailyResetTime = new Date('2024-01-16T00:00:00Z').getTime();

      // Should allow request before reset
      let result = await limiter.checkLimit();
      expect(result.allowed).toBe(true);

      // Advance to after midnight
      jest.setSystemTime(now + 120000);

      // Should reset and allow request
      result = await limiter.checkLimit();
      expect(result.allowed).toBe(true);
      expect(limiter.dailyCount).toBe(0);
    });

    it('should track stats accurately through multiple operations', async () => {
      const now = Date.now();
      jest.setSystemTime(now);

      // Record 5 requests
      for (let i = 0; i < 5; i++) {
        await limiter.recordRequest();
      }

      let stats = limiter.getStats();
      expect(stats.requestsThisMinute).toBe(5);
      expect(stats.dailyCount).toBe(5);

      // Advance 30 seconds
      jest.setSystemTime(now + 30000);

      // Record 3 more
      for (let i = 0; i < 3; i++) {
        await limiter.recordRequest();
      }

      stats = limiter.getStats();
      expect(stats.requestsThisMinute).toBe(8);
      expect(stats.dailyCount).toBe(8);
    });
  });
});
