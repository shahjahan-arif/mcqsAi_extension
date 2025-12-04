/**
 * Quiz Detection Regex Patterns
 * Centralized pattern definitions for all detection layers
 */

export const QUIZ_PATTERNS = {
  // Layer 2: Pattern Matching
  questionMark: /\?/g,
  optionPrefix: /^[A-D]\)|^\d\./gm,
  questionPattern: /Question\s+\d+\s+of\s+\d+/gi,
  keywords: ['select', 'choose', 'answer', 'submit', 'next'],
  timer: /\d+:\d+/g,
  
  // Layer 3: Context Analysis (for reference)
  quizKeywords: ['quiz', 'exam', 'test', 'assessment', 'questionnaire'],
  timerText: /time\s+remaining|timer|countdown/gi,
};

/**
 * Compile regex patterns for performance
 * Pre-compiled patterns are faster than creating new ones each time
 */
export const COMPILED_PATTERNS = {
  questionMark: QUIZ_PATTERNS.questionMark,
  optionPrefix: QUIZ_PATTERNS.optionPrefix,
  questionPattern: QUIZ_PATTERNS.questionPattern,
  timer: QUIZ_PATTERNS.timer,
  timerText: QUIZ_PATTERNS.timerText,
};
