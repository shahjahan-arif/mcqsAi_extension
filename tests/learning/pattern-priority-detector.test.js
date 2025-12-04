/**
 * Pattern Priority Detector Tests
 * Tests pattern matching and priority detection
 */

import { PatternPriorityDetector } from '../../src/learning/pattern-priority-detector.js';

describe('PatternPriorityDetector', () => {
  let detector;
  let mockCache;
  let mockUniversalDetector;
  let mockDOM;
  let mockPattern;

  beforeEach(() => {
    mockCache = {
      db: { transaction: jest.fn() }
    };

    mockUniversalDetector = {
      detectQuiz: jest.fn().mockResolvedValue({
        isQuiz: true,
        confidence: 85
      })
    };

    mockDOM = {
      querySelector: jest.fn((selector) => {
        if (selector === '#quiz-container' || selector === '.quiz') {
          return { tagName: 'DIV' };
        }
        return null;
      }),
      querySelectorAll: jest.fn((selector) => [
        { innerText: 'Question 1?', textContent: 'Question 1?' },
        { innerText: 'Question 2?', textContent: 'Question 2?' }
      ]),
      body: {
        innerText: 'Question 1 of 5?\nA) Option A\nB) Option B'
      }
    };

    mockPattern = {
      id: 'pattern_123',
      url: 'example.com',
      cssSelectors: ['#quiz-container', '.quiz'],
      textPatterns: ['contains_question_mark', 'has_option_prefixes'],
      confidence: 100,
      successCount: 5,
      lastUsed: Date.now()
    };

    detector = new PatternPriorityDetector(mockCache, mockUniversalDetector);
  });

  describe('constructor', () => {
    it('should throw error if cache is not provided', () => {
      expect(() => new PatternPriorityDetector(null)).toThrow('Cache instance is required');
    });

    it('should initialize with cache and optional detector', () => {
      expect(detector.cache).toBe(mockCache);
      expect(detector.universalDetector).toBe(mockUniversalDetector);
    });

    it('should initialize without universal detector', () => {
      const detectorNoUniversal = new PatternPriorityDetector(mockCache);
      expect(detectorNoUniversal.universalDetector).toBeNull();
    });
  });

  describe('detectQuiz', () => {
    it('should throw error if DOM is not provided', async () => {
      await expect(detector.detectQuiz(null)).rejects.toThrow('DOM document is required');
    });

    it('should return user pattern match with 100% confidence', async () => {
      const result = await detector.detectQuiz(mockDOM, [mockPattern]);

      expect(result.isQuiz).toBe(true);
      expect(result.confidence).toBe(100);
      expect(result.source).toBe('user-pattern');
      expect(result.patternId).toBe('pattern_123');
    });

    it('should fall back to universal detection', async () => {
      const result = await detector.detectQuiz(mockDOM, []);

      expect(result.source).toBe('universal');
      expect(mockUniversalDetector.detectQuiz).toHaveBeenCalled();
    });

    it('should return no detection if no patterns and no detector', async () => {
      const detectorNoUniversal = new PatternPriorityDetector(mockCache);
      const result = await detectorNoUniversal.detectQuiz(mockDOM, []);

      expect(result.isQuiz).toBe(false);
      expect(result.source).toBe('none');
    });
  });

  describe('checkUserPatterns', () => {
    it('should find matching pattern', () => {
      const pattern = detector.checkUserPatterns(mockDOM, [mockPattern]);

      expect(pattern).toBe(mockPattern);
    });

    it('should return null if no match', () => {
      mockDOM.querySelector.mockReturnValue(null);
      const pattern = detector.checkUserPatterns(mockDOM, [mockPattern]);

      expect(pattern).toBeNull();
    });

    it('should return null for empty patterns', () => {
      const pattern = detector.checkUserPatterns(mockDOM, []);

      expect(pattern).toBeNull();
    });

    it('should return null for non-array patterns', () => {
      const pattern = detector.checkUserPatterns(mockDOM, null);

      expect(pattern).toBeNull();
    });
  });

  describe('matchesPattern', () => {
    it('should match pattern with all selectors', () => {
      const matches = detector.matchesPattern(mockDOM, mockPattern);

      expect(matches).toBe(true);
    });

    it('should not match if selector missing', () => {
      mockDOM.querySelector.mockReturnValue(null);
      const matches = detector.matchesPattern(mockDOM, mockPattern);

      expect(matches).toBe(false);
    });

    it('should match text patterns', () => {
      const matches = detector.matchesPattern(mockDOM, mockPattern);

      expect(matches).toBe(true);
    });

    it('should not match if text pattern missing', () => {
      mockDOM.body.innerText = 'No questions here';
      const matches = detector.matchesPattern(mockDOM, mockPattern);

      expect(matches).toBe(false);
    });

    it('should handle invalid selectors gracefully', () => {
      mockDOM.querySelector.mockImplementation(() => {
        throw new Error('Invalid selector');
      });

      const matches = detector.matchesPattern(mockDOM, mockPattern);

      expect(matches).toBe(false);
    });

    it('should return false for null pattern', () => {
      const matches = detector.matchesPattern(mockDOM, null);

      expect(matches).toBe(false);
    });

    it('should return false for null DOM', () => {
      const matches = detector.matchesPattern(null, mockPattern);

      expect(matches).toBe(false);
    });
  });

  describe('recordPatternSuccess', () => {
    it('should increment success count', () => {
      const patterns = [{ ...mockPattern }];
      const initialCount = patterns[0].successCount;

      detector.recordPatternSuccess(mockPattern.id, patterns);

      expect(patterns[0].successCount).toBe(initialCount + 1);
    });

    it('should update lastUsed timestamp', () => {
      const patterns = [{ ...mockPattern }];
      const oldTime = patterns[0].lastUsed;

      detector.recordPatternSuccess(mockPattern.id, patterns);

      expect(patterns[0].lastUsed).toBeGreaterThanOrEqual(oldTime);
    });

    it('should handle null pattern ID', () => {
      const patterns = [{ ...mockPattern }];

      detector.recordPatternSuccess(null, patterns);

      expect(patterns[0].successCount).toBe(mockPattern.successCount);
    });

    it('should handle non-array patterns', () => {
      expect(() => detector.recordPatternSuccess(mockPattern.id, null)).not.toThrow();
    });
  });

  describe('extractQuestionsFromPattern', () => {
    it('should extract questions from DOM', () => {
      const questions = detector.extractQuestionsFromPattern(mockDOM, mockPattern);

      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0].questionText).toBeDefined();
      expect(questions[0].questionNumber).toBeDefined();
    });

    it('should return empty array for null pattern', () => {
      const questions = detector.extractQuestionsFromPattern(mockDOM, null);

      expect(questions).toEqual([]);
    });

    it('should return empty array for null DOM', () => {
      const questions = detector.extractQuestionsFromPattern(null, mockPattern);

      expect(questions).toEqual([]);
    });

    it('should handle invalid selectors', () => {
      mockDOM.querySelectorAll.mockImplementation(() => {
        throw new Error('Invalid selector');
      });

      const questions = detector.extractQuestionsFromPattern(mockDOM, mockPattern);

      expect(questions).toEqual([]);
    });
  });

  describe('cleanupOldPatterns', () => {
    it('should remove patterns older than 90 days', () => {
      const ninetyOneDaysAgo = Date.now() - (91 * 24 * 60 * 60 * 1000);
      const patterns = [
        { ...mockPattern, lastUsed: ninetyOneDaysAgo },
        { ...mockPattern, id: 'pattern_456', lastUsed: Date.now() }
      ];

      const cleaned = detector.cleanupOldPatterns(patterns);

      expect(cleaned.length).toBe(1);
      expect(cleaned[0].id).toBe('pattern_456');
    });

    it('should keep patterns used within 90 days', () => {
      const patterns = [{ ...mockPattern }];

      const cleaned = detector.cleanupOldPatterns(patterns);

      expect(cleaned.length).toBe(1);
    });

    it('should return empty array for null patterns', () => {
      const cleaned = detector.cleanupOldPatterns(null);

      expect(cleaned).toEqual([]);
    });

    it('should use createdAt if lastUsed not available', () => {
      const ninetyOneDaysAgo = Date.now() - (91 * 24 * 60 * 60 * 1000);
      const patterns = [
        { id: 'p1', createdAt: ninetyOneDaysAgo },
        { id: 'p2', createdAt: Date.now() }
      ];

      const cleaned = detector.cleanupOldPatterns(patterns);

      expect(cleaned.length).toBe(1);
      expect(cleaned[0].id).toBe('p2');
    });
  });

  describe('getPatternStats', () => {
    it('should return pattern statistics', () => {
      const patterns = [
        { ...mockPattern, successCount: 10 },
        { ...mockPattern, id: 'p2', successCount: 5 }
      ];

      const stats = detector.getPatternStats(patterns);

      expect(stats.totalPatterns).toBe(2);
      expect(stats.totalSuccesses).toBe(15);
      expect(stats.patterns.length).toBe(2);
    });

    it('should return zero stats for empty patterns', () => {
      const stats = detector.getPatternStats([]);

      expect(stats.totalPatterns).toBe(0);
      expect(stats.totalSuccesses).toBe(0);
    });

    it('should return zero stats for null patterns', () => {
      const stats = detector.getPatternStats(null);

      expect(stats.totalPatterns).toBe(0);
      expect(stats.totalSuccesses).toBe(0);
    });

    it('should format pattern details', () => {
      const stats = detector.getPatternStats([mockPattern]);

      expect(stats.patterns[0].id).toBe(mockPattern.id);
      expect(stats.patterns[0].url).toBe(mockPattern.url);
      expect(stats.patterns[0].successCount).toBe(mockPattern.successCount);
    });
  });

  describe('setUniversalDetector', () => {
    it('should set universal detector', () => {
      const newDetector = { detectQuiz: jest.fn() };

      detector.setUniversalDetector(newDetector);

      expect(detector.universalDetector).toBe(newDetector);
    });

    it('should throw error for invalid detector', () => {
      expect(() => detector.setUniversalDetector(null)).toThrow('Detector must have detectQuiz method');
      expect(() => detector.setUniversalDetector({})).toThrow('Detector must have detectQuiz method');
    });
  });

  describe('getUniversalDetector', () => {
    it('should return current universal detector', () => {
      expect(detector.getUniversalDetector()).toBe(mockUniversalDetector);
    });

    it('should return null if no detector', () => {
      const detectorNoUniversal = new PatternPriorityDetector(mockCache);
      expect(detectorNoUniversal.getUniversalDetector()).toBeNull();
    });
  });

  describe('integration scenarios', () => {
    it('should prioritize user patterns over universal detection', async () => {
      const result = await detector.detectQuiz(mockDOM, [mockPattern]);

      expect(result.source).toBe('user-pattern');
      expect(result.confidence).toBe(100);
      expect(mockUniversalDetector.detectQuiz).not.toHaveBeenCalled();
    });

    it('should fall back to universal detection when no user pattern', async () => {
      const result = await detector.detectQuiz(mockDOM, []);

      expect(result.source).toBe('universal');
      expect(mockUniversalDetector.detectQuiz).toHaveBeenCalled();
    });

    it('should track pattern success and cleanup', () => {
      const patterns = [
        { ...mockPattern, lastUsed: Date.now() },
        { ...mockPattern, id: 'old', lastUsed: Date.now() - (91 * 24 * 60 * 60 * 1000) }
      ];

      detector.recordPatternSuccess(mockPattern.id, patterns);
      const cleaned = detector.cleanupOldPatterns(patterns);

      expect(patterns[0].successCount).toBe(mockPattern.successCount + 1);
      expect(cleaned.length).toBe(1);
    });
  });
});
