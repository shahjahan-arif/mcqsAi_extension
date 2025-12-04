/**
 * Mobile Optimizer
 * Implements speed mode optimizations for mobile devices
 * Uses cache-first strategy and reduced detection
 */

import { generateHash } from '../caching/hash-utils.js';

/**
 * MobileOptimizer handles speed mode optimizations
 * Reduces detection complexity and uses cache-first strategy
 */
export class MobileOptimizer {
  constructor(cache, retriever, adaptive) {
    if (!cache) {
      throw new Error('Cache instance is required');
    }
    if (!retriever) {
      throw new Error('Retriever instance is required');
    }
    if (!adaptive) {
      throw new Error('Adaptive performance instance is required');
    }

    this.cache = cache;
    this.retriever = retriever;
    this.adaptive = adaptive;
    this.batteryMonitor = null;
    this.isContinuousMonitoringEnabled = true;
  }

  /**
   * Optimizes detection for speed mode
   * Uses CSS + XPath only, skips DOM analysis and AI verification
   *
   * @param {Document} dom - The DOM document to analyze
   * @returns {Object|null} Detection result or null if not in speed mode
   */
  optimizeDetection(dom) {
    if (this.adaptive.mode !== 'SPEED_MODE') {
      return null; // Not in speed mode
    }

    if (!dom || !dom.body) {
      return {
        isQuiz: false,
        confidence: 0,
        requiresAIVerification: false
      };
    }

    // Use CSS + XPath only (no DOM analysis)
    const structuralScore = this.structuralScanFast(dom);
    const patternScore = this.patternMatchingFast(dom);

    const totalScore = structuralScore + patternScore;
    const confidence = Math.round((totalScore / 80) * 100); // Normalize to 0-100

    return {
      isQuiz: confidence > 50,
      confidence: Math.min(confidence, 100),
      requiresAIVerification: false, // Skip AI verification
      scores: {
        structural: structuralScore,
        pattern: patternScore
      }
    };
  }

  /**
   * Fast structural scan using CSS selectors only
   * No DOM traversal or analysis
   *
   * @param {Document} dom - The DOM document
   * @returns {number} Structural score (0-40)
   */
  structuralScanFast(dom) {
    try {
      const forms = dom.querySelectorAll('form').length;
      const inputs = dom.querySelectorAll('input[type="radio"], input[type="checkbox"]').length;
      const buttons = dom.querySelectorAll('button[type="submit"]').length;

      const score = forms * 5 + inputs * 2 + buttons * 5;
      return Math.min(score, 40);
    } catch (error) {
      console.warn('Error in structural scan:', error.message);
      return 0;
    }
  }

  /**
   * Fast pattern matching using text analysis only
   * No complex DOM analysis
   *
   * @param {Document} dom - The DOM document
   * @returns {number} Pattern score (0-40)
   */
  patternMatchingFast(dom) {
    try {
      const text = dom.body ? dom.body.innerText : '';

      // Count question marks
      const questionMarks = (text.match(/\?/g) || []).length;

      // Count option prefixes (A), B), C), D) or 1., 2., 3., 4.
      const optionPrefixes = (text.match(/^[A-D]\)|^\d\./gm) || []).length;

      const score = questionMarks * 2 + optionPrefixes * 1.5;
      return Math.min(score, 40);
    } catch (error) {
      console.warn('Error in pattern matching:', error.message);
      return 0;
    }
  }

  /**
   * Gets answer using cache-first strategy
   * Returns cached answer if available, calls API only on cache miss
   *
   * @param {string} question - The quiz question
   * @returns {Promise<Object>} Answer object with source and confidence
   */
  async getAnswerOptimized(question) {
    try {
      // Generate hash for cache lookup
      const hash = await generateHash(question);

      // Check cache first
      const cached = await this.cache.get(hash);

      if (cached) {
        return {
          answer: cached.answer,
          source: 'cache',
          confidence: cached.confidence,
          elapsed: 0
        };
      }

      // Cache miss - call API through retriever
      const result = await this.retriever.getAnswer(question);

      return {
        answer: result.answer,
        source: result.source,
        confidence: result.confidence,
        elapsed: result.elapsed
      };
    } catch (error) {
      return {
        answer: null,
        source: 'error',
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Monitors battery level and disables features if needed
   * Disables continuous monitoring at <10% battery
   *
   * @returns {Promise<void>}
   */
  async monitorBattery() {
    if (typeof navigator === 'undefined' || !navigator.getBattery) {
      return; // Battery API not available
    }

    try {
      const battery = await navigator.getBattery();
      this.batteryMonitor = battery;

      const handleLevelChange = () => {
        const level = battery.level;

        // Disable continuous monitoring at <10% battery
        if (level < 0.1 && this.isContinuousMonitoringEnabled) {
          this.disableContinuousMonitoring();
        }
        // Re-enable at >20% battery
        else if (level > 0.2 && !this.isContinuousMonitoringEnabled) {
          this.enableContinuousMonitoring();
        }
      };

      battery.addEventListener('levelchange', handleLevelChange);
    } catch (error) {
      console.warn('Battery monitoring unavailable:', error.message);
    }
  }

  /**
   * Disables continuous monitoring features
   * Only detect on page load, not on DOM changes
   *
   * @returns {void}
   */
  disableContinuousMonitoring() {
    this.isContinuousMonitoringEnabled = false;
  }

  /**
   * Re-enables continuous monitoring features
   *
   * @returns {void}
   */
  enableContinuousMonitoring() {
    this.isContinuousMonitoringEnabled = true;
  }

  /**
   * Checks if continuous monitoring is enabled
   *
   * @returns {boolean} True if continuous monitoring is enabled
   */
  isContinuousMonitoringActive() {
    return this.isContinuousMonitoringEnabled;
  }

  /**
   * Gets optimization statistics
   *
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      mode: this.adaptive.mode,
      continuousMonitoringEnabled: this.isContinuousMonitoringEnabled,
      batteryMonitorActive: this.batteryMonitor !== null
    };
  }

  /**
   * Stops battery monitoring
   *
   * @returns {void}
   */
  stopMonitoring() {
    if (this.batteryMonitor) {
      try {
        this.batteryMonitor.removeEventListener('levelchange', () => {});
      } catch (error) {
        console.warn('Error stopping battery monitor:', error.message);
      }
      this.batteryMonitor = null;
    }
  }
}
