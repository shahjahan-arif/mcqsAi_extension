/**
 * Rate Limiter for Gemini API
 * Manages request rate limiting to respect free tier limits
 * Limits: 15 requests/minute, 1500 requests/day
 */

/**
 * RateLimiter manages API request rate limiting
 * Tracks per-minute and per-day request counts
 * Implements request queuing at 1-2 requests per second
 */
export class RateLimiter {
  constructor() {
    this.perMinuteLimit = 15;
    this.perDayLimit = 1500;
    this.requestsPerSecond = 2;

    this.requestTimestamps = [];
    this.dailyCount = 0;
    this.dailyResetTime = this.getNextMidnight();
  }

  /**
   * Checks if a request is allowed under current rate limits
   * Resets daily count if day has changed
   * Cleans up old request timestamps
   *
   * @returns {Promise<Object>} Result with allowed flag and reason/retryAfter if denied
   */
  async checkLimit() {
    // Check and reset daily limit if needed
    if (this.isDayReset()) {
      this.dailyCount = 0;
      this.dailyResetTime = this.getNextMidnight();
    }

    // Check daily limit
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

    // Clean up old timestamps
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

  /**
   * Records a request timestamp
   * Increments daily counter
   *
   * @returns {Promise<void>}
   */
  async recordRequest() {
    this.requestTimestamps.push(Date.now());
    this.dailyCount++;
  }

  /**
   * Waits for appropriate time slot to maintain 1-2 requests per second
   * Ensures requests are spaced out properly
   *
   * @returns {Promise<void>}
   */
  async waitForSlot() {
    // Ensure 1-2 requests per second (500-1000ms between requests)
    const minInterval = 1000 / this.requestsPerSecond;
    const lastRequest = this.requestTimestamps[this.requestTimestamps.length - 1];

    if (lastRequest) {
      const timeSinceLastRequest = Date.now() - lastRequest;
      if (timeSinceLastRequest < minInterval) {
        const waitTime = minInterval - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  /**
   * Gets current rate limiting statistics
   * Calculates remaining quota for minute and day
   *
   * @returns {Object} Statistics object
   */
  getStats() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const requestsThisMinute = this.requestTimestamps.filter(t => t > oneMinuteAgo).length;

    return {
      requestsThisMinute,
      perMinuteLimit: this.perMinuteLimit,
      minuteRemaining: this.perMinuteLimit - requestsThisMinute,
      dailyCount: this.dailyCount,
      perDayLimit: this.perDayLimit,
      dailyRemaining: this.perDayLimit - this.dailyCount,
      dailyResetTime: this.dailyResetTime
    };
  }

  /**
   * Checks if daily limit has been reset
   * Compares current time with daily reset time
   *
   * @returns {boolean} True if day has changed
   */
  isDayReset() {
    return Date.now() >= this.dailyResetTime;
  }

  /**
   * Calculates next midnight (daily reset time)
   * Used for daily quota reset
   *
   * @returns {number} Timestamp of next midnight
   */
  getNextMidnight() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime();
  }

  /**
   * Resets all rate limiting counters
   * Useful for testing or manual reset
   *
   * @returns {void}
   */
  reset() {
    this.requestTimestamps = [];
    this.dailyCount = 0;
    this.dailyResetTime = this.getNextMidnight();
  }
}
