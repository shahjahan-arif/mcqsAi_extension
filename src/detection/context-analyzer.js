/**
 * Context Analysis Detection Layer
 * Layer 3 of the 4-layer detection algorithm
 * Identifies contextual clues indicating quizzes
 */

export const CONTEXT_MAX_SCORE = 20;

export const QUIZ_KEYWORDS = ['quiz', 'exam', 'test', 'assessment', 'questionnaire'];

/**
 * Scans DOM for contextual indicators of quizzes
 * Looks for keywords, timers, progress bars, and ARIA labels
 * 
 * @param {Document} dom - The DOM to scan
 * @returns {number} Score from 0-20 indicating quiz-like context
 * 
 * Scoring breakdown:
 * - Keywords: 0-15 points (3 points per keyword, max 15)
 * - Timer elements: 0-5 points (2 points per element, max 5)
 * - Progress bars: 0-5 points (2 points per element, max 5)
 * - ARIA labels: 0-5 points (1 point per element, max 5)
 * Total: 0-20 points
 */
export function contextAnalysis(dom) {
  if (!dom || !dom.body) {
    throw new Error('DOM with body is required for context analysis');
  }

  let score = 0;

  try {
    const pageText = dom.body.innerText.toLowerCase();

    // Layer 3a: Detect quiz-related keywords (0-15 points)
    // Keywords like "quiz", "exam", "test" are strong contextual indicators
    let keywordCount = 0;
    QUIZ_KEYWORDS.forEach(keyword => {
      const regex = new RegExp(keyword, 'g');
      const matches = pageText.match(regex) || [];
      keywordCount += matches.length;
    });
    score += Math.min(keywordCount * 0.5, 15);

    // Layer 3b: Detect timer elements (0-5 points)
    // Timers are common in quiz interfaces for time-limited questions
    const timerElements = dom.querySelectorAll('[class*="timer"], [id*="timer"]');
    score += Math.min(timerElements.length * 2, 5);

    // Layer 3c: Detect progress bars (0-5 points)
    // Progress indicators show quiz progress through questions
    const progressBars = dom.querySelectorAll('progress, [class*="progress"], [role="progressbar"]');
    score += Math.min(progressBars.length * 2, 5);

    // Layer 3d: Analyze ARIA labels (0-5 points)
    // ARIA labels provide accessibility hints about quiz structure
    const ariaRadioGroups = dom.querySelectorAll('[role="radiogroup"]');
    const ariaGroups = dom.querySelectorAll('[role="group"]');
    const ariaQuestions = dom.querySelectorAll('[aria-label*="question"], [aria-labelledby*="question"]');
    const ariaCount = ariaRadioGroups.length + ariaGroups.length + ariaQuestions.length;
    score += Math.min(ariaCount * 1, 5);

    // Cap at maximum score
    return Math.min(score, CONTEXT_MAX_SCORE);
  } catch (error) {
    console.error('Error during context analysis:', error);
    throw error;
  }
}

/**
 * Detailed context analysis (for debugging/logging)
 * Returns breakdown of detected contextual elements
 * 
 * @param {Document} dom - The DOM to analyze
 * @returns {Object} Detailed breakdown of contextual elements
 */
export function analyzeContext(dom) {
  if (!dom || !dom.body) {
    throw new Error('DOM with body is required for context analysis');
  }

  try {
    const pageText = dom.body.innerText.toLowerCase();

    // Count keywords
    let keywordCount = 0;
    QUIZ_KEYWORDS.forEach(keyword => {
      const regex = new RegExp(keyword, 'g');
      const matches = pageText.match(regex) || [];
      keywordCount += matches.length;
    });

    // Count elements
    const timerElements = dom.querySelectorAll('[class*="timer"], [id*="timer"]');
    const progressBars = dom.querySelectorAll('progress, [class*="progress"], [role="progressbar"]');
    const ariaRadioGroups = dom.querySelectorAll('[role="radiogroup"]');
    const ariaGroups = dom.querySelectorAll('[role="group"]');
    const ariaQuestions = dom.querySelectorAll('[aria-label*="question"], [aria-labelledby*="question"]');
    const ariaCount = ariaRadioGroups.length + ariaGroups.length + ariaQuestions.length;

    return {
      keywords: keywordCount,
      timerElements: timerElements.length,
      progressBars: progressBars.length,
      ariaElements: ariaCount,
      score: contextAnalysis(dom)
    };
  } catch (error) {
    console.error('Error during context analysis:', error);
    throw error;
  }
}
