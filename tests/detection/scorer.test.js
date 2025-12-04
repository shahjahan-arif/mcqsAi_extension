import { scoreAndDecide, identifyQuizType, extractQuestions, QUIZ_TYPES } from '../../src/detection/scorer.js';

describe('scoreAndDecide', () => {
  let mockDom;
  let mockScores;

  beforeEach(() => {
    mockDom = {
      body: {
        innerText: ''
      },
      querySelectorAll: jest.fn(() => [])
    };
    mockScores = {
      structural: 0,
      pattern: 0,
      context: 0
    };
  });

  describe('confidence calculation', () => {
    test('calculates confidence from combined scores', () => {
      mockScores = { structural: 20, pattern: 20, context: 10 };
      const result = scoreAndDecide(mockScores, mockDom);
      expect(result.confidence).toBe(50);
    });

    test('handles max scores', () => {
      mockScores = { structural: 40, pattern: 40, context: 20 };
      const result = scoreAndDecide(mockScores, mockDom);
      expect(result.confidence).toBe(100);
    });

    test('handles zero scores', () => {
      mockScores = { structural: 0, pattern: 0, context: 0 };
      const result = scoreAndDecide(mockScores, mockDom);
      expect(result.confidence).toBe(0);
    });

    test('rounds confidence to nearest integer', () => {
      mockScores = { structural: 33, pattern: 33, context: 10 };
      const result = scoreAndDecide(mockScores, mockDom);
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBe(Math.round(76));
    });
  });

  describe('threshold logic', () => {
    test('high confidence (>80) sets isQuiz to true', () => {
      mockScores = { structural: 40, pattern: 40, context: 10 };
      const result = scoreAndDecide(mockScores, mockDom);
      expect(result.isQuiz).toBe(true);
      expect(result.requiresAIVerification).toBe(false);
    });

    test('medium confidence (50-80) sets isQuiz and requiresAIVerification', () => {
      mockScores = { structural: 30, pattern: 30, context: 5 };
      const result = scoreAndDecide(mockScores, mockDom);
      expect(result.isQuiz).toBe(true);
      expect(result.requiresAIVerification).toBe(true);
    });

    test('low confidence (<50) sets isQuiz to false', () => {
      mockScores = { structural: 10, pattern: 10, context: 5 };
      const result = scoreAndDecide(mockScores, mockDom);
      expect(result.isQuiz).toBe(false);
      expect(result.requiresAIVerification).toBe(false);
    });

    test('boundary: exactly 80 is high confidence', () => {
      mockScores = { structural: 40, pattern: 40, context: 0 };
      const result = scoreAndDecide(mockScores, mockDom);
      expect(result.confidence).toBe(80);
      expect(result.isQuiz).toBe(true);
      expect(result.requiresAIVerification).toBe(false);
    });

    test('boundary: exactly 50 is medium confidence', () => {
      mockScores = { structural: 25, pattern: 25, context: 0 };
      const result = scoreAndDecide(mockScores, mockDom);
      expect(result.confidence).toBe(50);
      expect(result.isQuiz).toBe(true);
      expect(result.requiresAIVerification).toBe(true);
    });
  });

  describe('return value structure', () => {
    test('returns DetectionResult object', () => {
      const result = scoreAndDecide(mockScores, mockDom);
      expect(result).toHaveProperty('isQuiz');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('quizType');
      expect(result).toHaveProperty('questions');
      expect(result).toHaveProperty('requiresAIVerification');
      expect(result).toHaveProperty('scores');
    });

    test('includes all layer scores', () => {
      mockScores = { structural: 20, pattern: 15, context: 5 };
      const result = scoreAndDecide(mockScores, mockDom);
      expect(result.scores.structural).toBe(20);
      expect(result.scores.pattern).toBe(15);
      expect(result.scores.context).toBe(5);
    });

    test('questions is array', () => {
      const result = scoreAndDecide(mockScores, mockDom);
      expect(Array.isArray(result.questions)).toBe(true);
    });
  });
});

