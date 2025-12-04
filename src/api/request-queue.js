/**
 * Request Queue for API Requests
 * Manages queuing, rate limiting, and retry logic for API calls
 */

import { APIError, TimeoutError } from './errors.js';

/**
 * RequestQueue manages API request queuing with retry logic
 * Processes requests in FIFO order with exponential backoff retries
 */
export class RequestQueue {
  constructor(rateLimiter, apiClient) {
    if (!rateLimiter) {
      throw new Error('Rate limiter instance is required');
    }
    if (!apiClient) {
      throw new Error('API client instance is required');
    }

    this.rateLimiter = rateLimiter;
    this.apiClient = apiClient;
    this.queue = [];
    this.processing = false;
    this.logs = [];
    this.maxLogs = 100;
  }

  /**
   * Enqueues a request for processing
   * Returns a promise that resolves when request is processed
   *
   * @param {string} question - The quiz question
   * @param {string} context - Optional context for the question
   * @returns {Promise<Object>} API response
   */
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

  /**
   * Processes the request queue in FIFO order
   * Respects rate limiting and implements retry logic
   *
   * @returns {Promise<void>}
   */
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
          const error = new Error(limitCheck.reason);
          this.log('rate-limit', request.question, error);
          request.reject(error);
          continue;
        }

        // Wait for rate limit slot
        await this.rateLimiter.waitForSlot();

        // Execute request with retry logic
        const result = await this.executeWithRetry(request);

        // Record request
        await this.rateLimiter.recordRequest();
        this.log('success', request.question, result);

        request.resolve(result);
      } catch (error) {
        this.log('error', request.question, error);
        request.reject(error);
      }
    }

    this.processing = false;
  }

  /**
   * Executes a request with exponential backoff retry logic
   * Retries up to 2 times on transient errors
   *
   * @param {Object} request - Request object with question and context
   * @returns {Promise<Object>} API response
   */
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

  /**
   * Determines if an error is retryable
   * Transient errors (timeout, 408, 429, 5xx) are retryable
   * Permanent errors (4xx except 408, 429) are not
   *
   * @param {Error} error - The error to check
   * @returns {boolean} True if error is retryable
   */
  isRetryable(error) {
    // Transient errors: timeout, 408, 429, 500, 502, 503, 504
    const retryableStatuses = [408, 429, 500, 502, 503, 504];

    if (error instanceof TimeoutError) {
      return true;
    }

    if (error instanceof APIError) {
      if (retryableStatuses.includes(error.status)) {
        return true;
      }

      // Permanent errors: 400, 401, 403, 404
      const permanentStatuses = [400, 401, 403, 404];
      if (permanentStatuses.includes(error.status)) {
        return false;
      }
    }

    // Unknown errors are not retried
    return false;
  }

  /**
   * Logs a request/response for debugging
   * Keeps only the last 100 logs
   *
   * @param {string} status - Status: 'success', 'error', 'rate-limit'
   * @param {string} question - The question text
   * @param {Object|Error} result - The result or error
   * @returns {void}
   */
  log(status, question, result) {
    this.logs.push({
      timestamp: Date.now(),
      status,
      question: question.substring(0, 100), // Truncate for logging
      result: result instanceof Error ? result.message : 'success'
    });

    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Gets all logged requests
   *
   * @returns {Array<Object>} Array of log entries
   */
  getLogs() {
    return [...this.logs];
  }

  /**
   * Gets queue statistics
   *
   * @returns {Object} Statistics object
   */
  getQueueStats() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      totalLogged: this.logs.length
    };
  }

  /**
   * Clears all logs
   *
   * @returns {void}
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Gets the current queue length
   *
   * @returns {number} Number of pending requests
   */
  getQueueLength() {
    return this.queue.length;
  }

  /**
   * Checks if queue is currently processing
   *
   * @returns {boolean} True if processing
   */
  isProcessing() {
    return this.processing;
  }
}
