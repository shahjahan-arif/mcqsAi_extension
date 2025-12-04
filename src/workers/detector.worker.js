/**
 * Web Worker for Quiz Detection
 * Runs complete 4-layer detection algorithm in parallel without blocking main thread
 * 
 * Receives: DOM snapshot
 * Returns: Complete DetectionResult with quiz determination
 */

import { structuralScan } from '../detection/structural-scanner.js';
import { patternMatching } from '../detection/pattern-matcher.js';
import { contextAnalysis } from '../detection/context-analyzer.js';
import { scoreAndDecide } from '../detection/scorer.js';

/**
 * Handle messages from main thread
 * Expected message format: { dom: domSnapshot }
 */
self.onmessage = (event) => {
  try {
    const { dom: domSnapshot } = event.data;

    if (!domSnapshot) {
      throw new Error('DOM snapshot is required');
    }

    // Recreate DOM from snapshot
    const parser = new DOMParser();
    const doc = parser.parseFromString(domSnapshot.html, 'text/html');

    // Run all detection layers
    const structuralScore = structuralScan(doc);
    const patternScore = patternMatching(doc);
    const contextScore = contextAnalysis(doc);

    // Combine scores and make decision
    const scores = {
      structural: structuralScore,
      pattern: patternScore,
      context: contextScore
    };

    const detectionResult = scoreAndDecide(scores, doc);

    // Send complete result back to main thread
    self.postMessage({
      success: true,
      result: detectionResult,
      timestamp: Date.now()
    });
  } catch (error) {
    // Send error back to main thread
    self.postMessage({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: Date.now()
    });
  }
};

/**
 * Handle errors in worker
 */
self.onerror = (error) => {
  console.error('Worker error:', error);
  self.postMessage({
    success: false,
    error: error.message,
    stack: error.stack
  });
};
