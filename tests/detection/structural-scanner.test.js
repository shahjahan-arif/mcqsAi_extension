import { structuralScan, STRUCTURAL_MAX_SCORE } from '../../src/detection/structural-scanner.js';

describe('structuralScan', () => {
  let mockDom;

  beforeEach(() => {
    // Create a mock DOM with querySelectorAll
    mockDom = {
      querySelectorAll: jest.fn(() => [])
    };
  });

  describe('scoring logic', () => {
    test('returns 0 for empty DOM', () => {
      const result = structuralScan(mockDom);
      expect(result).toBe(0);
    });

    test('scores forms correctly (max 10 points)', () => {
      mockDom.querySelectorAll.mockImplementation((selector) => {
        if (selector === 'form') return Array(3); // 3 forms
        return [];
      });
      
      const result = structuralScan(mockDom);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(10);
    });

    test('scores radio buttons and checkboxes correctly (max 15 points)', () => {
      mockDom.querySelectorAll.mockImplementation((selector) => {
        if (selector === 'input[type="radio"]') return Array(5);
        if (selector === 'input[type="checkbox"]') return Array(3);
        return [];
      });
      
      const result = structuralScan(mockDom);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(15);
    });

    test('scores submit buttons correctly (max 10 points)', () => {
      mockDom.querySelectorAll.mockImplementation((selector) => {
        if (selector === 'button[type="submit"], input[type="submit"]') return Array(3);
        return [];
      });
      
      const result = structuralScan(mockDom);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(10);
    });

    test('scores textareas correctly (max 5 points)', () => {
      mockDom.querySelectorAll.mockImplementation((selector) => {
        if (selector === 'textarea') return Array(4);
        return [];
      });
      
      const result = structuralScan(mockDom);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(5);
    });

    test('returns max score of 40', () => {
      mockDom.querySelectorAll.mockImplementation(() => Array(100));
      
      const result = structuralScan(mockDom);
      expect(result).toBe(STRUCTURAL_MAX_SCORE);
      expect(result).toBe(40);
    });

    test('combines all scores correctly', () => {
      mockDom.querySelectorAll.mockImplementation((selector) => {
        if (selector === 'form') return Array(2);
        if (selector === 'input[type="radio"]') return Array(4);
        if (selector === 'input[type="checkbox"]') return Array(2);
        if (selector === 'button[type="submit"], input[type="submit"]') return Array(1);
        if (selector === 'textarea') return Array(1);
        return [];
      });
      
      const result = structuralScan(mockDom);
      // 2*5 + (4+2)*2 + 1*5 + 1*2 = 10 + 12 + 5 + 2 = 29
      expect(result).toBe(29);
    });
  });

  describe('edge cases', () => {
    test('handles null DOM gracefully', () => {
      expect(() => structuralScan(null)).toThrow();
    });

    test('handles DOM with no matching elements', () => {
      const result = structuralScan(mockDom);
      expect(result).toBe(0);
    });

    test('handles very large number of elements', () => {
      mockDom.querySelectorAll.mockImplementation(() => Array(10000));
      
      const result = structuralScan(mockDom);
      expect(result).toBeLessThanOrEqual(STRUCTURAL_MAX_SCORE);
    });
  });

  describe('performance', () => {
    test('completes in less than 50ms', () => {
      mockDom.querySelectorAll.mockImplementation(() => Array(1000));
      
      const start = performance.now();
      structuralScan(mockDom);
      const end = performance.now();
      
      expect(end - start).toBeLessThan(50);
    });
  });

  describe('return value structure', () => {
    test('returns object with score property', () => {
      const result = structuralScan(mockDom);
      expect(typeof result).toBe('number');
    });

    test('score is always between 0 and 40', () => {
      mockDom.querySelectorAll.mockImplementation(() => Array(100));
      
      const result = structuralScan(mockDom);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(40);
    });
  });
});
