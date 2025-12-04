/**
 * Answer Display UI Component Tests
 * Tests rendering, positioning, and event handling
 */

import { AnswerDisplay } from '../../src/ui/answer-display.js';

describe('AnswerDisplay', () => {
  let display;
  let mockQuestion;

  beforeEach(() => {
    display = new AnswerDisplay();

    // Create mock question element
    const mockElement = document.createElement('div');
    mockElement.textContent = 'What is 2+2?';
    document.body.appendChild(mockElement);

    mockQuestion = {
      element: mockElement,
      questionText: 'What is 2+2?'
    };
  });

  afterEach(() => {
    // Clean up
    display.dismissAll();
    document.body.innerHTML = '';
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      expect(display.position).toBe('near-heading');
      expect(display.showConfidence).toBe(true);
      expect(display.theme).toBe('auto');
      expect(display.maxWidth).toBe(300);
    });

    it('should accept custom options', () => {
      const customDisplay = new AnswerDisplay({
        position: 'top',
        showConfidence: false,
        theme: 'dark',
        maxWidth: 400
      });

      expect(customDisplay.position).toBe('top');
      expect(customDisplay.showConfidence).toBe(false);
      expect(customDisplay.theme).toBe('dark');
      expect(customDisplay.maxWidth).toBe(400);
    });
  });

  describe('render', () => {
    it('should render tooltip with answer and confidence', () => {
      const tooltip = display.render(mockQuestion, 'The answer is 4', 95);

      expect(tooltip).toBeDefined();
      expect(tooltip.classList.contains('quiz-answer-tooltip')).toBe(true);
      expect(tooltip.textContent).toContain('The answer is 4');
      expect(tooltip.textContent).toContain('95%');
    });

    it('should render without confidence if disabled', () => {
      display.showConfidence = false;
      const tooltip = display.render(mockQuestion, 'The answer is 4', 95);

      expect(tooltip.textContent).toContain('The answer is 4');
      expect(tooltip.textContent).not.toContain('95%');
    });

    it('should throw error if question is invalid', () => {
      expect(() => display.render(null, 'Answer', 90)).toThrow('Question object with element is required');
      expect(() => display.render({}, 'Answer', 90)).toThrow('Question object with element is required');
    });

    it('should throw error if answer is invalid', () => {
      expect(() => display.render(mockQuestion, '', 90)).toThrow('Answer must be a non-empty string');
      expect(() => display.render(mockQuestion, null, 90)).toThrow('Answer must be a non-empty string');
    });

    it('should throw error if confidence is invalid', () => {
      expect(() => display.render(mockQuestion, 'Answer', -1)).toThrow('Confidence must be a number between 0 and 100');
      expect(() => display.render(mockQuestion, 'Answer', 101)).toThrow('Confidence must be a number between 0 and 100');
      expect(() => display.render(mockQuestion, 'Answer', 'high')).toThrow('Confidence must be a number between 0 and 100');
    });

    it('should include action buttons', () => {
      const tooltip = display.render(mockQuestion, 'Answer', 90);

      expect(tooltip.querySelector('.quiz-btn-explanation')).toBeDefined();
      expect(tooltip.querySelector('.quiz-btn-report')).toBeDefined();
      expect(tooltip.querySelector('.quiz-btn-close')).toBeDefined();
    });

    it('should set data-confidence attribute', () => {
      const tooltip = display.render(mockQuestion, 'Answer', 85);

      expect(tooltip.getAttribute('data-confidence')).toBe('85');
    });

    it('should set accessibility attributes', () => {
      const tooltip = display.render(mockQuestion, 'Test Answer', 90);

      expect(tooltip.getAttribute('role')).toBe('tooltip');
      expect(tooltip.getAttribute('aria-label')).toContain('Test Answer');
    });

    it('should insert tooltip into DOM', () => {
      const tooltip = display.render(mockQuestion, 'Answer', 90);

      expect(document.body.contains(tooltip)).toBe(true);
    });

    it('should track active tooltips', () => {
      expect(display.getActiveTooltipCount()).toBe(0);

      display.render(mockQuestion, 'Answer 1', 90);
      expect(display.getActiveTooltipCount()).toBe(1);

      display.render(mockQuestion, 'Answer 2', 85);
      expect(display.getActiveTooltipCount()).toBe(2);
    });
  });

  describe('buildTooltipHTML', () => {
    it('should build HTML with answer and confidence', () => {
      const html = display.buildTooltipHTML('Test Answer', 90);

      expect(html).toContain('Test Answer');
      expect(html).toContain('90%');
      expect(html).toContain('quiz-answer-text');
      expect(html).toContain('quiz-answer-confidence');
    });

    it('should build HTML without confidence if disabled', () => {
      display.showConfidence = false;
      const html = display.buildTooltipHTML('Test Answer', 90);

      expect(html).toContain('Test Answer');
      expect(html).not.toContain('90%');
    });

    it('should escape HTML in answer', () => {
      const html = display.buildTooltipHTML('<script>alert("xss")</script>', 90);

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should include action buttons', () => {
      const html = display.buildTooltipHTML('Answer', 90);

      expect(html).toContain('quiz-btn-explanation');
      expect(html).toContain('quiz-btn-report');
      expect(html).toContain('quiz-btn-close');
    });
  });

  describe('applyTheme', () => {
    it('should apply light theme', () => {
      display.theme = 'light';
      const tooltip = document.createElement('div');

      display.applyTheme(tooltip);

      expect(tooltip.classList.contains('light')).toBe(true);
    });

    it('should apply dark theme', () => {
      display.theme = 'dark';
      const tooltip = document.createElement('div');

      display.applyTheme(tooltip);

      expect(tooltip.classList.contains('dark')).toBe(true);
    });

    it('should detect system preference for auto theme', () => {
      display.theme = 'auto';
      const tooltip = document.createElement('div');

      display.applyTheme(tooltip);

      // Should have either light or dark class
      expect(
        tooltip.classList.contains('light') || tooltip.classList.contains('dark')
      ).toBe(true);
    });
  });

  describe('positionNearHeading', () => {
    it('should position tooltip near question element', () => {
      const tooltip = document.createElement('div');
      tooltip.style.width = '300px';
      tooltip.style.height = '100px';
      document.body.appendChild(tooltip);

      display.positionNearHeading(tooltip, mockQuestion.element);

      expect(tooltip.style.position).toBe('fixed');
      expect(tooltip.style.zIndex).toBe('10000');
      expect(tooltip.style.top).toBeDefined();
      expect(tooltip.style.left).toBeDefined();
    });

    it('should adjust position if off-screen', (done) => {
      const tooltip = document.createElement('div');
      tooltip.style.width = '300px';
      tooltip.style.height = '100px';
      document.body.appendChild(tooltip);

      display.positionNearHeading(tooltip, mockQuestion.element);

      // Wait for setTimeout adjustment
      setTimeout(() => {
        expect(tooltip.style.left).toBeDefined();
        done();
      }, 10);
    });
  });

  describe('escapeHTML', () => {
    it('should escape HTML special characters', () => {
      const escaped = display.escapeHTML('<script>alert("xss")</script>');

      expect(escaped).toContain('&lt;');
      expect(escaped).toContain('&gt;');
      expect(escaped).not.toContain('<script>');
    });

    it('should escape quotes', () => {
      const escaped = display.escapeHTML('He said "Hello"');

      expect(escaped).toContain('&quot;');
    });

    it('should escape ampersands', () => {
      const escaped = display.escapeHTML('A & B');

      expect(escaped).toContain('&amp;');
    });
  });

  describe('dismiss', () => {
    it('should remove tooltip from DOM', () => {
      const tooltip = display.render(mockQuestion, 'Answer', 90);

      expect(document.body.contains(tooltip)).toBe(true);

      display.dismiss(tooltip);

      expect(document.body.contains(tooltip)).toBe(false);
    });

    it('should remove tooltip from tracking', () => {
      const tooltip = display.render(mockQuestion, 'Answer', 90);

      expect(display.getActiveTooltipCount()).toBe(1);

      display.dismiss(tooltip);

      expect(display.getActiveTooltipCount()).toBe(0);
    });

    it('should handle null tooltip', () => {
      expect(() => display.dismiss(null)).not.toThrow();
    });
  });

  describe('dismissAll', () => {
    it('should remove all tooltips', () => {
      display.render(mockQuestion, 'Answer 1', 90);
      display.render(mockQuestion, 'Answer 2', 85);

      expect(display.getActiveTooltipCount()).toBe(2);

      display.dismissAll();

      expect(display.getActiveTooltipCount()).toBe(0);
    });
  });

  describe('getActiveTooltipCount', () => {
    it('should return count of active tooltips', () => {
      expect(display.getActiveTooltipCount()).toBe(0);

      display.render(mockQuestion, 'Answer 1', 90);
      expect(display.getActiveTooltipCount()).toBe(1);

      display.render(mockQuestion, 'Answer 2', 85);
      expect(display.getActiveTooltipCount()).toBe(2);
    });
  });

  describe('setTheme', () => {
    it('should set theme to light', () => {
      display.setTheme('light');
      expect(display.theme).toBe('light');
    });

    it('should set theme to dark', () => {
      display.setTheme('dark');
      expect(display.theme).toBe('dark');
    });

    it('should set theme to auto', () => {
      display.setTheme('auto');
      expect(display.theme).toBe('auto');
    });

    it('should throw error for invalid theme', () => {
      expect(() => display.setTheme('invalid')).toThrow('Theme must be "light", "dark", or "auto"');
    });
  });

  describe('setShowConfidence', () => {
    it('should enable confidence display', () => {
      display.setShowConfidence(true);
      expect(display.showConfidence).toBe(true);
    });

    it('should disable confidence display', () => {
      display.setShowConfidence(false);
      expect(display.showConfidence).toBe(false);
    });

    it('should convert to boolean', () => {
      display.setShowConfidence('yes');
      expect(display.showConfidence).toBe(true);

      display.setShowConfidence(0);
      expect(display.showConfidence).toBe(false);
    });
  });

  describe('setMaxWidth', () => {
    it('should set max width', () => {
      display.setMaxWidth(400);
      expect(display.maxWidth).toBe(400);
    });

    it('should throw error for invalid width', () => {
      expect(() => display.setMaxWidth(0)).toThrow('Width must be a positive number');
      expect(() => display.setMaxWidth(-100)).toThrow('Width must be a positive number');
      expect(() => display.setMaxWidth('invalid')).toThrow('Width must be a positive number');
    });
  });

  describe('event handling', () => {
    it('should close tooltip on close button click', () => {
      const tooltip = display.render(mockQuestion, 'Answer', 90);
      const closeBtn = tooltip.querySelector('.quiz-btn-close');

      expect(display.getActiveTooltipCount()).toBe(1);

      closeBtn.click();

      expect(display.getActiveTooltipCount()).toBe(0);
    });

    it('should dismiss tooltip on outside click', (done) => {
      const tooltip = display.render(mockQuestion, 'Answer', 90);

      expect(display.getActiveTooltipCount()).toBe(1);

      // Simulate outside click
      const outsideElement = document.createElement('div');
      document.body.appendChild(outsideElement);
      outsideElement.click();

      setTimeout(() => {
        expect(display.getActiveTooltipCount()).toBe(0);
        done();
      }, 10);
    });

    it('should not dismiss on tooltip click', (done) => {
      const tooltip = display.render(mockQuestion, 'Answer', 90);

      expect(display.getActiveTooltipCount()).toBe(1);

      // Click inside tooltip
      tooltip.click();

      setTimeout(() => {
        expect(display.getActiveTooltipCount()).toBe(1);
        done();
      }, 10);
    });
  });

  describe('integration scenarios', () => {
    it('should render multiple tooltips', () => {
      const q1 = { element: document.createElement('div'), questionText: 'Q1' };
      const q2 = { element: document.createElement('div'), questionText: 'Q2' };
      document.body.appendChild(q1.element);
      document.body.appendChild(q2.element);

      display.render(q1, 'Answer 1', 90);
      display.render(q2, 'Answer 2', 85);

      expect(display.getActiveTooltipCount()).toBe(2);
    });

    it('should handle rapid rendering', () => {
      for (let i = 0; i < 10; i++) {
        display.render(mockQuestion, `Answer ${i}`, 90 - i);
      }

      expect(display.getActiveTooltipCount()).toBe(10);
    });

    it('should maintain theme consistency', () => {
      display.setTheme('dark');

      const t1 = display.render(mockQuestion, 'Answer 1', 90);
      const t2 = display.render(mockQuestion, 'Answer 2', 85);

      expect(t1.classList.contains('dark')).toBe(true);
      expect(t2.classList.contains('dark')).toBe(true);
    });
  });
});
