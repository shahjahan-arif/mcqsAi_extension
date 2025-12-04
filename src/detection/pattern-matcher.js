/**
 * Pattern Matching Detection Layer
 * Layer 2 of the 4-layer detection algorithm
 * Identifies textual and visual quiz patterns using regex
 */

import { QUIZ_PATTERNS } from './patterns.js';

export const PATTERN_MAX_SCORE = 40;

/**
 * Scans DOM text for pattern indicators of quizzes
 * Uses regex for text pattern matching
 * 
 * @param {Document} dom - The DOM to scan
 * @returns {number} Score from 0-40 indicating quiz-like text patterns
 * 
 * Scoring breakdown:
 * - Question marks: 0-10 points (5 marks = 10 points max)
 * - Option prefixes: 0-15 points (10 prefixes = 15 points max)
 * - Question patterns: 0-10 points (2 patterns = 10 points max)
 * - Keywords: 0-5 points (10 keywords = 5 points max)
 * Total: 0-40 points
 */
export function patternMatching(dom) {
  if (!dom || !dom.body) {
    throw new Error('DOM with body is required for pattern matching');
  }

  let score = 0;

  try {
    const textContent = dom.body.innerText;

    if (!textContent) {
      return 0;
    }

    // Layer 2a: Count question marks (0-10 points)
    // Question marks are strong indicators of quiz questions
    const questionMarks = (textContent.match(QUIZ_PATTERNS.questionMark) || []).length;
    score += Math.min(questionMarks * 2, 10);

    // Layer 2b: Count option prefixes (0-15 points)
    // A) B) C) D) or 1. 2. 3. 4. patterns are typical for multiple choice
    const optionPrefixes = (textContent.match(QUIZ_PATTERNS.optionPrefix) || []).length;
    score += Math.min(optionPrefixes * 1.5, 15);

    // Layer 2c: Find "Question X of Y" patterns (0-10 points)
    // This pattern is very specific to quiz interfaces
    const questionPatterns = (textContent.match(QUIZ_PATTERNS.questionPattern) || []).length;
    score += Math.min(questionPatterns * 5, 10);

    // Layer 2d: Count keywords (0-5 points)
    // Keywords like "select", "choose", "answer" are common in quiz interfaces
    let keywordCount = 0;
    QUIZ_PATTERNS.keywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = textContent.match(regex) || [];
      keywordCount += matches.length;
    });
    score += Math.min(keywordCount * 0.5, 5);

    // Cap at maximum score
    return Math.min(score, PATTERN_MAX_SCORE);
  } catch (error) {
    console.error('Error during pattern matching:', error);
    throw error;
  }
}

/**
 * Detailed pattern analysis (for debugging/logging)
 * Returns breakdown of detected patterns
 * 
 * @param {Document} dom - The DOM to analyze
 * @returns {Object} Detailed breakdown of detected patterns
 */
export function analyzePatterns(dom) {
  if (!dom || !dom.body) {
    throw new Error('DOM with body is required for pattern analysis');
  }

  try {
    const textContent = dom.body.innerText;

    const questionMarks = (textContent.match(QUIZ_PATTERNS.questionMark) || []).length;
    const optionPrefixes = (textContent.match(QUIZ_PATTERNS.optionPrefix) || []).length;
    const questionPatterns = (textContent.match(QUIZ_PATTERNS.questionPattern) || []).length;
    
    let keywordCount = 0;
    QUIZ_PATTERNS.keywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = textContent.match(regex) || [];
      keywordCount += matches.length;
    });

    return {
      questionMarks,
      optionPrefixes,
      questionPatterns,
      keywords: keywordCount,
      score: patternMatching(dom)
    };
  } catch (error) {
    console.error('Error during pattern analysis:', error);
    throw error;
  }
}
