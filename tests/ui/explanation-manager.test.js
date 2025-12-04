/**
 * Explanation Manager Tests
 * Tests explanation display and feedback features
 */

import { ExplanationManager } from '../../src/ui/explanation-manager.js';

describe('ExplanationManager', () => {
  let manager;
  let mockCache;
  let mockApiClient;

  beforeEach(() => {
    // Mock cache
    mockCache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined)
    };

    // Mock API client
    mockApiClient = {
      getAnswer: jest.fn().mockResolvedValue({
        answer: 'This is an explanation',
        confidence: 90
      })
    };

    manager = new ExplanationManager(mockCache, mockApiClient);
  });

  describe('constructor', () => {
    it('should throw error if cache is not provided', () => {
      expect(() => new ExplanationManager(null)).toThrow('Cache instance is required');
    });

    it('should initialize with cache and optional API client', () => {
      expect(manager.cache).toBe(mockCache);
      expect(manager.apiClient).toBe(mockApiClient);
      expect(manager.feedbackLog).toEqual([]);
    });

    it('should initialize without API client', () => {
      const managerNoApi = new ExplanationManager(mockCache);
      expect(managerNoApi.apiClient).toBeNull();
    });
  });

  describe('getExplanation', () => {
    it('should return cached explanation', async () => {
      mockCache.get.mockResolvedValue({
        answer: 'Cached explanation'
      });

      const explanation = await manager.getExplanation('Question?', 'Answer');

      expect(explanation).toBe('Cached explanation');
      expect(mockCache.get).toHaveBeenCalled();
    });

    it('should generate explanation via API on cache miss', async () => {
      mockCache.get.mockResolvedValue(null);

      const explanation = await manager.getExplanation('Question?', 'Answer');

      expect(explanation).toBe('This is an explanation');
      expect(mockApiClient.getAnswer).toHaveBeenCalled();
    });

    it('should cache generated explanation', async () => {
      mockCache.get.mockResolvedValue(null);

      await manager.getExplanation('Question?', 'Answer');

      expect(mockCache.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          answer: 'This is an explanation',
          quizType: 'explanation'
        })
      );
    });

    it('should return fallback when API not available', async () => {
      const managerNoApi = new ExplanationManager(mockCache);
      mockCache.get.mockResolvedValue(null);

      const explanation = await managerNoApi.getExplanation('Question?', 'Answer');

      expect(explanation).toContain('not available');
    });

    it('should throw error for invalid question', async () => {
      await expect(manager.getExplanation('', 'Answer')).rejects.toThrow('Question must be');
      await expect(manager.getExplanation(null, 'Answer')).rejects.toThrow('Question must be');
    });

    it('should throw error for invalid answer', async () => {
      await expect(manager.getExplanation('Question?', '')).rejects.toThrow('Answer must be');
      await expect(manager.getExplanation('Question?', null)).rejects.toThrow('Answer must be');
    });

    it('should handle API errors gracefully', async () => {
      mockCache.get.mockResolvedValue(null);
      mockApiClient.getAnswer.mockRejectedValue(new Error('API error'));

      const explanation = await manager.getExplanation('Question?', 'Answer');

      expect(explanation).toContain('Unable to generate');
    });
  });

  describe('displayExplanation', () => {
    it('should create and display explanation element', () => {
      const tooltip = document.createElement('div');
      const answerText = document.createElement('div');
      answerText.className = 'quiz-answer-text';
      tooltip.appendChild(answerText);

      const explanationDiv = manager.displayExplanation(tooltip, 'Test explanation');

      expect(explanationDiv).toBeDefined();
      expect(explanationDiv.classList.contains('quiz-answer-explanation')).toBe(true);
      expect(explanationDiv.textContent).toContain('Test explanation');
    });

    it('should include explanation header', () => {
      const tooltip = document.createElement('div');
      const answerText = document.createElement('div');
      answerText.className = 'quiz-answer-text';
      tooltip.appendChild(answerText);

      const explanationDiv = manager.displayExplanation(tooltip, 'Test explanation');

      expect(explanationDiv.textContent).toContain('Explanation:');
    });

    it('should escape HTML in explanation', () => {
      const tooltip = document.createElement('div');
      const answerText = document.createElement('div');
      answerText.className = 'quiz-answer-text';
      tooltip.appendChild(answerText);

      const explanationDiv = manager.displayExplanation(tooltip, '<script>alert("xss")</script>');

      expect(explanationDiv.innerHTML).not.toContain('<script>');
    });

    it('should toggle visibility if already displayed', () => {
      const tooltip = document.createElement('div');
      const answerText = document.createElement('div');
      answerText.className = 'quiz-answer-text';
      tooltip.appendChild(answerText);

      const exp1 = manager.displayExplanation(tooltip, 'Explanation 1');
      expect(exp1.style.display).not.toBe('none');

      const exp2 = manager.displayExplanation(tooltip, 'Explanation 2');
      expect(exp2).toBe(exp1); // Same element
      expect(exp2.style.display).toBe('none');

      const exp3 = manager.displayExplanation(tooltip, 'Explanation 3');
      expect(exp3.style.display).not.toBe('none');
    });

    it('should throw error for invalid tooltip', () => {
      expect(() => manager.displayExplanation(null, 'Explanation')).toThrow('Tooltip element is required');
    });

    it('should throw error for invalid explanation', () => {
      const tooltip = document.createElement('div');
      expect(() => manager.displayExplanation(tooltip, '')).toThrow('Explanation must be');
      expect(() => manager.displayExplanation(tooltip, null)).toThrow('Explanation must be');
    });
  });

  describe('reportWrongAnswer', () => {
    it('should create feedback object', async () => {
      const feedback = await manager.reportWrongAnswer('Question?', 'Wrong answer');

      expect(feedback.question).toBe('Question?');
      expect(feedback.answer).toBe('Wrong answer');
      expect(feedback.timestamp).toBeDefined();
      expect(feedback.platform).toBeDefined();
    });

    it('should store feedback locally', async () => {
      await manager.reportWrongAnswer('Question?', 'Wrong answer');

      expect(manager.feedbackLog.length).toBe(1);
      expect(manager.feedbackLog[0].question).toBe('Question?');
    });

    it('should include user feedback if provided', async () => {
      const feedback = await manager.reportWrongAnswer('Question?', 'Wrong answer', 'This is incorrect');

      expect(feedback.userFeedback).toBe('This is incorrect');
    });

    it('should send feedback to background worker', async () => {
      global.chrome = {
        runtime: {
          sendMessage: jest.fn()
        }
      };

      await manager.reportWrongAnswer('Question?', 'Wrong answer');

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'FEEDBACK_WRONG_ANSWER'
        })
      );
    });

    it('should throw error for invalid question', async () => {
      await expect(manager.reportWrongAnswer('', 'Answer')).rejects.toThrow('Question must be');
      await expect(manager.reportWrongAnswer(null, 'Answer')).rejects.toThrow('Question must be');
    });

    it('should throw error for invalid answer', async () => {
      await expect(manager.reportWrongAnswer('Question?', '')).rejects.toThrow('Answer must be');
      await expect(manager.reportWrongAnswer('Question?', null)).rejects.toThrow('Answer must be');
    });

    it('should handle chrome.runtime errors gracefully', async () => {
      global.chrome = {
        runtime: {
          sendMessage: jest.fn().mockImplementation(() => {
            throw new Error('Runtime error');
          })
        }
      };

      const feedback = await manager.reportWrongAnswer('Question?', 'Wrong answer');

      expect(feedback).toBeDefined();
      expect(manager.feedbackLog.length).toBe(1);
    });
  });

  describe('storeFeedback', () => {
    it('should add feedback to log', async () => {
      const feedback = { question: 'Q', answer: 'A', timestamp: Date.now() };

      await manager.storeFeedback(feedback);

      expect(manager.feedbackLog).toContain(feedback);
    });

    it('should maintain max feedback logs', async () => {
      manager.maxFeedbackLogs = 5;

      for (let i = 0; i < 10; i++) {
        await manager.storeFeedback({ question: `Q${i}`, answer: `A${i}`, timestamp: Date.now() });
      }

      expect(manager.feedbackLog.length).toBeLessThanOrEqual(5);
    });

    it('should throw error for invalid feedback', async () => {
      await expect(manager.storeFeedback(null)).rejects.toThrow('Feedback must be an object');
      await expect(manager.storeFeedback('invalid')).rejects.toThrow('Feedback must be an object');
    });
  });

  describe('getFeedbackStats', () => {
    it('should return feedback statistics', async () => {
      await manager.reportWrongAnswer('Q1', 'A1');
      await manager.reportWrongAnswer('Q2', 'A2');

      const stats = manager.getFeedbackStats();

      expect(stats.totalFeedback).toBe(2);
      expect(stats.maxLogs).toBe(100);
      expect(stats.lastUpdated).toBeDefined();
    });

    it('should return zero feedback initially', () => {
      const stats = manager.getFeedbackStats();

      expect(stats.totalFeedback).toBe(0);
      expect(stats.lastUpdated).toBeNull();
    });
  });

  describe('getFeedbackLogs', () => {
    it('should return copy of feedback logs', async () => {
      await manager.reportWrongAnswer('Q1', 'A1');
      await manager.reportWrongAnswer('Q2', 'A2');

      const logs = manager.getFeedbackLogs();

      expect(logs.length).toBe(2);
      expect(logs).not.toBe(manager.feedbackLog); // Should be a copy
    });

    it('should return empty array initially', () => {
      const logs = manager.getFeedbackLogs();

      expect(logs).toEqual([]);
    });
  });

  describe('clearFeedbackLogs', () => {
    it('should clear all feedback logs', async () => {
      await manager.reportWrongAnswer('Q1', 'A1');
      await manager.reportWrongAnswer('Q2', 'A2');

      expect(manager.feedbackLog.length).toBe(2);

      manager.clearFeedbackLogs();

      expect(manager.feedbackLog.length).toBe(0);
    });
  });

  describe('escapeHTML', () => {
    it('should escape HTML special characters', () => {
      const escaped = manager.escapeHTML('<script>alert("xss")</script>');

      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;');
      expect(escaped).toContain('&gt;');
    });

    it('should escape quotes', () => {
      const escaped = manager.escapeHTML('He said "Hello"');

      expect(escaped).toContain('&quot;');
    });
  });

  describe('setApiClient', () => {
    it('should set API client', () => {
      const newApiClient = {
        getAnswer: jest.fn()
      };

      manager.setApiClient(newApiClient);

      expect(manager.apiClient).toBe(newApiClient);
    });

    it('should throw error for invalid API client', () => {
      expect(() => manager.setApiClient(null)).toThrow('API client must have getAnswer method');
      expect(() => manager.setApiClient({})).toThrow('API client must have getAnswer method');
    });
  });

  describe('getApiClient', () => {
    it('should return current API client', () => {
      expect(manager.getApiClient()).toBe(mockApiClient);
    });

    it('should return null if no API client', () => {
      const managerNoApi = new ExplanationManager(mockCache);
      expect(managerNoApi.getApiClient()).toBeNull();
    });
  });

  describe('integration scenarios', () => {
    it('should handle full explanation and feedback flow', async () => {
      mockCache.get.mockResolvedValue(null);

      // Get explanation
      const explanation = await manager.getExplanation('Question?', 'Answer');
      expect(explanation).toBe('This is an explanation');

      // Report wrong answer
      const feedback = await manager.reportWrongAnswer('Question?', 'Answer', 'User feedback');
      expect(feedback.question).toBe('Question?');

      // Check stats
      const stats = manager.getFeedbackStats();
      expect(stats.totalFeedback).toBe(1);
    });

    it('should handle multiple explanations and feedback', async () => {
      mockCache.get.mockResolvedValue(null);

      for (let i = 0; i < 5; i++) {
        await manager.getExplanation(`Q${i}`, `A${i}`);
        await manager.reportWrongAnswer(`Q${i}`, `A${i}`);
      }

      const stats = manager.getFeedbackStats();
      expect(stats.totalFeedback).toBe(5);

      const logs = manager.getFeedbackLogs();
      expect(logs.length).toBe(5);
    });

    it('should maintain feedback across multiple operations', async () => {
      await manager.reportWrongAnswer('Q1', 'A1');
      await manager.reportWrongAnswer('Q2', 'A2');

      const logs1 = manager.getFeedbackLogs();
      expect(logs1.length).toBe(2);

      await manager.reportWrongAnswer('Q3', 'A3');

      const logs2 = manager.getFeedbackLogs();
      expect(logs2.length).toBe(3);
    });
  });
});
