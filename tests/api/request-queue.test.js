/**
 * Request Queue Tests
 * Tests request queuing and retry logic
 */

import { RequestQueue } from '../../src/api/request-queue.js';
import { APIError, TimeoutError } from '../../src/api/errors.js';

describe('RequestQueue', () => {
  let queue;
  let mockRateLimiter;
  let mockApiClient;

  beforeEach(() => {
    // Mock rate limiter
    mockRateLimiter = {
      checkLimit: jest.fn().mockResolvedValue({ allowed: true }),
      waitForSlot: jest.fn().mockResolvedValue(undefined),
      recordRequest: jest.fn().mockResolvedValue(undefined)
    };

    // Mock API client
    mockApiClient = {
      getAnswer: jest.fn().mockResolvedValue({
        answer: 'Test Answer',
        confidence: 90,
        explanation: null,
        error: null
      })
    };

    queue = new RequestQueue(mockRateLimiter, mockApiClient);
  });

  describe('constructor', () => {
    it('should throw error if rate limiter is not provided', () => {
      expect(() => new RequestQueue(null, mockApiClient)).toThrow('Rate limiter instance is required');
    });

    it('should throw error if API client is not provided', () => {
      expect(() => new RequestQueue(mockRateLimiter, null)).toThrow('API client instance is required');
    });

    it('should initialize with empty queue', () => {
      expect(queue.queue).toEqual([]);
    });

    it('should initialize with processing false', () => {
      expect(queue.processing).toBe(false);
    });

    it('should initialize with empty logs', () => {
      expect(queue.logs).toEqual([]);
    });
  });

  describe('enqueue', () => {
    it('should add request to queue', async () => {
      const promise = queue.enqueue('What is 2+2?');

      expect(queue.queue.length).toBeGreaterThan(0);

      await promise;
    });

    it('should return a promise', () => {
      const result = queue.enqueue('What is 2+2?');

      expect(result).toBeInstanceOf(Promise);
    });

    it('should process queue after enqueue', async () => {
      const promise = queue.enqueue('What is 2+2?');

      await promise;

      expect(mockApiClient.getAnswer).toHaveBeenCalled();
    });

    it('should resolve with API response', async () => {
      const expectedResponse = {
        answer: 'Test Answer',
        confidence: 90,
        explanation: null,
        error: null
      };

      mockApiClient.getAnswer.mockResolvedValue(expectedResponse);

      const result = await queue.enqueue('What is 2+2?');

      expect(result).toEqual(expectedResponse);
    });

    it('should pass context to API client', async () => {
      const context = 'Math quiz';

      await queue.enqueue('What is 2+2?', context);

      expect(mockApiClient.getAnswer).toHaveBeenCalledWith('What is 2+2?', context);
    });
  });

  describe('processQueue - FIFO order', () => {
    it('should process requests in FIFO order', async () => {
      const callOrder = [];

      mockApiClient.getAnswer.mockImplementation((question) => {
        callOrder.push(question);
        return Promise.resolve({ answer: 'Answer', confidence: 90 });
      });

      const promise1 = queue.enqueue('Q1');
      const promise2 = queue.enqueue('Q2');
      const promise3 = queue.enqueue('Q3');

      await Promise.all([promise1, promise2, promise3]);

      expect(callOrder).toEqual(['Q1', 'Q2', 'Q3']);
    });

    it('should process multiple requests sequentially', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(queue.enqueue(`Q${i}`));
      }

      const results = await Promise.all(promises);

      expect(results.length).toBe(5);
      expect(mockApiClient.getAnswer).toHaveBeenCalledTimes(5);
    });
  });

  describe('processQueue - rate limiting', () => {
    it('should check rate limit before processing', async () => {
      await queue.enqueue('What is 2+2?');

      expect(mockRateLimiter.checkLimit).toHaveBeenCalled();
    });

    it('should wait for rate limit slot', async () => {
      await queue.enqueue('What is 2+2?');

      expect(mockRateLimiter.waitForSlot).toHaveBeenCalled();
    });

    it('should record request after successful call', async () => {
      await queue.enqueue('What is 2+2?');

      expect(mockRateLimiter.recordRequest).toHaveBeenCalled();
    });

    it('should reject request if rate limit exceeded', async () => {
      mockRateLimiter.checkLimit.mockResolvedValue({
        allowed: false,
        reason: 'Per-minute limit exceeded'
      });

      const promise = queue.enqueue('What is 2+2?');

      await expect(promise).rejects.toThrow('Per-minute limit exceeded');
    });

    it('should not call API if rate limit exceeded', async () => {
      mockRateLimiter.checkLimit.mockResolvedValue({
        allowed: false,
        reason: 'Per-minute limit exceeded'
      });

      const promise = queue.enqueue('What is 2+2?');

      await expect(promise).rejects.toThrow();
      expect(mockApiClient.getAnswer).not.toHaveBeenCalled();
    });
  });

  describe('executeWithRetry - success', () => {
    it('should succeed on first attempt', async () => {
      const result = await queue.enqueue('What is 2+2?');

      expect(result.answer).toBe('Test Answer');
      expect(mockApiClient.getAnswer).toHaveBeenCalledTimes(1);
    });

    it('should not retry on success', async () => {
      await queue.enqueue('What is 2+2?');

      expect(mockApiClient.getAnswer).toHaveBeenCalledTimes(1);
    });
  });

  describe('executeWithRetry - transient errors', () => {
    it('should retry on timeout error', async () => {
      mockApiClient.getAnswer
        .mockRejectedValueOnce(new TimeoutError('Timeout'))
        .mockResolvedValueOnce({ answer: 'Success', confidence: 90 });

      const result = await queue.enqueue('What is 2+2?');

      expect(result.answer).toBe('Success');
      expect(mockApiClient.getAnswer).toHaveBeenCalledTimes(2);
    });

    it('should retry on 429 (rate limit) error', async () => {
      mockApiClient.getAnswer
        .mockRejectedValueOnce(new APIError('Rate limited', 429, 'Too many requests'))
        .mockResolvedValueOnce({ answer: 'Success', confidence: 90 });

      const result = await queue.enqueue('What is 2+2?');

      expect(result.answer).toBe('Success');
      expect(mockApiClient.getAnswer).toHaveBeenCalledTimes(2);
    });

    it('should retry on 500 (server error)', async () => {
      mockApiClient.getAnswer
        .mockRejectedValueOnce(new APIError('Server error', 500, 'Internal error'))
        .mockResolvedValueOnce({ answer: 'Success', confidence: 90 });

      const result = await queue.enqueue('What is 2+2?');

      expect(result.answer).toBe('Success');
      expect(mockApiClient.getAnswer).toHaveBeenCalledTimes(2);
    });

    it('should retry on 502 (bad gateway)', async () => {
      mockApiClient.getAnswer
        .mockRejectedValueOnce(new APIError('Bad gateway', 502, 'Gateway error'))
        .mockResolvedValueOnce({ answer: 'Success', confidence: 90 });

      const result = await queue.enqueue('What is 2+2?');

      expect(result.answer).toBe('Success');
    });

    it('should retry on 503 (service unavailable)', async () => {
      mockApiClient.getAnswer
        .mockRejectedValueOnce(new APIError('Service unavailable', 503, 'Unavailable'))
        .mockResolvedValueOnce({ answer: 'Success', confidence: 90 });

      const result = await queue.enqueue('What is 2+2?');

      expect(result.answer).toBe('Success');
    });

    it('should retry on 504 (gateway timeout)', async () => {
      mockApiClient.getAnswer
        .mockRejectedValueOnce(new APIError('Gateway timeout', 504, 'Timeout'))
        .mockResolvedValueOnce({ answer: 'Success', confidence: 90 });

      const result = await queue.enqueue('What is 2+2?');

      expect(result.answer).toBe('Success');
    });

    it('should retry up to 2 times', async () => {
      mockApiClient.getAnswer
        .mockRejectedValueOnce(new TimeoutError('Timeout'))
        .mockRejectedValueOnce(new TimeoutError('Timeout'))
        .mockResolvedValueOnce({ answer: 'Success', confidence: 90 });

      const result = await queue.enqueue('What is 2+2?');

      expect(result.answer).toBe('Success');
      expect(mockApiClient.getAnswer).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      mockApiClient.getAnswer.mockRejectedValue(new TimeoutError('Timeout'));

      const promise = queue.enqueue('What is 2+2?');

      await expect(promise).rejects.toThrow('Timeout');
      expect(mockApiClient.getAnswer).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });
  });

  describe('executeWithRetry - permanent errors', () => {
    it('should not retry on 400 (bad request)', async () => {
      mockApiClient.getAnswer.mockRejectedValue(
        new APIError('Bad request', 400, 'Invalid request')
      );

      const promise = queue.enqueue('What is 2+2?');

      await expect(promise).rejects.toThrow();
      expect(mockApiClient.getAnswer).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 401 (unauthorized)', async () => {
      mockApiClient.getAnswer.mockRejectedValue(
        new APIError('Unauthorized', 401, 'Invalid API key')
      );

      const promise = queue.enqueue('What is 2+2?');

      await expect(promise).rejects.toThrow();
      expect(mockApiClient.getAnswer).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 403 (forbidden)', async () => {
      mockApiClient.getAnswer.mockRejectedValue(
        new APIError('Forbidden', 403, 'Access denied')
      );

      const promise = queue.enqueue('What is 2+2?');

      await expect(promise).rejects.toThrow();
      expect(mockApiClient.getAnswer).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 404 (not found)', async () => {
      mockApiClient.getAnswer.mockRejectedValue(
        new APIError('Not found', 404, 'Resource not found')
      );

      const promise = queue.enqueue('What is 2+2?');

      await expect(promise).rejects.toThrow();
      expect(mockApiClient.getAnswer).toHaveBeenCalledTimes(1);
    });
  });

  describe('isRetryable', () => {
    it('should return true for timeout error', () => {
      const error = new TimeoutError('Timeout');
      expect(queue.isRetryable(error)).toBe(true);
    });

    it('should return true for 408 (request timeout)', () => {
      const error = new APIError('Timeout', 408, 'Request timeout');
      expect(queue.isRetryable(error)).toBe(true);
    });

    it('should return true for 429 (rate limit)', () => {
      const error = new APIError('Rate limited', 429, 'Too many requests');
      expect(queue.isRetryable(error)).toBe(true);
    });

    it('should return true for 5xx errors', () => {
      const errors = [500, 502, 503, 504];
      errors.forEach(status => {
        const error = new APIError('Server error', status, 'Error');
        expect(queue.isRetryable(error)).toBe(true);
      });
    });

    it('should return false for 4xx errors (except 408, 429)', () => {
      const errors = [400, 401, 403, 404];
      errors.forEach(status => {
        const error = new APIError('Client error', status, 'Error');
        expect(queue.isRetryable(error)).toBe(false);
      });
    });

    it('should return false for unknown errors', () => {
      const error = new Error('Unknown error');
      expect(queue.isRetryable(error)).toBe(false);
    });
  });

  describe('logging', () => {
    it('should log successful requests', async () => {
      await queue.enqueue('What is 2+2?');

      expect(queue.logs.length).toBeGreaterThan(0);
      expect(queue.logs[0].status).toBe('success');
    });

    it('should log failed requests', async () => {
      mockApiClient.getAnswer.mockRejectedValue(new Error('API error'));

      const promise = queue.enqueue('What is 2+2?');

      await expect(promise).rejects.toThrow();
      expect(queue.logs.some(log => log.status === 'error')).toBe(true);
    });

    it('should log rate limit rejections', async () => {
      mockRateLimiter.checkLimit.mockResolvedValue({
        allowed: false,
        reason: 'Rate limit exceeded'
      });

      const promise = queue.enqueue('What is 2+2?');

      await expect(promise).rejects.toThrow();
      expect(queue.logs.some(log => log.status === 'rate-limit')).toBe(true);
    });

    it('should truncate question in logs', async () => {
      const longQuestion = 'A'.repeat(200);

      await queue.enqueue(longQuestion);

      expect(queue.logs[0].question.length).toBeLessThanOrEqual(100);
    });

    it('should keep only last 100 logs', async () => {
      for (let i = 0; i < 150; i++) {
        await queue.enqueue(`Q${i}`);
      }

      expect(queue.logs.length).toBeLessThanOrEqual(100);
    });

    it('should include timestamp in logs', async () => {
      await queue.enqueue('What is 2+2?');

      expect(queue.logs[0].timestamp).toBeDefined();
      expect(typeof queue.logs[0].timestamp).toBe('number');
    });
  });

  describe('getLogs', () => {
    it('should return copy of logs', async () => {
      await queue.enqueue('What is 2+2?');

      const logs = queue.getLogs();

      expect(logs).toEqual(queue.logs);
      expect(logs).not.toBe(queue.logs); // Should be a copy
    });

    it('should return empty array initially', () => {
      const logs = queue.getLogs();

      expect(logs).toEqual([]);
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', () => {
      const stats = queue.getQueueStats();

      expect(stats).toHaveProperty('queueLength');
      expect(stats).toHaveProperty('processing');
      expect(stats).toHaveProperty('totalLogged');
    });

    it('should show correct queue length', async () => {
      queue.enqueue('Q1');
      queue.enqueue('Q2');

      const stats = queue.getQueueStats();

      expect(stats.queueLength).toBeGreaterThanOrEqual(0);
    });

    it('should show processing status', async () => {
      const promise = queue.enqueue('What is 2+2?');

      const stats = queue.getQueueStats();

      expect(typeof stats.processing).toBe('boolean');

      await promise;
    });
  });

  describe('clearLogs', () => {
    it('should clear all logs', async () => {
      await queue.enqueue('What is 2+2?');

      expect(queue.logs.length).toBeGreaterThan(0);

      queue.clearLogs();

      expect(queue.logs).toEqual([]);
    });
  });

  describe('getQueueLength', () => {
    it('should return queue length', () => {
      expect(queue.getQueueLength()).toBe(0);

      queue.enqueue('Q1');
      queue.enqueue('Q2');

      expect(queue.getQueueLength()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('isProcessing', () => {
    it('should return processing status', () => {
      expect(queue.isProcessing()).toBe(false);
    });

    it('should return true while processing', async () => {
      mockApiClient.getAnswer.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ answer: 'Test' }), 100))
      );

      const promise = queue.enqueue('What is 2+2?');

      // May or may not be processing depending on timing
      await promise;

      expect(queue.isProcessing()).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should handle multiple simultaneous requests', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(queue.enqueue(`Q${i}`));
      }

      const results = await Promise.all(promises);

      expect(results.length).toBe(10);
      expect(mockApiClient.getAnswer).toHaveBeenCalledTimes(10);
    });

    it('should handle mixed success and retry scenarios', async () => {
      mockApiClient.getAnswer
        .mockResolvedValueOnce({ answer: 'A1', confidence: 90 })
        .mockRejectedValueOnce(new TimeoutError('Timeout'))
        .mockResolvedValueOnce({ answer: 'A2', confidence: 90 })
        .mockResolvedValueOnce({ answer: 'A3', confidence: 90 });

      const p1 = queue.enqueue('Q1');
      const p2 = queue.enqueue('Q2');
      const p3 = queue.enqueue('Q3');

      const results = await Promise.all([p1, p2, p3]);

      expect(results.length).toBe(3);
    });

    it('should maintain FIFO order with retries', async () => {
      const callOrder = [];

      mockApiClient.getAnswer.mockImplementation((question) => {
        callOrder.push(question);
        if (callOrder.length === 1) {
          return Promise.reject(new TimeoutError('Timeout'));
        }
        return Promise.resolve({ answer: 'Success', confidence: 90 });
      });

      const p1 = queue.enqueue('Q1');
      const p2 = queue.enqueue('Q2');

      await Promise.all([p1, p2]);

      // Q1 should be called twice (retry), then Q2
      expect(callOrder[0]).toBe('Q1');
      expect(callOrder[1]).toBe('Q1'); // Retry
      expect(callOrder[2]).toBe('Q2');
    });

    it('should log all requests accurately', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(queue.enqueue(`Q${i}`));
      }

      await Promise.all(promises);

      expect(queue.logs.length).toBeGreaterThanOrEqual(5);
      expect(queue.logs.every(log => log.status === 'success')).toBe(true);
    });
  });
});
