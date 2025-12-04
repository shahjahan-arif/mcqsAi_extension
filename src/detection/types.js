/**
 * Type Definitions for Detection Engine
 * JSDoc type definitions for detection results and components
 */

/**
 * @typedef {Object} DetectionResult
 * @property {boolean} isQuiz - Whether the page contains a quiz
 * @property {number} confidence - Confidence score 0-100
 * @property {string} quizType - Type of quiz detected
 * @property {QuestionElement[]} questions - Extracted questions
 * @property {boolean} requiresAIVerification - Whether AI verification is needed
 * @property {Object} scores - Individual layer scores
 * @property {number} scores.structural - Structural scan score (0-40)
 * @property {number} scores.pattern - Pattern matching score (0-40)
 * @property {number} scores.context - Context analysis score (0-20)
 */

/**
 * @typedef {Object} QuestionElement
 * @property {HTMLElement} element - The DOM element containing the question
 * @property {string} questionText - The question text
 * @property {OptionElement[]} options - Available options/answers
 * @property {number} questionNumber - Sequential question number
 */

/**
 * @typedef {Object} OptionElement
 * @property {HTMLElement} element - The DOM element for the option
 * @property {string} text - The option text
 */

/**
 * @typedef {Object} DetectionScores
 * @property {number} structural - Structural scan score (0-40)
 * @property {number} pattern - Pattern matching score (0-40)
 * @property {number} context - Context analysis score (0-20)
 */

export const QUIZ_TYPES = {
  MCQ: 'mcq',
  TRUE_FALSE: 'true-false',
  FILL_BLANK: 'fill-blank',
  SHORT_ANSWER: 'short-answer',
  MULTIPLE_SELECT: 'multiple-select'
};

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 80,      // > 80: High confidence
  MEDIUM: 50,    // 50-80: Medium confidence
  LOW: 50        // < 50: Not a quiz
};

export const MAX_SCORES = {
  STRUCTURAL: 40,
  PATTERN: 40,
  CONTEXT: 20,
  TOTAL: 100
};
