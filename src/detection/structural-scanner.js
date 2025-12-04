/**
 * Structural Scan Detection Layer
 * Layer 1 of the 4-layer detection algorithm
 * Identifies quiz-like DOM structures using CSS selectors
 */

export const STRUCTURAL_MAX_SCORE = 40;

/**
 * Scans DOM for structural patterns indicative of quizzes
 * Uses CSS selectors for performance (XPath only if needed)
 * 
 * @param {Document} dom - The DOM to scan
 * @returns {number} Score from 0-40 indicating quiz-like structure
 * 
 * Scoring breakdown:
 * - Forms: 0-10 points (2 forms = 10 points max)
 * - Radio/Checkbox inputs: 0-15 points (8 inputs = 15 points max)
 * - Submit buttons: 0-10 points (2 buttons = 10 points max)
 * - Textareas: 0-5 points (3 textareas = 5 points max)
 * Total: 0-40 points
 */
export function structuralScan(dom) {
  if (!dom) {
    throw new Error('DOM is required for structural scan');
  }

  let score = 0;

  try {
    // Layer 1a: Find forms (0-10 points)
    // Forms are common containers for quiz questions
    const forms = dom.querySelectorAll('form');
    score += Math.min(forms.length * 5, 10);

    // Layer 1b: Find input groups (0-15 points)
    // Radio buttons and checkboxes are typical for multiple choice questions
    const radioButtons = dom.querySelectorAll('input[type="radio"]');
    const checkboxes = dom.querySelectorAll('input[type="checkbox"]');
    const inputCount = radioButtons.length + checkboxes.length;
    score += Math.min(inputCount * 2, 15);

    // Layer 1c: Find submit buttons (0-10 points)
    // Submit/next buttons are typical for quiz navigation
    const submitButtons = dom.querySelectorAll('button[type="submit"], input[type="submit"]');
    score += Math.min(submitButtons.length * 5, 10);

    // Layer 1d: Find textareas (0-5 points)
    // Textareas are used for short answer or essay questions
    const textareas = dom.querySelectorAll('textarea');
    score += Math.min(textareas.length * 2, 5);

    // Cap at maximum score
    return Math.min(score, STRUCTURAL_MAX_SCORE);
  } catch (error) {
    console.error('Error during structural scan:', error);
    throw error;
  }
}

/**
 * Detailed structural analysis (for debugging/logging)
 * Returns breakdown of detected elements
 * 
 * @param {Document} dom - The DOM to analyze
 * @returns {Object} Detailed breakdown of structural elements
 */
export function analyzeStructure(dom) {
  if (!dom) {
    throw new Error('DOM is required for structural analysis');
  }

  try {
    const forms = dom.querySelectorAll('form');
    const radioButtons = dom.querySelectorAll('input[type="radio"]');
    const checkboxes = dom.querySelectorAll('input[type="checkbox"]');
    const submitButtons = dom.querySelectorAll('button[type="submit"], input[type="submit"]');
    const textareas = dom.querySelectorAll('textarea');

    return {
      forms: forms.length,
      radioButtons: radioButtons.length,
      checkboxes: checkboxes.length,
      submitButtons: submitButtons.length,
      textareas: textareas.length,
      totalInputs: radioButtons.length + checkboxes.length,
      score: structuralScan(dom)
    };
  } catch (error) {
    console.error('Error during structural analysis:', error);
    throw error;
  }
}
