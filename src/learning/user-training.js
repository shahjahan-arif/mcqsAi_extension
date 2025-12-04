/**
 * User Training Manager
 * Handles user quiz marking and pattern extraction for learning
 */

/**
 * UserTrainingManager manages user-trained quiz patterns
 * Extracts patterns from user-marked quiz areas
 */
export class UserTrainingManager {
  constructor(cache) {
    if (!cache) {
      throw new Error('Cache instance is required');
    }

    this.cache = cache;
    this.patterns = [];
    this.maxPatterns = 1000;
  }

  /**
   * Extracts pattern from a DOM element
   * Captures structure, selectors, and text patterns
   *
   * @param {HTMLElement} element - The element to extract pattern from
   * @returns {Object} Extracted pattern object
   */
  extractPattern(element) {
    if (!element) {
      throw new Error('Element is required');
    }

    const pattern = {
      id: this.generatePatternId(),
      url: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
      domStructure: this.serializeDOM(element),
      cssSelectors: this.extractSelectors(element),
      textPatterns: this.extractTextPatterns(element),
      confidence: 100,
      successCount: 0,
      lastUsed: Date.now(),
      createdAt: Date.now()
    };

    return pattern;
  }

  /**
   * Serializes DOM structure to a simplified format
   *
   * @param {HTMLElement} element - The element to serialize
   * @returns {Object} Serialized DOM structure
   */
  serializeDOM(element) {
    if (!element) {
      return null;
    }

    return {
      tagName: element.tagName,
      classes: Array.from(element.classList || []),
      id: element.id || null,
      children: Array.from(element.children || []).slice(0, 5).map(child => ({
        tagName: child.tagName,
        classes: Array.from(child.classList || []),
        id: child.id || null
      }))
    };
  }

  /**
   * Extracts CSS selectors from element
   *
   * @param {HTMLElement} element - The element to extract selectors from
   * @returns {Array<string>} Array of CSS selectors
   */
  extractSelectors(element) {
    const selectors = [];

    // ID selector
    if (element.id) {
      selectors.push(`#${element.id}`);
    }

    // Class selectors
    if (element.classList && element.classList.length > 0) {
      const classes = Array.from(element.classList).join('.');
      selectors.push(`.${classes}`);
    }

    // Tag selector
    selectors.push(element.tagName.toLowerCase());

    // Data attribute selectors
    if (element.getAttribute && element.getAttribute('data-quiz')) {
      selectors.push('[data-quiz]');
    }

    return selectors;
  }

  /**
   * Extracts text patterns from element
   *
   * @param {HTMLElement} element - The element to extract patterns from
   * @returns {Array<string>} Array of text pattern names
   */
  extractTextPatterns(element) {
    const patterns = [];
    const text = element.innerText || element.textContent || '';

    // Question mark pattern
    if (text.includes('?')) {
      patterns.push('contains_question_mark');
    }

    // Option prefix pattern (A), B), C), D) or 1., 2., 3., 4.
    if (/^[A-D]\)|^\d\./m.test(text)) {
      patterns.push('has_option_prefixes');
    }

    // Question counter pattern
    if (/Question\s+\d+\s+of\s+\d+/i.test(text)) {
      patterns.push('has_question_counter');
    }

    // Multiple choice pattern
    if ((text.match(/\?/g) || []).length > 0 && (text.match(/[A-D]\)/g) || []).length >= 2) {
      patterns.push('multiple_choice_format');
    }

    // True/False pattern
    if (/\b(true|false)\b/i.test(text)) {
      patterns.push('true_false_format');
    }

    return patterns;
  }

  /**
   * Stores pattern in local collection
   *
   * @param {Object} pattern - Pattern object to store
   * @returns {Promise<void>}
   */
  async storePattern(pattern) {
    if (!pattern || typeof pattern !== 'object') {
      throw new Error('Pattern must be an object');
    }

    // Add to in-memory collection
    this.patterns.push(pattern);

    // Keep only recent patterns
    if (this.patterns.length > this.maxPatterns) {
      this.patterns.shift();
    }
  }

  /**
   * Generates unique pattern ID
   *
   * @returns {string} Unique pattern ID
   */
  generatePatternId() {
    return 'pattern_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Gets all stored patterns
   *
   * @returns {Array<Object>} Array of pattern objects
   */
  getPatterns() {
    return [...this.patterns];
  }

  /**
   * Gets patterns for a specific URL
   *
   * @param {string} url - The URL to filter by
   * @returns {Array<Object>} Array of matching patterns
   */
  getPatternsForUrl(url) {
    if (!url || typeof url !== 'string') {
      throw new Error('URL must be a non-empty string');
    }

    return this.patterns.filter(p => p.url === url);
  }

  /**
   * Gets pattern statistics
   *
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      totalPatterns: this.patterns.length,
      maxPatterns: this.maxPatterns,
      averageConfidence: this.patterns.length > 0
        ? (this.patterns.reduce((sum, p) => sum + p.confidence, 0) / this.patterns.length).toFixed(2)
        : 0,
      lastUpdated: this.patterns.length > 0 ? this.patterns[this.patterns.length - 1].createdAt : null
    };
  }

  /**
   * Clears all patterns
   *
   * @returns {void}
   */
  clearPatterns() {
    this.patterns = [];
  }

  /**
   * Deletes a specific pattern
   *
   * @param {string} patternId - The pattern ID to delete
   * @returns {boolean} True if deleted, false if not found
   */
  deletePattern(patternId) {
    if (!patternId || typeof patternId !== 'string') {
      throw new Error('Pattern ID must be a non-empty string');
    }

    const index = this.patterns.findIndex(p => p.id === patternId);
    if (index !== -1) {
      this.patterns.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Updates pattern success count
   *
   * @param {string} patternId - The pattern ID to update
   * @returns {void}
   */
  updatePatternSuccess(patternId) {
    if (!patternId || typeof patternId !== 'string') {
      throw new Error('Pattern ID must be a non-empty string');
    }

    const pattern = this.patterns.find(p => p.id === patternId);
    if (pattern) {
      pattern.successCount++;
      pattern.lastUsed = Date.now();
    }
  }

  /**
   * Finds best matching pattern for element
   *
   * @param {HTMLElement} element - The element to match
   * @returns {Object|null} Best matching pattern or null
   */
  findMatchingPattern(element) {
    if (!element) {
      return null;
    }

    const elementSelectors = this.extractSelectors(element);
    const elementPatterns = this.extractTextPatterns(element);

    let bestMatch = null;
    let bestScore = 0;

    for (const pattern of this.patterns) {
      let score = 0;

      // Score based on selector matches
      for (const selector of pattern.cssSelectors) {
        if (elementSelectors.includes(selector)) {
          score += 2;
        }
      }

      // Score based on text pattern matches
      for (const textPattern of pattern.textPatterns) {
        if (elementPatterns.includes(textPattern)) {
          score += 1;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = pattern;
      }
    }

    return bestMatch;
  }

  /**
   * Shows confirmation notification
   *
   * @param {string} message - Message to display
   * @returns {void}
   */
  showConfirmation(message = '✓ Quiz pattern learned!') {
    if (typeof document === 'undefined') {
      return;
    }

    const toast = document.createElement('div');
    toast.className = 'quiz-toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 10001;
      animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}
