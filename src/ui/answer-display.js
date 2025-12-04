/**
 * Answer Display UI Component
 * Displays quiz answers in an interactive, non-intrusive tooltip
 */

/**
 * AnswerDisplay renders and manages answer tooltips
 * Handles positioning, theming, and user interactions
 */
export class AnswerDisplay {
  constructor(options = {}) {
    this.position = options.position || 'near-heading';
    this.showConfidence = options.showConfidence !== false;
    this.theme = options.theme || 'auto';
    this.maxWidth = options.maxWidth || 300;
    this.tooltips = new Map(); // Track active tooltips
  }

  /**
   * Renders an answer tooltip
   * Creates and positions tooltip near question element
   *
   * @param {Object} question - Question object with element and text
   * @param {string} answer - The answer text
   * @param {number} confidence - Confidence level (0-100)
   * @returns {HTMLElement} The created tooltip element
   */
  render(question, answer, confidence) {
    if (!question || !question.element) {
      throw new Error('Question object with element is required');
    }

    if (!answer || typeof answer !== 'string') {
      throw new Error('Answer must be a non-empty string');
    }

    if (typeof confidence !== 'number' || confidence < 0 || confidence > 100) {
      throw new Error('Confidence must be a number between 0 and 100');
    }

    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'quiz-answer-tooltip';
    tooltip.setAttribute('data-confidence', confidence);
    tooltip.setAttribute('role', 'tooltip');
    tooltip.setAttribute('aria-label', `Answer: ${answer}`);

    // Build HTML with proper escaping
    tooltip.innerHTML = this.buildTooltipHTML(answer, confidence);

    // Apply theme
    this.applyTheme(tooltip);

    // Set max width
    tooltip.style.maxWidth = this.maxWidth + 'px';

    // Position near question
    this.positionNearHeading(tooltip, question.element);

    // Add event listeners
    this.attachEventListeners(tooltip, question, answer);

    // Insert into page
    question.element.parentElement.insertBefore(tooltip, question.element.nextSibling);

    // Track tooltip
    this.tooltips.set(tooltip, { question, answer, confidence });

    return tooltip;
  }

