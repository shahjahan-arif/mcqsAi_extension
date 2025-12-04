# Story 2.2: Implement Gemini API Integration

Status: ready-for-dev

## Story

As a developer,
I want to implement the Gemini 1.5 Flash API integration,
So that the system can call the AI API to generate answers.

## Acceptance Criteria

1. **Given** a quiz question and optional context
   **When** the API integration calls Gemini
   **Then** it sends POST request to Gemini 1.5 Flash endpoint

2. **And** it includes question text in request body

3. **And** it authenticates using API key from settings

4. **And** it implements 5-second timeout

5. **And** it implements retry logic: 2 attempts with exponential backoff

6. **And** it returns AIResponse with: answer, confidence, explanation, error

7. **And** it handles errors gracefully: timeout, rate limit, auth failure

## Technical Implementation

**Component:** `GeminiClient` class

**API Configuration:**
```javascript
const GEMINI_CONFIG = {
  endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  timeout: 5000,
  maxRetries: 2,
  retryDelays: [1000, 2000] // exponential backoff
};
```

**Implementation:**

```javascript
class GeminiClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.endpoint = GEMINI_CONFIG.endpoint;
    this.timeout = GEMINI_CONFIG.timeout;
    this.maxRetries = GEMINI_CONFIG.maxRetries;
  }

  async getAnswer(question, context = null) {
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

  buildPrompt(question, context) {
    let prompt = `Answer this quiz question concisely:\n\n${question}`;
    
    if (context) {
      prompt += `\n\nContext: ${context}`;
    }
    
    prompt += '\n\nProvide only the answer, no explanation.';
    return prompt;
  }

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
        throw new APIError(
          `API Error: ${response.status}`,
          response.status,
          await response.text()
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

  parseResponse(response) {
    try {
      const content = response.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('Invalid API response format');
      }
      
      return {
        answer: content.trim(),
        confidence: 85, // Default confidence for Gemini responses
        explanation: null,
        error: null
      };
    } catch (error) {
      throw new ParseError('Failed to parse API response', error);
    }
  }
}

// Error classes
class APIError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.details = details;
  }
}

class TimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TimeoutError';
  }
}

class ParseError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'ParseError';
    this.originalError = originalError;
  }
}
```

**Usage:**

```javascript
const client = new GeminiClient(apiKey);

try {
  const result = await client.getAnswer('What is 2+2?');
  console.log(result); // { answer: '4', confidence: 85, explanation: null, error: null }
} catch (error) {
  if (error instanceof TimeoutError) {
    console.error('Request timed out');
  } else if (error instanceof APIError) {
    console.error(`API Error: ${error.status}`);
  } else {
    console.error('Unknown error:', error);
  }
}
```

## Tasks / Subtasks

- [ ] Create API client module: `src/api/gemini-client.js`
  - [ ] Implement GeminiClient class
  - [ ] Implement API call logic
  - [ ] Implement response parsing
  - [ ] Implement error handling

- [ ] Create error classes: `src/api/errors.js`
  - [ ] APIError class
  - [ ] TimeoutError class
  - [ ] ParseError class

- [ ] Create unit tests: `tests/api/gemini-client.test.js`
  - [ ] Test API calls with mock responses
  - [ ] Test timeout handling
  - [ ] Test retry logic
  - [ ] Test error handling

- [ ] Integration tests
  - [ ] Test with real Gemini API (optional)
  - [ ] Test various question types
  - [ ] Test error scenarios

## Dev Notes

**Architecture Reference:** [Source: docs/architecture.md#AD-003: Gemini 1.5 Flash as Primary AI Backend]

**API Configuration:**
- Endpoint: Gemini 1.5 Flash
- Timeout: 5 seconds
- Max retries: 2
- Retry delays: 1s, 2s (exponential backoff)

**Request Format:**
```json
{
  "contents": [{
    "parts": [{
      "text": "Question text here"
    }]
  }]
}
```

**Response Format:**
```json
{
  "candidates": [{
    "content": {
      "parts": [{
        "text": "Answer text here"
      }]
    }
  }]
}
```

**Performance Targets:**
- Response time: 500-1000ms average
- Timeout: 5 seconds
- Retry overhead: <2 seconds

**Testing Standards:**
- Unit tests with mocked API
- Integration tests with real API (optional)
- Error scenario testing
- Performance benchmarks

**Source Tree Components:**
- `src/api/gemini-client.js` - API client
- `src/api/errors.js` - Error classes
- `src/api/index.js` - Exports
- `tests/api/gemini-client.test.js` - Tests

## Project Structure Notes

**Module Exports:**
```javascript
// src/api/index.js
export { GeminiClient } from './gemini-client.js';
export { APIError, TimeoutError, ParseError } from './errors.js';
```

**API Key Management:**
- Stored in chrome.storage.local (encrypted by browser)
- User provides their own API key in settings
- Never hardcoded or logged

## References

- [Architecture: AD-003 - Gemini 1.5 Flash as Primary AI Backend](docs/architecture.md#ad-003-gemini-15-flash-as-primary-ai-backend)
- [Architecture: API Integration](docs/architecture.md#api-integration)
- [Epic 2: AI Integration & Caching](docs/epics.md#epic-2-ai-integration--caching---answer-generation)

## Dev Agent Record

### Context Reference

Story context: docs/sprint-artifacts/2-2-implement-gemini-api-integration.md

### Agent Model Used

Claude 3.5 Sonnet

### Completion Notes

- [ ] Code review completed
- [ ] Tests passing (100% coverage)
- [ ] Error handling verified
- [ ] Timeout handling tested
- [ ] Retry logic verified
- [ ] Ready for Story 2.3 (Cache-First Retrieval)

### File List

- src/api/gemini-client.js
- src/api/errors.js
- src/api/index.js
- tests/api/gemini-client.test.js
