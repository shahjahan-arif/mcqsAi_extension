/**
 * Detection Engine Exports
 * Central export point for all detection modules
 */

export { structuralScan, analyzeStructure, STRUCTURAL_MAX_SCORE } from './structural-scanner.js';
export { patternMatching, analyzePatterns, PATTERN_MAX_SCORE } from './pattern-matcher.js';
export { QUIZ_PATTERNS, COMPILED_PATTERNS } from './patterns.js';
