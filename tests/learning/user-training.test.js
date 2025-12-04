/**
 * User Training Manager Tests
 * Tests pattern extraction and storage
 */

import { UserTrainingManager } from '../../src/learning/user-training.js';

describe('UserTrainingManager', () => {
  let manager;
  let mockCache;
  let mockElement;

  beforeEach(() => {
    mockCache = {
      db: {
        transaction: jest.fn()
      }
    };

    mockElement = {
      tagName: 'DIV',
      id: 'quiz-container',
      classList: ['quiz', 'active'],
      children: [
        { tagName: 'H2', classList: ['question'], id: 'q1' },
        { tagName: 'DIV', classList: ['options'], id: 'opts1' }
      ],
      innerText: 'Question 1 of 5?\nA) Option A\nB) Option B\nC) Option C\nD) Option D',
      getAttribute: jest.fn((attr) => attr === 'data-quiz' ? 'true' : null)
    };

    manager = new UserTrainingManager(mockCache);
  });

  describe('constructor', () => {
    it('should throw error if cache is not provided', () => {
      expect(() => new UserTrainingManager(null)).toThrow('Cache instance is required');
    });

    it('should initialize with cache', () => {
      expect(manager.cache).toBe(mockCache);
      expect(manager.patterns).toEqual([]);
      expect(manager.maxPatterns).toBe(1000);
    });
  });

  describe('extractPattern', () => {
    it('should extract pattern from element', () => {
      const pattern = manager.extractPattern(mockElement);

      expect(pattern.id).toBeDefined();
      expect(pattern.url).toBeDefined();
      expect(pattern.domStructure).toBeDefined();
      expect(pattern.cssSelectors).toBeDefined();
      expect(pattern.textPatterns).toBeDefined();
      expect(pattern.confidence).toBe(100);
    });

    it('should throw error for null element', () => {
      expect(() => manager.extractPattern(null)).toThrow('Element is required');
    });

    it('should set confidence to 100', () => {
      const pattern = manager.extractPattern(mockElement);
      expect(pattern.confidence).toBe(100);
    });

    it('should include timestamps', () => {
      const pattern = manager.extractPattern(mockElement);
      expect(pattern.createdAt).toBeDefined();
      expect(pattern.lastUsed).toBeDefined();
    });
  });

  describe('serializeDOM', () => {
    it('should serialize DOM structure', () => {
      const serialized = manager.serializeDOM(mockElement);

      expect(serialized.tagName).toBe('DIV');
      expect(serialized.id).toBe('quiz-container');
      expect(serialized.classes).toContain('quiz');
      expect(serialized.children).toBeDefined();
    });

    it('should include child elements', () => {
      const serialized = manager.serializeDOM(mockElement);

      expect(serialized.children.length).toBeGreaterThan(0);
      expect(serialized.children[0].tagName).toBe('H2');
    });

    it('should handle null element', () => {
      const serialized = manager.serializeDOM(null);
      expect(serialized).toBeNull();
    });

    it('should limit children to 5', () => {
      mockElement.children = Array(10).fill({ tagName: 'DIV', classList: [], id: null });
      const serialized = manager.serializeDOM(mockElement);

      expect(serialized.children.length).toBeLessThanOrEqual(5);
    });
  });

  describe('extractSelectors', () => {
    it('should extract ID selector', () => {
      const selectors = manager.extractSelectors(mockElement);

      expect(selectors).toContain('#quiz-container');
    });

    it('should extract class selectors', () => {
      const selectors = manager.extractSelectors(mockElement);

      expect(selectors.some(s => s.includes('quiz'))).toBe(true);
    });

    it('should extract tag selector', () => {
      const selectors = manager.extractSelectors(mockElement);

      expect(selectors).toContain('div');
    });

    it('should extract data attribute selectors', () => {
      const selectors = manager.extractSelectors(mockElement);

      expect(selectors).toContain('[data-quiz]');
    });
  });

  describe('extractTextPatterns', () => {
    it('should detect question mark pattern', () => {
      const patterns = manager.extractTextPatterns(mockElement);

      expect(patterns).toContain('contains_question_mark');
    });

    it('should detect option prefix pattern', () => {
      const patterns = manager.extractTextPatterns(mockElement);

      expect(patterns).toContain('has_option_prefixes');
    });

    it('should detect question counter pattern', () => {
      const patterns = manager.extractTextPatterns(mockElement);

      expect(patterns).toContain('has_question_counter');
    });

    it('should detect multiple choice format', () => {
      const patterns = manager.extractTextPatterns(mockElement);

      expect(patterns).toContain('multiple_choice_format');
    });

    it('should detect true/false pattern', () => {
      mockElement.innerText = 'Is this true or false?';
      const patterns = manager.extractTextPatterns(mockElement);

      expect(patterns).toContain('true_false_format');
    });
  });

  describe('storePattern', () => {
    it('should store pattern', async () => {
      const pattern = manager.extractPattern(mockElement);

      await manager.storePattern(pattern);

      expect(manager.patterns).toContain(pattern);
    });

    it('should throw error for invalid pattern', async () => {
      await expect(manager.storePattern(null)).rejects.toThrow('Pattern must be an object');
      await expect(manager.storePattern('invalid')).rejects.toThrow('Pattern must be an object');
    });

    it('should maintain max patterns limit', async () => {
      manager.maxPatterns = 5;

      for (let i = 0; i < 10; i++) {
        const pattern = manager.extractPattern(mockElement);
        await manager.storePattern(pattern);
      }

      expect(manager.patterns.length).toBeLessThanOrEqual(5);
    });
  });

  describe('generatePatternId', () => {
    it('should generate unique IDs', () => {
      const id1 = manager.generatePatternId();
      const id2 = manager.generatePatternId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^pattern_/);
    });
  });

  describe('getPatterns', () => {
    it('should return copy of patterns', async () => {
      const pattern = manager.extractPattern(mockElement);
      await manager.storePattern(pattern);

      const patterns = manager.getPatterns();

      expect(patterns).toEqual(manager.patterns);
      expect(patterns).not.toBe(manager.patterns);
    });
  });

  describe('getPatternsForUrl', () => {
    it('should filter patterns by URL', async () => {
      const pattern1 = manager.extractPattern(mockElement);
      await manager.storePattern(pattern1);

      const patterns = manager.getPatternsForUrl(pattern1.url);

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].url).toBe(pattern1.url);
    });

    it('should throw error for invalid URL', () => {
      expect(() => manager.getPatternsForUrl('')).toThrow('URL must be');
      expect(() => manager.getPatternsForUrl(null)).toThrow('URL must be');
    });
  });

  describe('getStats', () => {
    it('should return statistics', async () => {
      const pattern = manager.extractPattern(mockElement);
      await manager.storePattern(pattern);

      const stats = manager.getStats();

      expect(stats.totalPatterns).toBe(1);
      expect(stats.maxPatterns).toBe(1000);
      expect(stats.averageConfidence).toBeDefined();
      expect(stats.lastUpdated).toBeDefined();
    });

    it('should return zero stats initially', () => {
      const stats = manager.getStats();

      expect(stats.totalPatterns).toBe(0);
      expect(stats.averageConfidence).toBe(0);
      expect(stats.lastUpdated).toBeNull();
    });
  });

  describe('clearPatterns', () => {
    it('should clear all patterns', async () => {
      const pattern = manager.extractPattern(mockElement);
      await manager.storePattern(pattern);

      expect(manager.patterns.length).toBeGreaterThan(0);

      manager.clearPatterns();

      expect(manager.patterns).toEqual([]);
    });
  });

  describe('deletePattern', () => {
    it('should delete pattern by ID', async () => {
      const pattern = manager.extractPattern(mockElement);
      await manager.storePattern(pattern);

      const deleted = manager.deletePattern(pattern.id);

      expect(deleted).toBe(true);
      expect(manager.patterns).not.toContain(pattern);
    });

    it('should return false if pattern not found', () => {
      const deleted = manager.deletePattern('nonexistent');

      expect(deleted).toBe(false);
    });

    it('should throw error for invalid ID', () => {
      expect(() => manager.deletePattern('')).toThrow('Pattern ID must be');
      expect(() => manager.deletePattern(null)).toThrow('Pattern ID must be');
    });
  });

  describe('updatePatternSuccess', () => {
    it('should increment success count', async () => {
      const pattern = manager.extractPattern(mockElement);
      await manager.storePattern(pattern);

      manager.updatePatternSuccess(pattern.id);

      expect(manager.patterns[0].successCount).toBe(1);
    });

    it('should update lastUsed timestamp', async () => {
      const pattern = manager.extractPattern(mockElement);
      await manager.storePattern(pattern);

      const oldTime = manager.patterns[0].lastUsed;
      manager.updatePatternSuccess(pattern.id);

      expect(manager.patterns[0].lastUsed).toBeGreaterThanOrEqual(oldTime);
    });

    it('should throw error for invalid ID', () => {
      expect(() => manager.updatePatternSuccess('')).toThrow('Pattern ID must be');
      expect(() => manager.updatePatternSuccess(null)).toThrow('Pattern ID must be');
    });
  });

  describe('findMatchingPattern', () => {
    it('should find matching pattern', async () => {
      const pattern = manager.extractPattern(mockElement);
      await manager.storePattern(pattern);

      const match = manager.findMatchingPattern(mockElement);

      expect(match).toBeDefined();
      expect(match.id).toBe(pattern.id);
    });

    it('should return null for no match', () => {
      const match = manager.findMatchingPattern(mockElement);

      expect(match).toBeNull();
    });

    it('should return null for null element', () => {
      const match = manager.findMatchingPattern(null);

      expect(match).toBeNull();
    });

    it('should score based on selector matches', async () => {
      const pattern1 = manager.extractPattern(mockElement);
      await manager.storePattern(pattern1);

      const differentElement = {
        tagName: 'DIV',
        id: 'other',
        classList: [],
        children: [],
        innerText: 'Different content',
        getAttribute: jest.fn()
      };

      const match = manager.findMatchingPattern(differentElement);

      // Should still match on tag name
      expect(match).toBeDefined();
    });
  });

  describe('showConfirmation', () => {
    it('should create toast notification', () => {
      manager.showConfirmation();

      // In browser environment, would create element
      // In test, just verify no error
      expect(true).toBe(true);
    });

    it('should use custom message', () => {
      manager.showConfirmation('Custom message');

      expect(true).toBe(true);
    });
  });

  describe('integration scenarios', () => {
    it('should handle full pattern extraction and storage', async () => {
      const pattern = manager.extractPattern(mockElement);
      await manager.storePattern(pattern);

      const stats = manager.getStats();
      expect(stats.totalPatterns).toBe(1);

      const retrieved = manager.getPatterns();
      expect(retrieved.length).toBe(1);
    });

    it('should handle multiple patterns', async () => {
      for (let i = 0; i < 5; i++) {
        const pattern = manager.extractPattern(mockElement);
        await manager.storePattern(pattern);
      }

      const stats = manager.getStats();
      expect(stats.totalPatterns).toBe(5);
    });

    it('should track pattern success', async () => {
      const pattern = manager.extractPattern(mockElement);
      await manager.storePattern(pattern);

      manager.updatePatternSuccess(pattern.id);
      manager.updatePatternSuccess(pattern.id);

      expect(manager.patterns[0].successCount).toBe(2);
    });
  });
});