  /**
   * Builds the HTML content for the tooltip
   *
   * @param {string} answer - The answer text
   * @param {number} confidence - Confidence level
   * @returns {string} HTML string
   */
  buildTooltipHTML(answer, confidence) {
    const escapedAnswer = this.escapeHTML(answer);

    let html = `
      <div class="quiz-answer-content">
        <div class="quiz-answer-text">${escapedAnswer}</div>
    `;

    if (this.showConfidence) {
      html += `
        <div class="quiz-answer-confidence">
          Confidence: <span class="confidence-level">${confidence}%</span>
        </div>
      `;
    }

    html += `
        <div class="quiz-answer-actions">
          <button class="quiz-btn-explanation" aria-label="Show explanation">Show Explanation</button>
          <button class="quiz-btn-report" aria-label="Report wrong answer">Report Wrong</button>
          <button class="quiz-btn-close" aria-label="Close tooltip">×</button>
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Applies theme to tooltip
   * Detects system preference or uses specified theme
   *
   * @param {HTMLElement} tooltip - The tooltip element
   * @returns {void}
   */
  applyTheme(tooltip) {
    let theme = this.theme;

    if (theme === 'auto') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme = isDark ? 'dark' : 'light';
    }

    tooltip.classList.add(theme);
  }

  /**
   * Positions tooltip near the question heading
   * Adjusts if off-screen
   *
   * @param {HTMLElement} tooltip - The tooltip element
   * @param {HTMLElement} questionElement - The question element
   * @returns {void}
   */
  positionNearHeading(tooltip, questionElement) {
    const rect = questionElement.getBoundingClientRect();

    tooltip.style.position = 'fixed';
    tooltip.style.top = Math.max(10, rect.top) + 'px';
    tooltip.style.left = (rect.left + rect.width + 10) + 'px';
    tooltip.style.zIndex = '10000';

    // Adjust if off-screen (right edge)
    setTimeout(() => {
      const tooltipRect = tooltip.getBoundingClientRect();
      if (tooltipRect.right > window.innerWidth - 10) {
        tooltip.style.left = (rect.left - tooltipRect.width - 10) + 'px';
      }

      // Adjust if off-screen (bottom edge)
      if (tooltipRect.bottom > window.innerHeight - 10) {
        tooltip.style.top = (window.innerHeight - tooltipRect.height - 10) + 'px';
      }
    }, 0);
  }

  /**
   * Attaches event listeners to tooltip buttons
   *
   * @param {HTMLElement} tooltip - The tooltip element
   * @param {Object} question - Question object
   * @param {string} answer - The answer text
   * @returns {void}
   */
  attachEventListeners(tooltip, question, answer) {
    // Close button
    const closeBtn = tooltip.querySelector('.quiz-btn-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dismiss(tooltip);
      });
    }

    // Explanation button
    const explanationBtn = tooltip.querySelector('.quiz-btn-explanation');
    if (explanationBtn) {
      explanationBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showExplanation(tooltip);
      });
    }

    // Report button
    const reportBtn = tooltip.querySelector('.quiz-btn-report');
    if (reportBtn) {
      reportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.reportWrong(question, answer);
      });
    }

    // Dismiss on outside click
    const outsideClickHandler = (e) => {
      if (!tooltip.contains(e.target) && !question.element.contains(e.target)) {
        this.dismiss(tooltip);
        document.removeEventListener('click', outsideClickHandler);
      }
    };

    document.addEventListener('click', outsideClickHandler);
  }

  /**
   * Shows explanation (placeholder for future implementation)
   *
   * @param {HTMLElement} tooltip - The tooltip element
   * @returns {void}
   */
  showExplanation(tooltip) {
    const explanation = tooltip.querySelector('.quiz-answer-explanation');
    if (explanation) {
      const isHidden = explanation.style.display === 'none';
      explanation.style.display = isHidden ? 'block' : 'none';
    } else {
      // Placeholder: show alert
      alert('Explanation feature coming soon!');
    }
  }

  /**
   * Reports wrong answer
   * Sends feedback to background worker
   *
   * @param {Object} question - Question object
   * @param {string} answer - The answer text
   * @returns {void}
   */
  reportWrong(question, answer) {
    // Send message to background script if available
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        chrome.runtime.sendMessage({
          type: 'REPORT_WRONG_ANSWER',
          question: question.questionText || question.element.textContent,
          answer: answer,
          timestamp: Date.now()
        });
      } catch (error) {
        console.warn('Failed to send report:', error.message);
      }
    }

    // Show confirmation
    alert('Thank you for the feedback! We will improve our answers.');
  }

  /**
   * Dismisses a tooltip
   *
   * @param {HTMLElement} tooltip - The tooltip element
   * @returns {void}
   */
  dismiss(tooltip) {
    if (tooltip && tooltip.parentElement) {
      tooltip.remove();
      this.tooltips.delete(tooltip);
    }
  }

  /**
   * Dismisses all active tooltips
   *
   * @returns {void}
   */
  dismissAll() {
    this.tooltips.forEach((_, tooltip) => {
      this.dismiss(tooltip);
    });
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
   * Gets the number of active tooltips
   *
   * @returns {number} Number of active tooltips
   */
  getActiveTooltipCount() {
    return this.tooltips.size;
  }

  /**
   * Sets the theme
   *
   * @param {string} theme - Theme name ('light', 'dark', or 'auto')
   * @returns {void}
   */
  setTheme(theme) {
    if (!['light', 'dark', 'auto'].includes(theme)) {
      throw new Error('Theme must be "light", "dark", or "auto"');
    }
    this.theme = theme;
  }

  /**
   * Sets whether to show confidence level
   *
   * @param {boolean} show - Whether to show confidence
   * @returns {void}
   */
  setShowConfidence(show) {
    this.showConfidence = Boolean(show);
  }

  /**
   * Sets the maximum width of tooltips
   *
   * @param {number} width - Width in pixels
   * @returns {void}
   */
  setMaxWidth(width) {
    if (typeof width !== 'number' || width <= 0) {
      throw new Error('Width must be a positive number');
    }
    this.maxWidth = width;
  }
}
