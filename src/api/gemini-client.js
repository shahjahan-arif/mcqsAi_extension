/**
 * Gemini 1.5 Flash API Client
 * Handles communication with Google's Gemini API for answer generation
 */

import { APIError, TimeoutError, ParseError } from './errors.js';

export const GEMINI_CONFIG = {
  endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
  timeout: 5000,
  maxRetries: 2,
  retryDelays: [1000, 2000]
};

/**
 * GeminiClient manages API communication with Gemini 1.5 Flash
 */
export class GeminiClient {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = apiKey;
    this.endpoint = GEMINI_CONFIG.endpoint;
    this.timeout = GEMINI_CONFIG.timeout;
    this.maxRetries = GEMINI_CONFIG.maxRetries;
  }

  /**
   * Gets an answer from Gemini for a quiz question
   * Implements retry logic with exponential backoff
   * 
   * @param {string} question - The quiz question
   * @param {string} context - Optional context for the question
   * @returns {Promise<Object>} AIResponse with answer, confidence, explanation, error
   */
  async getAnswer(question, context = null) {
    if (!question || typeof question !== 'string') {
      throw new Error('Question must be a non-empty string');
    }

    const prompt = this.buildPrompt(question, context);

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.callAPI(prompt);
        return this.parseResponse(response);
      } catch (error) {
        if (attempt === this.maxRetries) {
          throw error;
        }

        // Retry with exponential backoff
        const delay = GEMINI_CONFIG.retryDelays[attempt];
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Builds the prompt for the API call
   * 
   * @param {string} question - The quiz question
   * @param {string} context - Optional context
   * @returns {string} Formatted prompt
   */
  buildPrompt(question, context) {
    let prompt = `Answer this quiz question concisely:\n\n${question}`;

    if (context) {
      prompt += `\n\nContext: ${context}`;
    }

    prompt += '\n\nProvide only the answer, no explanation.';
    return prompt;
  }

  /**
   * Makes the actual API call to Gemini
   * Implements timeout handling
   * 
   * @param {string} prompt - The prompt to send
   * @returns {Promise<Object>} API response
   */
  async callAPI(prompt) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const details = await response.text();
        throw new APIError(
          `API Error: ${response.status}`,
          response.status,
          details
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new TimeoutError('API request timeout (5s)');
      }

      throw error;
    }
  }

  /**
   * Parses the API response
   * 
   * @param {Object} response - The API response
   * @returns {Object} Parsed AIResponse
   */
  parseResponse(response) {
    try {
      const content = response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        throw new Error('Invalid API response format');
      }

      return {
        answer: content.trim(),
        confidence: 85,
        explanation: null,
        error: null
      };
    } catch (error) {
      throw new ParseError('Failed to parse API response', error);
    }
  }
}
