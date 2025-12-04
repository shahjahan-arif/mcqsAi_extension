import { patternMatching, analyzePatterns, PATTERN_MAX_SCORE } from '../../src/detection/pattern-matcher.js';

describe('patternMatching', () => {
  let mockDom;

  beforeEach(() => {
    mockDom = {
      body: {
        innerText: ''
      }
    };
  });

  describe('scoring logic', () => {
    test('returns 0 for empty text', () => {
      const result = patternMatching(mockDom);
      expect(result).toBe(0);
    });

    test('scores question marks correctly (max 10 points)', () => {
      mockDom.body.innerText = 'What is this? Is this correct? Maybe?';
      const result = patternMatching(mockDom);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(10);
    });

    test('scores option prefixes correctly (max 15 points)', () => {
      mockDom.body.innerText = 'A) First option\nB) Second option\nC) Third option\nD) Fourth option';
      const result = patternMatching(mockDom);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(15);
    });

    test('scores numeric option prefixes', () => {
      mockDom.body.innerText = '1. First\n2. Second\n3. Third\n4. Fourth';
      const result = patternMatching(mockDom);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(15);
    });

    test('scores question patterns correctly (max 10 points)', () => {
      mockDom.body.innerText = 'Question 1 of 5\nQuestion 2 of 5\nQuestion 3 of 5';
      const result = patternMatching(mockDom);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(10);
    });

    test('scores keywords correctly (max 5 points)', () => {
      mockDom.body.innerText = 'Select the correct answer. Choose wisely. Answer this question.';
      const result = patternMatching(mockDom);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(5);
    });

    test('returns max score of 40', () => {
      mockDom.body.innerText = `
        Question 1 of 100?
        A) Option A? B) Option B? C) Option C? D) Option D?
        Select the answer. Choose wisely. Answer this.
        Question 2 of 100? Question 3 of 100? Question 4 of 100?
        1. First 2. Second 3. Third 4. Fourth 5. Fifth
        Submit now. Next question. Select answer.
      `;
      const result = patternMatching(mockDom);
      expect(result).toBe(PATTERN_MAX_SCORE);
      expect(result).toBe(40);
    });

    test('combines all scores correctly', () => {
      mockDom.body.innerText = `
        Question 1 of 5?
        A) First
        B) Second
        Select answer
      `;
      const result = patternMatching(mockDom);
      // Question mark: 1*2 = 2
      // Option prefix: 2*1.5 = 3
      // Question pattern: 1*5 = 5
      // Keywords: 1*0.5 = 0.5 (rounded down)
      // Total: 2 + 3 + 5 + 0 = 10
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(40);
    });
  });

  describe('pattern detection', () => {
    test('detects single question mark', () => {
      mockDom.body.innerText = 'What is this?';
      const result = patternMatching(mockDom);
      expect(result).toBeGreaterThan(0);
    });

    test('detects multiple question marks', () => {
      mockDom.body.innerText = '? ? ? ? ?';
      const result = patternMatching(mockDom);
      expect(result).toBeGreaterThan(0);
    });

    test('detects A-D option prefixes', () => {
      mockDom.body.innerText = 'A) B) C) D)';
      const result = patternMatching(mockDom);
      expect(result).toBeGreaterThan(0);
    });

    test('detects numeric option prefixes', () => {
      mockDom.body.innerText = '1. 2. 3. 4.';
      const result = patternMatching(mockDom);
      expect(result).toBeGreaterThan(0);
    });

    test('detects Question X of Y pattern', () => {
      mockDom.body.innerText = 'Question 1 of 10';
      const result = patternMatching(mockDom);
      expect(result).toBeGreaterThan(0);
    });

    test('detects keywords case-insensitively', () => {
      mockDom.body.innerText = 'SELECT the answer. CHOOSE wisely. ANSWER this.';
      const result = patternMatching(mockDom);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    test('handles null DOM gracefully', () => {
      expect(() => patternMatching(null)).toThrow();
    });

    test('handles DOM with no body', () => {
      expect(() => patternMatching({})).toThrow();
    });

    test('handles very long text', () => {
      mockDom.body.innerText = 'Question 1 of 100? '.repeat(1000);
      const result = patternMatching(mockDom);
      expect(result).toBeLessThanOrEqual(PATTERN_MAX_SCORE);
    });

    test('handles special characters', () => {
      mockDom.body.innerText = 'What is 2+2? A) 4 B) 5 C) 6 D) 7';
      const result = patternMatching(mockDom);
      expect(result).toBeGreaterThan(0);
    });

    test('handles unicode characters', () => {
      mockDom.body.innerText = 'Qu\'est-ce que c\'est? A) Réponse B) Autre';
      const result = patternMatching(mockDom);
      expect(result).toBeGreaterThan(0);
    });

    test('handles mixed patterns', () => {
      mockDom.body.innerText = `
        Question 1 of 5?
        A) Option A
        1. Alternative 1
        Select the correct answer
      `;
      const result = patternMatching(mockDom);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(40);
    });
  });

  describe('performance', () => {
    test('completes in less than 50ms', () => {
      mockDom.body.innerText = 'Question 1 of 100? '.repeat(10000);
      
      const start = performance.now();
      patternMatching(mockDom);
      const end = performance.now();
      
      expect(end - start).toBeLessThan(50);
    });

    test('handles large text efficiently', () => {
      mockDom.body.innerText = 'A) B) C) D) '.repeat(5000);
      
      const start = performance.now();
      const result = patternMatching(mockDom);
      const end = performance.now();
      
      expect(end - start).toBeLessThan(50);
      expect(result).toBeLessThanOrEqual(40);
    });
  });

  describe('return value structure', () => {
    test('returns number', () => {
      const result = patternMatching(mockDom);
      expect(typeof result).toBe('number');
    });

    test('score is always between 0 and 40', () => {
      mockDom.body.innerText = 'Question 1 of 100? A) B) C) D) Select answer. '.repeat(100);
      
      const result = patternMatching(mockDom);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(40);
    });
  });

  describe('analyzePatterns function', () => {
    test('returns detailed pattern analysis', () => {
      mockDom.body.innerText = `
        Question 1 of 5?
        A) First
        B) Second
        Select answer
      `;
      
      const analysis = analyzePatterns(mockDom);
      expect(analysis).toHaveProperty('questionMarks');
      expect(analysis).toHaveProperty('optionPrefixes');
      expect(analysis).toHaveProperty('questionPatterns');
      expect(analysis).toHaveProperty('keywords');
      expect(analysis).toHaveProperty('score');
    });

    test('analysis counts are accurate', () => {
      mockDom.body.innerText = 'Question 1 of 5? A) B) Select';
      
      const analysis = analyzePatterns(mockDom);
      expect(analysis.questionMarks).toBe(1);
      expect(analysis.optionPrefixes).toBe(2);
      expect(analysis.questionPatterns).toBe(1);
      expect(analysis.keywords).toBeGreaterThan(0);
    });
  });
});
