/**
 * Pattern Priority Detector
 * Checks user-trained patterns first for highest accuracy
 */

/**
 * PatternPriorityDetector prioritizes user patterns in detection
 * Falls back to universal detection if no user pattern matches
 */
export class PatternPriorityDetector {
  constructor(cache, universalDetector = null) {
    if (!cache) {
      throw new Error('Cache instance is required');
    }

    this.cache = cache;
    this.universalDetector = universalDetector;
    this.patterns = [];
  }

  /**
   * Detects quiz using pattern priority
   * Checks user patterns first, falls back to universal detection
   *
   * @param {Document} dom - The DOM document
   * @param {Array<Object>} userPatterns - User-trained patterns
   * @returns {Promise<Object>} Detection result
   */
  async detectQuiz(dom, userPatterns = []) {
    if (!dom) {
      throw new Error('DOM document is required');
    }

    // Check user patterns first
    const userPattern = this.checkUserPatterns(dom, userPatterns);

    if (userPattern) {
      // User pattern matched
      this.recordPatternSuccess(userPattern.id, userPatterns);

      return {
        isQuiz: true,
        confidence: 100,
        source: 'user-pattern',
        patternId: userPattern.id,
        message: 'Using learned pattern'
      };
    }

    // Fall back to universal detection
    if (this.universalDetector) {
      const result = await this.universalDetector.detectQuiz(dom);
      result.source = 'universal';
      return result;
    }

    // No detection available
    return {
      isQuiz: false,
      confidence: 0,
      source: 'none',
      message: 'No detection available'
    };
  }

  /**
   * Checks if DOM matches any user pattern
   *
   * @param {Document} dom - The DOM document
   * @param {Array<Object>} userPatterns - User-trained patterns
   * @returns {Object|null} Matching pattern or null
   */
  checkUserPatterns(dom, userPatterns) {
    if (!Array.isArray(userPatterns)) {
      return null;
    }

    for (const pattern of userPatterns) {
      if (this.matchesPattern(dom, pattern)) {
        return pattern;
      }
    }

    return null;
  }

  /**
   * Checks if DOM matches a specific pattern
   *
   * @param {Document} dom - The DOM document
   * @param {Object} pattern - The pattern to match
   * @returns {boolean} True if pattern matches
   */
  matchesPattern(dom, pattern) {
    if (!pattern || !dom) {
      return false;
    }

    // Check CSS selectors
    if (pattern.cssSelectors && Array.isArray(pattern.cssSelectors)) {
      for (const selector of pattern.cssSelectors) {
        try {
          if (!dom.querySelector(selector)) {
            return false;
          }
        } catch (error) {
          // Invalid selector, skip
          continue;
        }
      }
    }

    // Check text patterns
    if (pattern.textPatterns && Array.isArray(pattern.textPatterns)) {
      const text = dom.body ? dom.body.innerText : '';

      for (const textPattern of pattern.textPatterns) {
        if (textPattern === 'contains_question_mark' && !text.includes('?')) {
          return false;
        }
        if (textPattern === 'has_option_prefixes' && !/^[A-D]\)|^\d\./m.test(text)) {
          return false;
        }
        if (textPattern === 'has_question_counter' && !/Question\s+\d+\s+of\s+\d+/i.test(text)) {
          return false;
        }
        if (textPattern === 'multiple_choice_format' && !/\?.*[A-D]\)/s.test(text)) {
          return false;
        }
        if (textPattern === 'true_false_format' && !/\b(true|false)\b/i.test(text)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Records pattern success
   * Updates successCount and lastUsed timestamp
   *
   * @param {string} patternId - The pattern ID
   * @param {Array<Object>} userPatterns - User patterns to update
   * @returns {void}
   */
  recordPatternSuccess(patternId, userPatterns) {
    if (!patternId || !Array.isArray(userPatterns)) {
      return;
    }

    const pattern = userPatterns.find(p => p.id === patternId);
    if (pattern) {
      pattern.successCount = (pattern.successCount || 0) + 1;
      pattern.lastUsed = Date.now();
    }
  }

  /**
   * Extracts questions from DOM using pattern
   *
   * @param {Document} dom - The DOM document
   * @param {Object} pattern - The pattern to use
   * @returns {Array<Object>} Array of question objects
   */
  extractQuestionsFromPattern(dom, pattern) {
    const questions = [];

    if (!pattern || !pattern.cssSelectors || !dom) {
      return questions;
    }

    for (const selector of pattern.cssSelectors) {
      try {
        const elements = dom.querySelectorAll(selector);
        elements.forEach((el, index) => {
          questions.push({
            element: el,
            questionText: el.innerText || el.textContent,
            questionNumber: index + 1
          });
        });
      } catch (error) {
        // Invalid selector, skip
        continue;
      }
    }

    return questions;
  }

  /**
   * Cleans up old patterns not used in 90 days
   *
   * @param {Array<Object>} userPatterns - User patterns to clean
   * @returns {Array<Object>} Cleaned patterns
   */
  cleanupOldPatterns(userPatterns) {
    if (!Array.isArray(userPatterns)) {
      return [];
    }

    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);

    return userPatterns.filter(pattern => {
      const lastUsed = pattern.lastUsed || pattern.createdAt || 0;
      return lastUsed > ninetyDaysAgo;
    });
  }

  /**
   * Gets pattern statistics
   *
   * @param {Array<Object>} userPatterns - User patterns
   * @returns {Object} Statistics object
   */
  getPatternStats(userPatterns) {
    if (!Array.isArray(userPatterns)) {
      return {
        totalPatterns: 0,
        totalSuccesses: 0,
        patterns: []
      };
    }

    const totalSuccesses = userPatterns.reduce((sum, p) => sum + (p.successCount || 0), 0);

    return {
      totalPatterns: userPatterns.length,
      totalSuccesses,
      averageSuccessPerPattern: userPatterns.length > 0 ? (totalSuccesses / userPatterns.length).toFixed(2) : 0,
      patterns: userPatterns.map(p => ({
        id: p.id,
        url: p.url,
        successCount: p.successCount || 0,
        lastUsed: p.lastUsed ? new Date(p.lastUsed).toLocaleString() : 'Never',
        confidence: p.confidence || 100
      }))
    };
  }

  /**
   * Sets the universal detector
   *
   * @param {Object} detector - Universal detector instance
   * @returns {void}
   */
  setUniversalDetector(detector) {
    if (!detector || typeof detector.detectQuiz !== 'function') {
      throw new Error('Detector must have detectQuiz method');
    }
    this.universalDetector = detector;
  }

  /**
   * Gets the current universal detector
   *
   * @returns {Object|null} Universal detector or null
   */
  getUniversalDetector() {
    return this.universalDetector;
  }
}
