/**
 * Detection Engine Exports
 * Central export point for all detection modules
 */

export { structuralScan, analyzeStructure, STRUCTURAL_MAX_SCORE } from './structural-scanner.js';
export { patternMatching, analyzePatterns, PATTERN_MAX_SCORE } from './pattern-matcher.js';
export { contextAnalysis, analyzeContext, CONTEXT_MAX_SCORE, QUIZ_KEYWORDS } from './context-analyzer.js';
export { scoreAndDecide, identifyQuizType, extractQuestions, extractOptions, QUIZ_TYPES, CONFIDENCE_THRESHOLDS, MAX_SCORES } from './scorer.js';
export { QUIZ_PATTERNS, COMPILED_PATTERNS } from './patterns.js';
export * from './types.js';
