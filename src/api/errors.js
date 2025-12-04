/**
 * API Error Classes
 * Custom error types for API operations
 */

export class APIError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.details = details;
  }
}

export class TimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class ParseError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'ParseError';
    this.originalError = originalError;
  }
}