describe('identifyQuizType', () => {
  let mockDom;

  beforeEach(() => {
    mockDom = {
      body: {
        innerText: ''
      },
      querySelectorAll: jest.fn(() => [])
    };
  });

  describe('quiz type detection', () => {
    test('identifies MCQ (default)', () => {
      mockDom.body.innerText = 'Select an option';
      mockDom.querySelectorAll.mockReturnValue([]);
      
      const result = identifyQuizType(mockDom);
      expect(result).toBe('mcq');
    });

    test('identifies true-false', () => {
      mockDom.body.innerText = 'True or False?';
      mockDom.querySelectorAll.mockImplementation((selector) => {
        if (selector === 'input[type="radio"]') return Array(2);
        return [];
      });
      
      const result = identifyQuizType(mockDom);
      expect(result).toBe('true-false');
    });

    test('identifies multiple-select', () => {
      mockDom.querySelectorAll.mockImplementation((selector) => {
        if (selector === 'input[type="checkbox"]') return Array(3);
        return [];
      });
      
      const result = identifyQuizType(mockDom);
      expect(result).toBe('multiple-select');
    });

    test('identifies fill-blank', () => {
      mockDom.querySelectorAll.mockImplementation((selector) => {
        if (selector === 'input[type="text"], textarea') return Array(3);
        if (selector === 'input[type="radio"]') return [];
        return [];
      });
      
      const result = identifyQuizType(mockDom);
      expect(result).toBe('fill-blank');
    });

    test('identifies short-answer', () => {
      mockDom.querySelectorAll.mockImplementation((selector) => {
        if (selector === 'textarea') return Array(2);
        return [];
      });
      
      const result = identifyQuizType(mockDom);
      expect(result).toBe('short-answer');
    });
  });

  describe('edge cases', () => {
    test('handles null DOM', () => {
      expect(() => identifyQuizType(null)).toThrow();
    });

    test('handles DOM without body', () => {
      expect(() => identifyQuizType({})).toThrow();
    });
  });
});

describe('extractQuestions', () => {
  let mockDom;

  beforeEach(() => {
    mockDom = {
      body: {
        innerText: ''
      },
      querySelectorAll: jest.fn(() => [])
    };
  });

  describe('question extraction', () => {
    test('returns empty array for no questions', () => {
      mockDom.querySelectorAll.mockReturnValue([]);
      
      const result = extractQuestions(mockDom);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test('extracts questions with options', () => {
      const mockQuestion = {
        innerText: 'What is 2+2?',
        querySelectorAll: jest.fn(() => [
          { value: 'A', nextElementSibling: { innerText: 'Option A' } },
          { value: 'B', nextElementSibling: { innerText: 'Option B' } }
        ])
      };
      
      mockDom.querySelectorAll.mockReturnValue([mockQuestion]);
      
      const result = extractQuestions(mockDom);
      expect(result.length).toBe(1);
      expect(result[0].questionText).toBe('What is 2+2?');
      expect(result[0].options.length).toBe(2);
    });

    test('skips questions without options', () => {
      const mockQuestion = {
        innerText: 'Question text',
        querySelectorAll: jest.fn(() => [])
      };
      
      mockDom.querySelectorAll.mockReturnValue([mockQuestion]);
      
      const result = extractQuestions(mockDom);
      expect(result.length).toBe(0);
    });

    test('assigns question numbers', () => {
      const mockQuestion1 = {
        innerText: 'Q1',
        querySelectorAll: jest.fn(() => [{ value: 'A' }])
      };
      const mockQuestion2 = {
        innerText: 'Q2',
        querySelectorAll: jest.fn(() => [{ value: 'B' }])
      };
      
      mockDom.querySelectorAll.mockReturnValue([mockQuestion1, mockQuestion2]);
      
      const result = extractQuestions(mockDom);
      expect(result[0].questionNumber).toBe(1);
      expect(result[1].questionNumber).toBe(2);
    });
  });

  describe('edge cases', () => {
    test('handles null DOM', () => {
      expect(() => extractQuestions(null)).toThrow();
    });

    test('handles DOM without body', () => {
      expect(() => extractQuestions({})).toThrow();
    });
  });
});

describe('QUIZ_TYPES constant', () => {
  test('exports QUIZ_TYPES object', () => {
    expect(typeof QUIZ_TYPES).toBe('object');
  });

  test('includes all quiz types', () => {
    expect(QUIZ_TYPES.MCQ).toBe('mcq');
    expect(QUIZ_TYPES.TRUE_FALSE).toBe('true-false');
    expect(QUIZ_TYPES.FILL_BLANK).toBe('fill-blank');
    expect(QUIZ_TYPES.SHORT_ANSWER).toBe('short-answer');
    expect(QUIZ_TYPES.MULTIPLE_SELECT).toBe('multiple-select');
  });
});
