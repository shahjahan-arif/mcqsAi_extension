/**
 * Confidence Scoring and Decision Logic
 * Layer 4 of the 4-layer detection algorithm
 * Combines all detection layers and makes final quiz determination
 */

import { QUIZ_TYPES, CONFIDENCE_THRESHOLDS, MAX_SCORES } from './types.js';

/**
 * Combines detection layer scores and makes quiz determination
 * 
 * @param {Object} scores - Detection scores from all layers
 * @param {number} scores.structural - Structural scan score (0-40)
 * @param {number} scores.pattern - Pattern matching score (0-40)
 * @param {number} scores.context - Context analysis score (0-20)
 * @param {Document} dom - The DOM to analyze
 * @returns {Object} DetectionResult with quiz determination and details
 */
export function scoreAndDecide(scores, dom) {
  if (!scores || !dom || !dom.body) {
    throw new Error('Scores and DOM with body are required for scoring');
  }

  try {
    // Calculate total confidence
    const totalScore = scores.structural + scores.pattern + scores.context;
    const confidence = Math.round((totalScore / MAX_SCORES.TOTAL) * 100);

    // Apply decision thresholds
    let isQuiz = false;
    let requiresAIVerification = false;

    if (confidence > CONFIDENCE_THRESHOLDS.HIGH) {
      // High confidence: proceed with answer generation
      isQuiz = true;
      requiresAIVerification = false;
    } else if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM && confidence <= CONFIDENCE_THRESHOLDS.HIGH) {
      // Medium confidence: request AI verification
      isQuiz = true;
      requiresAIVerification = true;
    } else {
      // Low confidence: not a quiz
      isQuiz = false;
      requiresAIVerification = false;
    }

    // Identify quiz type
    const quizType = identifyQuizType(dom);

    // Extract questions
    const questions = extractQuestions(dom);

    return {
      isQuiz,
      confidence,
      quizType,
      questions,
      requiresAIVerification,
      scores: {
        structural: scores.structural,
        pattern: scores.pattern,
        context: scores.context
      }
    };
  } catch (error) {
    console.error('Error during scoring and decision:', error);
    throw error;
  }
}

/**
 * Identifies the type of quiz based on DOM structure and content
 * 
 * @param {Document} dom - The DOM to analyze
 * @returns {string} Quiz type: 'mcq', 'true-false', 'fill-blank', 'short-answer', 'multiple-select'
 */
export function identifyQuizType(dom) {
  if (!dom || !dom.body) {
    throw new Error('DOM with body is required for quiz type identification');
  }

  try {
    const textContent = dom.body.innerText.toLowerCase();

    // Check for multiple select (checkboxes)
    const checkboxes = dom.querySelectorAll('input[type="checkbox"]');
    if (checkboxes.length > 0) {
      return QUIZ_TYPES.MULTIPLE_SELECT;
    }

    // Check for short answer (textareas)
    const textareas = dom.querySelectorAll('textarea');
    if (textareas.length > 0) {
      return QUIZ_TYPES.SHORT_ANSWER;
    }

    // Check for fill-in-blank (text inputs without radio buttons)
    const textInputs = dom.querySelectorAll('input[type="text"]');
    const radioButtons = dom.querySelectorAll('input[type="radio"]');
    if (textInputs.length > 0 && radioButtons.length === 0) {
      return QUIZ_TYPES.FILL_BLANK;
    }

    // Check for true/false (limited radio buttons with true/false text)
    if (radioButtons.length > 0 && radioButtons.length <= 10 && /(true|false)/gi.test(textContent)) {
      return QUIZ_TYPES.TRUE_FALSE;
    }

    // Default to MCQ (multiple choice with radio buttons)
    return QUIZ_TYPES.MCQ;
  } catch (error) {
    console.error('Error during quiz type identification:', error);
    throw error;
  }
}

/**
 * Extracts question elements and their options from the DOM
 * 
 * @param {Document} dom - The DOM to analyze
 * @returns {Array} Array of QuestionElement objects
 */
export function extractQuestions(dom) {
  if (!dom || !dom.body) {
    throw new Error('DOM with body is required for question extraction');
  }

  try {
    const questions = [];

    // Find question containers (usually divs with question class/id)
    const questionElements = dom.querySelectorAll('[class*="question"], [id*="question"]');

    questionElements.forEach((element, index) => {
      const questionText = element.innerText?.trim();

      if (!questionText) {
        return; // Skip empty questions
      }

      // Extract options for this question
      const options = extractOptions(element);

      // Only include questions that have options
      if (options.length > 0) {
        questions.push({
          element,
          questionText,
          options,
          questionNumber: questions.length + 1
        });
      }
    });

    return questions;
  } catch (error) {
    console.error('Error during question extraction:', error);
    throw error;
  }
}

/**
 * Extracts options from a question element
 * 
 * @param {HTMLElement} questionElement - The question element to analyze
 * @returns {Array} Array of OptionElement objects
 */
export function extractOptions(questionElement) {
  const options = [];

  try {
    // Look for radio buttons or checkboxes
    const inputs = questionElement.querySelectorAll('input[type="radio"], input[type="checkbox"]');

    inputs.forEach((input) => {
      // Try to find associated label
      let optionText = input.value;

      // Check for next sibling (common pattern)
      if (input.nextElementSibling?.innerText) {
        optionText = input.nextElementSibling.innerText.trim();
      }
      // Check for parent element text
      else if (input.parentElement?.innerText) {
        optionText = input.parentElement.innerText.trim();
      }

      if (optionText) {
        options.push({
          element: input,
          text: optionText
        });
      }
    });

    return options;
  } catch (error) {
    console.error('Error during option extraction:', error);
    return [];
  }
}

export { QUIZ_TYPES, CONFIDENCE_THRESHOLDS, MAX_SCORES };
