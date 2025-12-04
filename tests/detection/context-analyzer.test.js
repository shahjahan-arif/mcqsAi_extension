import { contextAnalysis, analyzeContext, CONTEXT_MAX_SCORE, QUIZ_KEYWORDS } from '../../src/detection/context-analyzer.js';

describe('contextAnalysis', () => {
  let mockDom;

  beforeEach(() => {
    mockDom = {
      body: {
        innerText: ''
      },
      querySelectorAll: jest.fn(() => [])
    };
  });

  describe('scoring logic', () => {
    test('returns 0 for empty DOM', () => {
      const result = contextAnalysis(mockDom);
      expect(result).toBe(0);
    });

    test('scores keywords correctly (max 3 points per keyword)', () => {
      mockDom.body.innerText = 'This is a quiz. Take the quiz now.';
      mockDom.querySelectorAll.mockReturnValue([]);
      
      const result = contextAnalysis(mockDom);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(20);
    });

    test('scores timer elements correctly (max 5 points)', () => {
      mockDom.body.innerText = '';
      mockDom.querySelectorAll.mockImplementation((selector) => {
        if (selector === '[class*="timer"], [id*="timer"]') return Array(3);
        return [];
      });
      
      const result = contextAnalysis(mockDom);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(5);
    });

    test('scores progress bars correctly (max 5 points)', () => {
      mockDom.body.innerText = '';
      mockDom.querySelectorAll.mockImplementation((selector) => {
        if (selector === 'progress, [class*="progress"], [role="progressbar"]') return Array(3);
        return [];
      });
      
      const result = contextAnalysis(mockDom);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(5);
    });

    test('scores ARIA labels correctly (max 5 points)', () => {
      mockDom.body.innerText = '';
      mockDom.querySelectorAll.mockImplementation((selector) => {
        if (selector === '[role="radiogroup"]') return Array(2);
        if (selector === '[role="group"]') return Array(1);
        if (selector === '[aria-label*="question"], [aria-labelledby*="question"]') return Array(2);
        return [];
      });
      
      const result = contextAnalysis(mockDom);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(5);
    });

    test('returns max score of 20', () => {
      mockDom.body.innerText = 'quiz exam test assessment questionnaire '.repeat(100);
      mockDom.querySelectorAll.mockReturnValue(Array(100));
      
      const result = contextAnalysis(mockDom);
      expect(result).toBe(CONTEXT_MAX_SCORE);
      expect(result).toBe(20);
    });

    test('combines all scores correctly', () => {
      mockDom.body.innerText = 'This is a quiz exam test';
      mockDom.querySelectorAll.mockImplementation((selector) => {
        if (selector === '[class*="timer"], [id*="timer"]') return Array(1);
        if (selector === 'progress, [class*="progress"], [role="progressbar"]') return Array(1);
        if (selector === '[role="radiogroup"]') return Array(1);
        if (selector === '[role="group"]') return [];
        if (selector === '[aria-label*="question"], [aria-labelledby*="question"]') return [];
        return [];
      });
      
      const result = contextAnalysis(mockDom);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(20);
    });
  });

  describe('keyword detection', () => {
    test('detects "quiz" keyword', () => {
      mockDom.body.innerText = 'Take this quiz now';
      mockDom.querySelectorAll.mockReturnValue([]);
      
      const result = contextAnalysis(mockDom);
      expect(result).toBeGreaterThan(0);
    });

    test('detects "exam" keyword', () => {
      mockDom.body.innerText = 'Final exam coming up';
      mockDom.querySelectorAll.mockReturnValue([]);
      
      const result = contextAnalysis(mockDom);
      expect(result).toBeGreaterThan(0);
    });

    test('detects "test" keyword', () => {
      mockDom.body.innerText = 'Take the test';
      mockDom.querySelectorAll.mockReturnValue([]);
      
      const result = contextAnalysis(mockDom);
      expect(result).toBeGreaterThan(0);
    });

    test('detects "assessment" keyword', () => {
      mockDom.body.innerText = 'Complete the assessment';
      mockDom.querySelectorAll.mockReturnValue([]);
      
      const result = contextAnalysis(mockDom);
      expect(result).toBeGreaterThan(0);
    });

    test('detects "questionnaire" keyword', () => {
      mockDom.body.innerText = 'Fill out the questionnaire';
      mockDom.querySelectorAll.mockReturnValue([]);
      
      const result = contextAnalysis(mockDom);
      expect(result).toBeGreaterThan(0);
    });

    test('detects keywords case-insensitively', () => {
      mockDom.body.innerText = 'QUIZ EXAM TEST ASSESSMENT QUESTIONNAIRE';
      mockDom.querySelectorAll.mockReturnValue([]);
      
      const result = contextAnalysis(mockDom);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('element detection', () => {
    test('detects timer elements by class', () => {
      mockDom.body.innerText = '';
      mockDom.querySelectorAll.mockImplementation((selector) => {
        if (selector === '[class*="timer"], [id*="timer"]') return Array(2);
        return [];
      });
      
      const result = contextAnalysis(mockDom);
      expect(result).toBeGreaterThan(0);
    });

    test('detects progress bars', () => {
      mockDom.body.innerText = '';
      mockDom.querySelectorAll.mockImplementation((selector) => {
        if (selector === 'progress, [class*="progress"], [role="progressbar"]') return Array(2);
        return [];
      });
      
      const result = contextAnalysis(mockDom);
      expect(result).toBeGreaterThan(0);
    });

    test('detects ARIA radiogroups', () => {
      mockDom.body.innerText = '';
      mockDom.querySelectorAll.mockImplementation((selector) => {
        if (selector === '[role="radiogroup"]') return Array(2);
        return [];
      });
      
      const result = contextAnalysis(mockDom);
      expect(result).toBeGreaterThan(0);
    });

    test('detects ARIA groups', () => {
      mockDom.body.innerText = '';
      mockDom.querySelectorAll.mockImplementation((selector) => {
        if (selector === '[role="group"]') return Array(2);
        return [];
      });
      
      const result = contextAnalysis(mockDom);
      expect(result).toBeGreaterThan(0);
    });

    test('detects ARIA question labels', () => {
      mockDom.body.innerText = '';
      mockDom.querySelectorAll.mockImplementation((selector) => {
        if (selector === '[aria-label*="question"], [aria-labelledby*="question"]') return Array(2);
        return [];
      });
      
      const result = contextAnalysis(mockDom);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    test('handles null DOM gracefully', () => {
      expect(() => contextAnalysis(null)).toThrow();
    });

    test('handles DOM without body', () => {
      expect(() => contextAnalysis({})).toThrow();
    });

    test('handles very large number of elements', () => {
      mockDom.body.innerText = '';
      mockDom.querySelectorAll.mockReturnValue(Array(10000));
      
      const result = contextAnalysis(mockDom);
      expect(result).toBeLessThanOrEqual(CONTEXT_MAX_SCORE);
    });

    test('handles mixed content', () => {
      mockDom.body.innerText = 'This is a quiz exam test';
      mockDom.querySelectorAll.mockImplementation((selector) => {
        if (selector === '[class*="timer"], [id*="timer"]') return Array(1);
        if (selector === 'progress, [class*="progress"], [role="progressbar"]') return Array(1);
        if (selector === '[role="radiogroup"]') return Array(1);
        if (selector === '[role="group"]') return Array(1);
        if (selector === '[aria-label*="question"], [aria-labelledby*="question"]') return Array(1);
        return [];
      });
      
      const result = contextAnalysis(mockDom);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(20);
    });
  });

  describe('performance', () => {
    test('completes in less than 50ms', () => {
      mockDom.body.innerText = 'quiz '.repeat(10000);
      mockDom.querySelectorAll.mockReturnValue(Array(1000));
      
      const start = performance.now();
      contextAnalysis(mockDom);
      const end = performance.now();
      
      expect(end - start).toBeLessThan(50);
    });
  });

  describe('return value structure', () => {
    test('returns number', () => {
      const result = contextAnalysis(mockDom);
      expect(typeof result).toBe('number');
    });

    test('score is always between 0 and 20', () => {
      mockDom.body.innerText = 'quiz exam test assessment questionnaire '.repeat(100);
      mockDom.querySelectorAll.mockReturnValue(Array(100));
      
      const result = contextAnalysis(mockDom);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(20);
    });
  });

  describe('analyzeContext function', () => {
    test('returns detailed context analysis', () => {
      mockDom.body.innerText = 'This is a quiz';
      mockDom.querySelectorAll.mockImplementation((selector) => {
        if (selector === '[class*="timer"], [id*="timer"]') return Array(1);
        if (selector === 'progress, [class*="progress"], [role="progressbar"]') return Array(1);
        if (selector === '[role="radiogroup"]') return Array(1);
        if (selector === '[role="group"]') return [];
        if (selector === '[aria-label*="question"], [aria-labelledby*="question"]') return [];
        return [];
      });
      
      const analysis = analyzeContext(mockDom);
      expect(analysis).toHaveProperty('keywords');
      expect(analysis).toHaveProperty('timerElements');
      expect(analysis).toHaveProperty('progressBars');
      expect(analysis).toHaveProperty('ariaElements');
      expect(analysis).toHaveProperty('score');
    });

    test('analysis counts are accurate', () => {
      mockDom.body.innerText = 'quiz exam';
      mockDom.querySelectorAll.mockImplementation((selector) => {
        if (selector === '[class*="timer"], [id*="timer"]') return Array(2);
        if (selector === 'progress, [class*="progress"], [role="progressbar"]') return Array(1);
        if (selector === '[role="radiogroup"]') return Array(1);
        if (selector === '[role="group"]') return [];
        if (selector === '[aria-label*="question"], [aria-labelledby*="question"]') return [];
        return [];
      });
      
      const analysis = analyzeContext(mockDom);
      expect(analysis.keywords).toBeGreaterThan(0);
      expect(analysis.timerElements).toBe(2);
      expect(analysis.progressBars).toBe(1);
      expect(analysis.ariaElements).toBe(1);
    });
  });

  describe('QUIZ_KEYWORDS constant', () => {
    test('exports QUIZ_KEYWORDS array', () => {
      expect(Array.isArray(QUIZ_KEYWORDS)).toBe(true);
      expect(QUIZ_KEYWORDS.length).toBeGreaterThan(0);
    });

    test('QUIZ_KEYWORDS contains expected keywords', () => {
      expect(QUIZ_KEYWORDS).toContain('quiz');
      expect(QUIZ_KEYWORDS).toContain('exam');
      expect(QUIZ_KEYWORDS).toContain('test');
      expect(QUIZ_KEYWORDS).toContain('assessment');
      expect(QUIZ_KEYWORDS).toContain('questionnaire');
    });
  });
});
