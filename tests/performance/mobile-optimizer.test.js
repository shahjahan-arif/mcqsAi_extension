/**
 * Mobile Optimizer Tests
 * Tests speed mode optimizations for mobile devices
 */

import { MobileOptimizer } from '../../src/performance/mobile-optimizer.js';
import { PERFORMANCE_MODES } from '../../src/performance/adaptive.js';

describe('MobileOptimizer', () => {
  let optimizer;
  let mockCache;
  let mockRetriever;
  let mockAdaptive;

  beforeEach(() => {
    // Mock cache
    mockCache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined)
    };

    // Mock retriever
    mockRetriever = {
      getAnswer: jest.fn().mockResolvedValue({
        answer: 'Test Answer',
        source: 'api',
        confidence: 90,
        elapsed: 100
      })
    };

    // Mock adaptive performance
    mockAdaptive = {
      mode: PERFORMANCE_MODES.SPEED_MODE
    };

    optimizer = new MobileOptimizer(mockCache, mockRetriever, mockAdaptive);
  });

  describe('constructor', () => {
    it('should throw error if cache is not provided', () => {
      expect(() => new MobileOptimizer(null, mockRetriever, mockAdaptive)).toThrow('Cache instance is required');
    });

    it('should throw error if retriever is not provided', () => {
      expect(() => new MobileOptimizer(mockCache, null, mockAdaptive)).toThrow('Retriever instance is required');
    });

    it('should throw error if adaptive is not provided', () => {
      expect(() => new MobileOptimizer(mockCache, mockRetriever, null)).toThrow('Adaptive performance instance is required');
    });

    it('should initialize with default values', () => {
      expect(optimizer.batteryMonitor).toBeNull();
      expect(optimizer.isContinuousMonitoringEnabled).toBe(true);
    });
  });

  describe('optimizeDetection', () => {
    it('should return null if not in speed mode', () => {
      mockAdaptive.mode = PERFORMANCE_MODES.ACCURACY_MODE;

      const result = optimizer.optimizeDetection(document);

      expect(result).toBeNull();
    });

    it('should return detection result in speed mode', () => {
      mockAdaptive.mode = PERFORMANCE_MODES.SPEED_MODE;

      const mockDOM = {
        body: {
          innerText: 'Question 1? A) Option A B) Option B'
        },
        querySelectorAll: jest.fn().mockReturnValue([])
      };

      const result = optimizer.optimizeDetection(mockDOM);

      expect(result).toBeDefined();
      expect(result.isQuiz).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(result.requiresAIVerification).toBe(false);
    });

    it('should skip AI verification in speed mode', () => {
      mockAdaptive.mode = PERFORMANCE_MODES.SPEED_MODE;

      const mockDOM = {
        body: { innerText: 'Test' },
        querySelectorAll: jest.fn().mockReturnValue([])
      };

      const result = optimizer.optimizeDetection(mockDOM);

      expect(result.requiresAIVerification).toBe(false);
    });

    it('should handle null DOM', () => {
      mockAdaptive.mode = PERFORMANCE_MODES.SPEED_MODE;

      const result = optimizer.optimizeDetection(null);

      expect(result.isQuiz).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it('should handle DOM without body', () => {
      mockAdaptive.mode = PERFORMANCE_MODES.SPEED_MODE;

      const mockDOM = {
        body: null,
        querySelectorAll: jest.fn().mockReturnValue([])
      };

      const result = optimizer.optimizeDetection(mockDOM);

      expect(result.isQuiz).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it('should detect quiz with high confidence', () => {
      mockAdaptive.mode = PERFORMANCE_MODES.SPEED_MODE;

      const mockDOM = {
        body: {
          innerText: 'Question 1? A) Option A B) Option B\nQuestion 2? C) Option C D) Option D'
        },
        querySelectorAll: jest.fn((selector) => {
          if (selector === 'form') return [1, 2];
          if (selector === 'input[type="radio"], input[type="checkbox"]') return [1, 2, 3, 4];
          if (selector === 'button[type="submit"]') return [1];
          return [];
        })
      };

      const result = optimizer.optimizeDetection(mockDOM);

      expect(result.isQuiz).toBe(true);
      expect(result.confidence).toBeGreaterThan(50);
    });

    it('should normalize confidence to 0-100', () => {
      mockAdaptive.mode = PERFORMANCE_MODES.SPEED_MODE;

      const mockDOM = {
        body: { innerText: '' },
        querySelectorAll: jest.fn().mockReturnValue([])
      };

      const result = optimizer.optimizeDetection(mockDOM);

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });
  });

  describe('structuralScanFast', () => {
    it('should count forms', () => {
      const mockDOM = {
        querySelectorAll: jest.fn((selector) => {
          if (selector === 'form') return [1, 2, 3];
          return [];
        })
      };

      const score = optimizer.structuralScanFast(mockDOM);

      expect(score).toBeGreaterThan(0);
    });

    it('should count radio and checkbox inputs', () => {
      const mockDOM = {
        querySelectorAll: jest.fn((selector) => {
          if (selector === 'input[type="radio"], input[type="checkbox"]') return [1, 2, 3, 4];
          return [];
        })
      };

      const score = optimizer.structuralScanFast(mockDOM);

      expect(score).toBeGreaterThan(0);
    });

    it('should count submit buttons', () => {
      const mockDOM = {
        querySelectorAll: jest.fn((selector) => {
          if (selector === 'button[type="submit"]') return [1, 2];
          return [];
        })
      };

      const score = optimizer.structuralScanFast(mockDOM);

      expect(score).toBeGreaterThan(0);
    });

    it('should cap score at 40', () => {
      const mockDOM = {
        querySelectorAll: jest.fn().mockReturnValue(new Array(100))
      };

      const score = optimizer.structuralScanFast(mockDOM);

      expect(score).toBeLessThanOrEqual(40);
    });

    it('should handle errors gracefully', () => {
      const mockDOM = {
        querySelectorAll: jest.fn().mockImplementation(() => {
          throw new Error('Query error');
        })
      };

      const score = optimizer.structuralScanFast(mockDOM);

      expect(score).toBe(0);
    });
  });

  describe('patternMatchingFast', () => {
    it('should count question marks', () => {
      const mockDOM = {
        body: {
          innerText: 'Question 1? Question 2? Question 3?'
        }
      };

      const score = optimizer.patternMatchingFast(mockDOM);

      expect(score).toBeGreaterThan(0);
    });

    it('should count option prefixes', () => {
      const mockDOM = {
        body: {
          innerText: 'A) Option A\nB) Option B\nC) Option C\nD) Option D'
        }
      };

      const score = optimizer.patternMatchingFast(mockDOM);

      expect(score).toBeGreaterThan(0);
    });

    it('should count numeric option prefixes', () => {
      const mockDOM = {
        body: {
          innerText: '1. Option 1\n2. Option 2\n3. Option 3\n4. Option 4'
        }
      };

      const score = optimizer.patternMatchingFast(mockDOM);

      expect(score).toBeGreaterThan(0);
    });

    it('should cap score at 40', () => {
      const mockDOM = {
        body: {
          innerText: '?'.repeat(100) + 'A) '.repeat(100)
        }
      };

      const score = optimizer.patternMatchingFast(mockDOM);

      expect(score).toBeLessThanOrEqual(40);
    });

    it('should handle missing body', () => {
      const mockDOM = {
        body: null
      };

      const score = optimizer.patternMatchingFast(mockDOM);

      expect(score).toBe(0);
    });

    it('should handle errors gracefully', () => {
      const mockDOM = {
        body: {
          get innerText() {
            throw new Error('Access error');
          }
        }
      };

      const score = optimizer.patternMatchingFast(mockDOM);

      expect(score).toBe(0);
    });
  });

  describe('getAnswerOptimized', () => {
    it('should return cached answer on cache hit', async () => {
      const cachedAnswer = {
        answer: 'Cached Answer',
        confidence: 95
      };

      mockCache.get.mockResolvedValue(cachedAnswer);

      const result = await optimizer.getAnswerOptimized('What is 2+2?');

      expect(result.source).toBe('cache');
      expect(result.answer).toBe('Cached Answer');
      expect(result.confidence).toBe(95);
    });

    it('should call API on cache miss', async () => {
      mockCache.get.mockResolvedValue(null);

      const result = await optimizer.getAnswerOptimized('What is 2+2?');

      expect(mockRetriever.getAnswer).toHaveBeenCalled();
      expect(result.source).toBe('api');
    });

    it('should use cache-first strategy', async () => {
      mockCache.get.mockResolvedValue({ answer: 'Cached', confidence: 90 });

      await optimizer.getAnswerOptimized('Question');

      expect(mockCache.get).toHaveBeenCalled();
      expect(mockRetriever.getAnswer).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockCache.get.mockRejectedValue(new Error('Cache error'));

      const result = await optimizer.getAnswerOptimized('Question');

      expect(result.source).toBe('error');
      expect(result.answer).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('should include elapsed time', async () => {
      mockCache.get.mockResolvedValue(null);

      const result = await optimizer.getAnswerOptimized('Question');

      expect(result.elapsed).toBeDefined();
    });
  });

  describe('monitorBattery', () => {
    it('should set up battery monitoring', async () => {
      const mockBattery = {
        addEventListener: jest.fn(),
        level: 0.5
      };

      navigator.getBattery = jest.fn().mockResolvedValue(mockBattery);

      await optimizer.monitorBattery();

      expect(optimizer.batteryMonitor).toBe(mockBattery);
      expect(mockBattery.addEventListener).toHaveBeenCalledWith('levelchange', expect.any(Function));
    });

    it('should disable continuous monitoring at <10% battery', async () => {
      const mockBattery = {
        addEventListener: jest.fn((event, handler) => {
          // Simulate battery level change to 5%
          mockBattery.level = 0.05;
          handler();
        }),
        level: 0.05
      };

      navigator.getBattery = jest.fn().mockResolvedValue(mockBattery);

      await optimizer.monitorBattery();

      expect(optimizer.isContinuousMonitoringEnabled).toBe(false);
    });

    it('should re-enable continuous monitoring at >20% battery', async () => {
      optimizer.isContinuousMonitoringEnabled = false;

      const mockBattery = {
        addEventListener: jest.fn((event, handler) => {
          // Simulate battery level change to 25%
          mockBattery.level = 0.25;
          handler();
        }),
        level: 0.25
      };

      navigator.getBattery = jest.fn().mockResolvedValue(mockBattery);

      await optimizer.monitorBattery();

      expect(optimizer.isContinuousMonitoringEnabled).toBe(true);
    });

    it('should handle Battery API unavailable', async () => {
      navigator.getBattery = undefined;

      await expect(optimizer.monitorBattery()).resolves.not.toThrow();
    });
  });

  describe('disableContinuousMonitoring', () => {
    it('should disable continuous monitoring', () => {
      optimizer.isContinuousMonitoringEnabled = true;

      optimizer.disableContinuousMonitoring();

      expect(optimizer.isContinuousMonitoringEnabled).toBe(false);
    });
  });

  describe('enableContinuousMonitoring', () => {
    it('should enable continuous monitoring', () => {
      optimizer.isContinuousMonitoringEnabled = false;

      optimizer.enableContinuousMonitoring();

      expect(optimizer.isContinuousMonitoringEnabled).toBe(true);
    });
  });

  describe('isContinuousMonitoringActive', () => {
    it('should return monitoring status', () => {
      optimizer.isContinuousMonitoringEnabled = true;

      expect(optimizer.isContinuousMonitoringActive()).toBe(true);

      optimizer.isContinuousMonitoringEnabled = false;

      expect(optimizer.isContinuousMonitoringActive()).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return optimization statistics', () => {
      const stats = optimizer.getStats();

      expect(stats.mode).toBe(PERFORMANCE_MODES.SPEED_MODE);
      expect(stats.continuousMonitoringEnabled).toBe(true);
      expect(stats.batteryMonitorActive).toBe(false);
    });

    it('should reflect battery monitor status', () => {
      optimizer.batteryMonitor = {};

      const stats = optimizer.getStats();

      expect(stats.batteryMonitorActive).toBe(true);
    });
  });

  describe('stopMonitoring', () => {
    it('should stop battery monitoring', () => {
      const mockBattery = {
        removeEventListener: jest.fn()
      };

      optimizer.batteryMonitor = mockBattery;

      optimizer.stopMonitoring();

      expect(optimizer.batteryMonitor).toBeNull();
    });

    it('should handle null battery monitor', () => {
      optimizer.batteryMonitor = null;

      expect(() => optimizer.stopMonitoring()).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should optimize detection and get cached answer', async () => {
      mockAdaptive.mode = PERFORMANCE_MODES.SPEED_MODE;
      mockCache.get.mockResolvedValue({
        answer: 'Cached Answer',
        confidence: 95
      });

      const mockDOM = {
        body: { innerText: 'Question? A) A B) B' },
        querySelectorAll: jest.fn().mockReturnValue([])
      };

      const detection = optimizer.optimizeDetection(mockDOM);
      const answer = await optimizer.getAnswerOptimized('Question?');

      expect(detection.requiresAIVerification).toBe(false);
      expect(answer.source).toBe('cache');
    });

    it('should handle speed mode with API fallback', async () => {
      mockAdaptive.mode = PERFORMANCE_MODES.SPEED_MODE;
      mockCache.get.mockResolvedValue(null);

      const answer = await optimizer.getAnswerOptimized('Question?');

      expect(mockRetriever.getAnswer).toHaveBeenCalled();
      expect(answer.source).toBe('api');
    });

    it('should disable features on low battery', async () => {
      const mockBattery = {
        addEventListener: jest.fn((event, handler) => {
          mockBattery.level = 0.05;
          handler();
        }),
        level: 0.05
      };

      navigator.getBattery = jest.fn().mockResolvedValue(mockBattery);

      await optimizer.monitorBattery();

      expect(optimizer.isContinuousMonitoringActive()).toBe(false);
    });

    it('should maintain cache-first strategy throughout', async () => {
      mockCache.get.mockResolvedValue({ answer: 'Cached', confidence: 90 });

      const answer1 = await optimizer.getAnswerOptimized('Q1');
      const answer2 = await optimizer.getAnswerOptimized('Q2');

      expect(answer1.source).toBe('cache');
      expect(answer2.source).toBe('cache');
      expect(mockRetriever.getAnswer).not.toHaveBeenCalled();
    });
  });
});
