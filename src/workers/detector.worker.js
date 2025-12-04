/**
 * Web Worker for Quiz Detection
 * Runs detection algorithm in parallel without blocking main thread
 * 
 * Receives: DOM snapshot
 * Returns: Detection results (isQuiz, confidence, quizType, etc.)
 */

import { structuralScan } from '../detection/structural-scanner.js';

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

    // Run structural scan (Layer 1)
    const structuralScore = structuralScan(doc);

    // Send results back to main thread
    self.postMessage({
      success: true,
      structuralScore,
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
