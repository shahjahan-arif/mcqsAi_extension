/**
 * Explanation Manager
 * Handles explanation display and wrong answer feedback
 */

import { generateHash } from '../caching/hash-utils.js';

/**
 * ExplanationManager handles explanations and feedback
 * Retrieves explanations from cache or API, stores user feedback
 */
export class ExplanationManager {
  constructor(cache, apiClient = null) {
    if (!cache) {
      throw new Error('Cache instance is required');
    }

    this.cache = cache;
    this.apiClient = apiClient;
    this.feedbackLog = [];
    this.maxFeedbackLogs = 100;
  }

  /**
   * Gets explanation for a question-answer pair
   * Checks cache first, generates via API on miss
   *
   * @param {string} question - The quiz question
   * @param {string} answer - The provided answer
   * @returns {Promise<string>} Explanation text
   */
  async getExplanation(question, answer) {
    if (!question || typeof question !== 'string') {
      throw new Error('Question must be a non-empty string');
    }

    if (!answer || typeof answer !== 'string') {
      throw new Error('Answer must be a non-empty string');
    }

    try {
      // Generate hash for explanation cache
      const hash = await generateHash(question + '_explanation_' + answer);

      // Check cache first
      const cached = await this.cache.get(hash);
      if (cached) {
        return cached.answer;
      }

      // Generate explanation via API if available
      if (this.apiClient) {
        const prompt = `Provide a brief explanation for this quiz answer:\n\nQuestion: ${question}\nAnswer: ${answer}`;
        const result = await this.apiClient.getAnswer(prompt);

        // Cache explanation
        await this.cache.set(hash, {
          questionHash: hash,
          question: question + '_explanation',
          answer: result.answer,
          confidence: result.confidence,
          timestamp: Date.now(),
          platform: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
          quizType: 'explanation',
          hitCount: 0,
          lastAccessed: Date.now()
        });

        return result.answer;
      }

      // Fallback: return generic explanation
      return 'Explanation not available. Please verify the answer independently.';
    } catch (error) {
      console.warn('Error getting explanation:', error.message);
      return 'Unable to generate explanation at this time.';
    }
  }

  /**
   * Displays explanation in tooltip
   * Inserts explanation element after answer text
   *
   * @param {HTMLElement} tooltip - The tooltip element
   * @param {string} explanation - The explanation text
   * @returns {HTMLElement} The explanation element
   */
  displayExplanation(tooltip, explanation) {
    if (!tooltip) {
      throw new Error('Tooltip element is required');
    }

    if (!explanation || typeof explanation !== 'string') {
      throw new Error('Explanation must be a non-empty string');
    }

    // Check if explanation already displayed
    let explanationDiv = tooltip.querySelector('.quiz-answer-explanation');
    if (explanationDiv) {
      // Toggle visibility
      const isHidden = explanationDiv.style.display === 'none';
      explanationDiv.style.display = isHidden ? 'block' : 'none';
      return explanationDiv;
    }

    // Create explanation container
    explanationDiv = document.createElement('div');
    explanationDiv.className = 'quiz-answer-explanation';
    explanationDiv.innerHTML = `
      <div class="explanation-header">Explanation:</div>
      <div class="explanation-text">${this.escapeHTML(explanation)}</div>
    `;

    // Insert after answer text
    const answerText = tooltip.querySelector('.quiz-answer-text');
    if (answerText && answerText.parentElement) {
      answerText.parentElement.insertBefore(explanationDiv, answerText.nextSibling);
    } else {
      tooltip.appendChild(explanationDiv);
    }

    return explanationDiv;
  }

  /**
   * Reports a wrong answer
   * Stores feedback and sends to background worker
   *
   * @param {string} question - The quiz question
   * @param {string} answer - The provided answer
   * @param {string} userFeedback - Optional user feedback
   * @returns {Promise<Object>} Feedback object
   */
  async reportWrongAnswer(question, answer, userFeedback = null) {
    if (!question || typeof question !== 'string') {
      throw new Error('Question must be a non-empty string');
    }

    if (!answer || typeof answer !== 'string') {
      throw new Error('Answer must be a non-empty string');
    }

    const feedback = {
      question,
      answer,
      userFeedback,
      timestamp: Date.now(),
      platform: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };

    try {
      // Store feedback locally
      await this.storeFeedback(feedback);

      // Send to background worker if available
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        try {
          chrome.runtime.sendMessage({
            type: 'FEEDBACK_WRONG_ANSWER',
            feedback
          });
        } catch (error) {
          console.warn('Failed to send feedback to background:', error.message);
        }
      }

      return feedback;
    } catch (error) {
      console.warn('Error reporting wrong answer:', error.message);
      throw error;
    }
  }

  /**
   * Stores feedback in local log
   * Maintains in-memory log for session
   *
   * @param {Object} feedback - Feedback object
   * @returns {Promise<void>}
   */
  async storeFeedback(feedback) {
    if (!feedback || typeof feedback !== 'object') {
      throw new Error('Feedback must be an object');
    }

    // Add to in-memory log
    this.feedbackLog.push(feedback);

    // Keep only recent logs
    if (this.feedbackLog.length > this.maxFeedbackLogs) {
      this.feedbackLog.shift();
    }
  }

  /**
   * Gets feedback statistics
   *
   * @returns {Object} Statistics object
   */
  getFeedbackStats() {
    return {
      totalFeedback: this.feedbackLog.length,
      maxLogs: this.maxFeedbackLogs,
      lastUpdated: this.feedbackLog.length > 0 ? this.feedbackLog[this.feedbackLog.length - 1].timestamp : null
    };
  }

  /**
   * Gets all feedback logs
   *
   * @returns {Array<Object>} Array of feedback objects
   */
  getFeedbackLogs() {
    return [...this.feedbackLog];
  }

  /**
   * Clears all feedback logs
   *
   * @returns {void}
   */
  clearFeedbackLogs() {
    this.feedbackLog = [];
  }

  /**
   * Escapes HTML special characters
   * Prevents XSS attacks
   *
   * @param {string} text - Text to escape
   * @returns {string} Escaped HTML
   */
  escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Sets the API client
   *
   * @param {Object} apiClient - API client instance
   * @returns {void}
   */
  setApiClient(apiClient) {
    if (!apiClient || typeof apiClient.getAnswer !== 'function') {
      throw new Error('API client must have getAnswer method');
    }
    this.apiClient = apiClient;
  }

  /**
   * Gets the current API client
   *
   * @returns {Object|null} API client or null
   */
  getApiClient() {
    return this.apiClient;
  }
}
