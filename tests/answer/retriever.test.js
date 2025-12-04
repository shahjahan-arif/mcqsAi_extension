/**
 * Answer Retriever Tests
 * Tests cache-first answer retrieval strategy
 */

import { AnswerRetriever } from '../../src/answer/retriever.js';

describe('AnswerRetriever', () => {
  let retriever;
  let mockCache;
  let mockApiClient;

  beforeEach(() => {
    // Mock cache
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn()
    };

    // Mock API client
    mockApiClient = {
      getAnswer: jest.fn()
    };

    retriever = new AnswerRetriever(mockCache, mockApiClient);
  });

  describe('constructor', () => {
    it('should throw error if cache is not provided', () => {
      expect(() => new AnswerRetriever(null, mockApiClient)).toThrow('Cache instance is required');
    });

    it('should throw error if API client is not provided', () => {
      expect(() => new AnswerRetriever(mockCache, null)).toThrow('API client instance is required');
    });

    it('should initialize with empty statistics', () => {
      expect(retriever.stats).toEqual({
        hits: 0,
        misses: 0,
        totalTime: 0
      });
    });
  });

  describe('getAnswer - cache hit', () => {
    it('should return cached answer instantly', async () => {
      const question = 'What is 2+2?';
      const cachedAnswer = {
        answer: '4',
        confidence: 95,
        questionHash: 'abc123'
      };

      mockCache.get.mockResolvedValue(cachedAnswer);

      const result = await retriever.getAnswer(question);

      expect(result).toEqual({
        answer: '4',
        confidence: 95,
        source: 'cache',
        elapsed: expect.any(Number)
      });
      expect(mockCache.get).toHaveBeenCalled();
      expect(mockApiClient.getAnswer).not.toHaveBeenCalled();
    });

    it('should increment hit counter on cache hit', async () => {
      const question = 'What is 2+2?';
      mockCache.get.mockResolvedValue({ answer: '4', confidence: 95 });

      await retriever.getAnswer(question);

      expect(retriever.stats.hits).toBe(1);
      expect(retriever.stats.misses).toBe(0);
    });

    it('should return cache hit in less than 5ms', async () => {
      const question = 'What is 2+2?';
      mockCache.get.mockResolvedValue({ answer: '4', confidence: 95 });

      const result = await retriever.getAnswer(question);

      expect(result.elapsed).toBeLessThan(5);
    });

    it('should handle multiple cache hits', async () => {
      const question = 'What is 2+2?';
      mockCache.get.mockResolvedValue({ answer: '4', confidence: 95 });

      await retriever.getAnswer(question);
      await retriever.getAnswer(question);
      await retriever.getAnswer(question);

      expect(retriever.stats.hits).toBe(3);
      expect(retriever.stats.misses).toBe(0);
    });
  });

  describe('getAnswer - cache miss', () => {
    it('should call API on cache miss', async () => {
      const question = 'What is 2+2?';
      const apiResponse = { answer: '4', confidence: 95, explanation: null, error: null };

      mockCache.get.mockResolvedValue(null);
      mockApiClient.getAnswer.mockResolvedValue(apiResponse);

      const result = await retriever.getAnswer(question);

      expect(mockApiClient.getAnswer).toHaveBeenCalledWith(question, null);
      expect(result.source).toBe('api');
    });

    it('should store API response in cache', async () => {
      const question = 'What is 2+2?';
      const apiResponse = { answer: '4', confidence: 95, explanation: null, error: null };

      mockCache.get.mockResolvedValue(null);
      mockApiClient.getAnswer.mockResolvedValue(apiResponse);

      await retriever.getAnswer(question);

      expect(mockCache.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          question,
          answer: '4',
          confidence: 95,
          hitCount: 0,
          lastAccessed: expect.any(Number)
        })
      );
    });

    it('should increment miss counter on cache miss', async () => {
      const question = 'What is 2+2?';
      mockCache.get.mockResolvedValue(null);
      mockApiClient.getAnswer.mockResolvedValue({ answer: '4', confidence: 95 });

      await retriever.getAnswer(question);

      expect(retriever.stats.misses).toBe(1);
      expect(retriever.stats.hits).toBe(0);
    });

    it('should return API response on cache miss', async () => {
      const question = 'What is 2+2?';
      const apiResponse = { answer: '4', confidence: 95, explanation: null, error: null };

      mockCache.get.mockResolvedValue(null);
      mockApiClient.getAnswer.mockResolvedValue(apiResponse);

      const result = await retriever.getAnswer(question);

      expect(result).toEqual({
        answer: '4',
        confidence: 95,
        source: 'api',
        elapsed: expect.any(Number)
      });
    });

    it('should pass context to API client', async () => {
      const question = 'What is 2+2?';
      const context = 'Math quiz';
      mockCache.get.mockResolvedValue(null);
      mockApiClient.getAnswer.mockResolvedValue({ answer: '4', confidence: 95 });

      await retriever.getAnswer(question, context);

      expect(mockApiClient.getAnswer).toHaveBeenCalledWith(question, context);
    });
  });

  describe('getAnswer - error handling', () => {
    it('should handle cache errors gracefully', async () => {
      const question = 'What is 2+2?';
      mockCache.get.mockRejectedValue(new Error('Cache error'));

      const result = await retriever.getAnswer(question);

      expect(result).toEqual({
        answer: null,
        confidence: 0,
        error: 'Cache error',
        source: 'error',
        elapsed: expect.any(Number)
      });
    });

    it('should handle API errors gracefully', async () => {
      const question = 'What is 2+2?';
      mockCache.get.mockResolvedValue(null);
      mockApiClient.getAnswer.mockRejectedValue(new Error('API error'));

      const result = await retriever.getAnswer(question);

      expect(result).toEqual({
        answer: null,
        confidence: 0,
        error: 'API error',
        source: 'error',
        elapsed: expect.any(Number)
      });
    });

    it('should handle cache set errors gracefully', async () => {
      const question = 'What is 2+2?';
      mockCache.get.mockResolvedValue(null);
      mockApiClient.getAnswer.mockResolvedValue({ answer: '4', confidence: 95 });
      mockCache.set.mockRejectedValue(new Error('Cache set error'));

      const result = await retriever.getAnswer(question);

      expect(result).toEqual({
        answer: null,
        confidence: 0,
        error: 'Cache set error',
        source: 'error',
        elapsed: expect.any(Number)
      });
    });

    it('should include error message in response', async () => {
      const question = 'What is 2+2?';
      const errorMessage = 'Network timeout';
      mockCache.get.mockRejectedValue(new Error(errorMessage));

      const result = await retriever.getAnswer(question);

      expect(result.error).toBe(errorMessage);
    });
  });

  describe('getStats', () => {
    it('should return initial stats as zeros', () => {
      const stats = retriever.getStats();

      expect(stats).toEqual({
        hits: 0,
        misses: 0,
        total: 0,
        hitRate: '0%',
        missRate: '0%',
        avgTime: '0ms'
      });
    });

    it('should calculate hit rate correctly', async () => {
      mockCache.get.mockResolvedValue({ answer: '4', confidence: 95 });
      mockApiClient.getAnswer.mockResolvedValue({ answer: '4', confidence: 95 });

      // 3 hits
      await retriever.getAnswer('Q1');
      await retriever.getAnswer('Q2');
      await retriever.getAnswer('Q3');

      // 1 miss
      mockCache.get.mockResolvedValueOnce(null);
      await retriever.getAnswer('Q4');

      const stats = retriever.getStats();

      expect(stats.hits).toBe(3);
      expect(stats.misses).toBe(1);
      expect(stats.total).toBe(4);
      expect(stats.hitRate).toBe('75.00%');
      expect(stats.missRate).toBe('25.00%');
    });

    it('should calculate average time correctly', async () => {
      mockCache.get.mockResolvedValue({ answer: '4', confidence: 95 });

      await retriever.getAnswer('Q1');
      await retriever.getAnswer('Q2');

      const stats = retriever.getStats();

      expect(stats.avgTime).toMatch(/^\d+\.\d+ms$/);
      expect(parseFloat(stats.avgTime)).toBeGreaterThan(0);
    });

    it('should handle 100% hit rate', async () => {
      mockCache.get.mockResolvedValue({ answer: '4', confidence: 95 });

      await retriever.getAnswer('Q1');
      await retriever.getAnswer('Q2');

      const stats = retriever.getStats();

      expect(stats.hitRate).toBe('100.00%');
      expect(stats.missRate).toBe('0.00%');
    });

    it('should handle 100% miss rate', async () => {
      mockCache.get.mockResolvedValue(null);
      mockApiClient.getAnswer.mockResolvedValue({ answer: '4', confidence: 95 });

      await retriever.getAnswer('Q1');
      await retriever.getAnswer('Q2');

      const stats = retriever.getStats();

      expect(stats.hitRate).toBe('0.00%');
      expect(stats.missRate).toBe('100.00%');
    });
  });

  describe('resetStats', () => {
    it('should reset all statistics to zero', async () => {
      mockCache.get.mockResolvedValue({ answer: '4', confidence: 95 });

      await retriever.getAnswer('Q1');
      expect(retriever.stats.hits).toBe(1);

      retriever.resetStats();

      expect(retriever.stats).toEqual({
        hits: 0,
        misses: 0,
        totalTime: 0
      });
    });

    it('should reset stats and allow fresh counting', async () => {
      mockCache.get.mockResolvedValue({ answer: '4', confidence: 95 });

      await retriever.getAnswer('Q1');
      retriever.resetStats();
      await retriever.getAnswer('Q2');

      expect(retriever.stats.hits).toBe(1);
      expect(retriever.stats.misses).toBe(0);
    });
  });

  describe('integration scenarios', () => {
    it('should handle mixed cache hits and misses', async () => {
      mockCache.get
        .mockResolvedValueOnce({ answer: 'A', confidence: 95 }) // hit
        .mockResolvedValueOnce(null) // miss
        .mockResolvedValueOnce({ answer: 'B', confidence: 90 }) // hit
        .mockResolvedValueOnce(null); // miss

      mockApiClient.getAnswer
        .mockResolvedValueOnce({ answer: 'C', confidence: 85 })
        .mockResolvedValueOnce({ answer: 'D', confidence: 80 });

      await retriever.getAnswer('Q1');
      await retriever.getAnswer('Q2');
      await retriever.getAnswer('Q3');
      await retriever.getAnswer('Q4');

      const stats = retriever.getStats();

      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.total).toBe(4);
      expect(stats.hitRate).toBe('50.00%');
    });

    it('should track timing across multiple requests', async () => {
      mockCache.get.mockResolvedValue({ answer: '4', confidence: 95 });

      const results = [];
      for (let i = 0; i < 5; i++) {
        const result = await retriever.getAnswer(`Q${i}`);
        results.push(result.elapsed);
      }

      const stats = retriever.getStats();

      expect(stats.total).toBe(5);
      expect(stats.hits).toBe(5);
      expect(results.every(t => t > 0)).toBe(true);
    });
  });
});
