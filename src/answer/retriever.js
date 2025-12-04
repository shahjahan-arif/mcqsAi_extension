/**
 * Answer Retriever
 * Implements cache-first answer retrieval strategy
 * Returns cached answers instantly, calls API on cache miss
 */

import { generateHash } from '../caching/hash-utils.js';

/**
 * AnswerRetriever manages cache-first answer retrieval
 * Tracks statistics: hit rate, miss rate, response times
 */
export class AnswerRetriever {
  constructor(cache, apiClient) {
    if (!cache) {
      throw new Error('Cache instance is required');
    }
    if (!apiClient) {
      throw new Error('API client instance is required');
    }

    this.cache = cache;
    this.apiClient = apiClient;
    this.stats = {
      hits: 0,
      misses: 0,
      totalTime: 0
    };
  }

  /**
   * Retrieves an answer using cache-first strategy
   * 1. Generates question hash
   * 2. Checks cache first
   * 3. Returns cached answer on hit (<5ms)
   * 4. Calls API on cache miss
   * 5. Stores API response in cache
   * 6. Updates statistics
   * 
   * @param {string} question - The quiz question
   * @param {string} context - Optional context for the question
   * @returns {Promise<Object>} Result with answer, confidence, source, elapsed time
   */
  async getAnswer(question, context = null) {
    const startTime = performance.now();

    try {
      // Generate hash for question
      const hash = await generateHash(question);

      // Check cache first
      const cached = await this.cache.get(hash);
      if (cached) {
        this.stats.hits++;
        const elapsed = performance.now() - startTime;
        this.stats.totalTime += elapsed;

        return {
          answer: cached.answer,
          confidence: cached.confidence,
          source: 'cache',
          elapsed: Math.round(elapsed * 100) / 100
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
        platform: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
        quizType: 'unknown',
        hitCount: 0,
        lastAccessed: Date.now()
      });

      const elapsed = performance.now() - startTime;
      this.stats.totalTime += elapsed;

      return {
        answer: apiResult.answer,
        confidence: apiResult.confidence,
        source: 'api',
        elapsed: Math.round(elapsed * 100) / 100
      };
    } catch (error) {
      return {
        answer: null,
        confidence: 0,
        error: error.message,
        source: 'error',
        elapsed: Math.round((performance.now() - startTime) * 100) / 100
      };
    }
  }

  /**
   * Gets cache statistics
   * Calculates hit rate, miss rate, and average response time
   * 
   * @returns {Object} Statistics object
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      total,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(2) + '%' : '0%',
      missRate: total > 0 ? (this.stats.misses / total * 100).toFixed(2) + '%' : '0%',
      avgTime: total > 0 ? (this.stats.totalTime / total).toFixed(2) + 'ms' : '0ms'
    };
  }

  /**
   * Resets statistics counters
   * 
   * @returns {void}
   */
  resetStats() {
    this.stats = { hits: 0, misses: 0, totalTime: 0 };
  }
}
