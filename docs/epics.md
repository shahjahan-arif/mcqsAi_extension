# mcqsAi_extension - Epic Breakdown

**Author:** Paytohash
**Date:** 2025-12-04
**Project Level:** MVP
**Target Scale:** Universal Quiz Detection

---

## Overview

This document provides the complete epic and story breakdown for mcqsAi_extension, decomposing the requirements from the Architecture into implementable stories.

The extension enables universal quiz detection across any platform and provides AI-powered answer generation with smart caching.

---

## Functional Requirements Inventory

**FR1:** Universal Quiz Detection - Detect quizzes on any platform without platform-specific code
**FR2:** Multi-Format Support - Support MCQ, True/False, Fill-in-blank, Short answer, Multiple select
**FR3:** Pattern-Based Detection - Use structural, textual, behavioral, and visual patterns
**FR4:** Confidence Scoring - Provide 0-100 confidence scores with decision thresholds
**FR5:** AI Answer Generation - Integrate Gemini 1.5 Flash API for real-time answer retrieval
**FR6:** Confidence Indication - Display confidence levels with answers
**FR7:** Smart Caching - IndexedDB-based local storage with 70-80% cache hit rate
**FR8:** Copy Protection Bypass - Enable copy functionality on protected quiz pages
**FR9:** Adaptive Performance - Desktop mode (full detection) vs Mobile mode (speed-optimized)
**FR10:** Device Detection - Automatic device and battery level detection
**FR11:** Web Workers - Parallel processing for non-blocking detection
**FR12:** Answer Display - Display answers near question heading with interactive tooltips
**FR13:** Explanation Display - Optional explanation display with answers
**FR14:** Wrong Answer Reporting - User-controlled feedback mechanism
**FR15:** User Training Mode - Users can manually mark quizzes to train the system
**FR16:** Pattern Extraction - Extract and store patterns from marked areas
**FR17:** Personalized Detection - Improve detection over time with user training
**FR18:** Rate Limiting Compliance - Handle Gemini free tier limits (15 req/min, 1500 req/day)
**FR19:** Request Queuing - Queue requests at 1-2 per second
**FR20:** User Notification - Notify users on rate limit

---

## FR Coverage Map

| FR | Epic | Story | Status |
|----|------|-------|--------|
| FR1-FR4 | Epic 1 | 1.1-1.4 | Foundation |
| FR5-FR7 | Epic 2 | 2.1-2.3 | AI Integration |
| FR8-FR11 | Epic 3 | 3.1-3.3 | Performance |
| FR12-FR14 | Epic 4 | 4.1-4.2 | User Interface |
| FR15-FR17 | Epic 5 | 5.1-5.2 | Learning System |
| FR18-FR20 | Epic 2 | 2.4-2.5 | Rate Limiting |

---

## Epic 1: Foundation - Universal Detection Engine

**Epic Goal:** Build the core detection engine that identifies quizzes on any platform using pattern-based analysis. This foundation enables all subsequent features and delivers the core value proposition: universal quiz detection without platform-specific code.

**User Value:** Users can have quizzes automatically detected on any website they visit, without needing to configure anything per-platform.

**Technical Context:** Implements AD-001 (Universal Pattern-Based Detection Architecture) with 4-layer scoring system (Structural, Pattern, Context, Confidence).

---

### Story 1.1: Implement Structural Scan Detection Layer

As a developer,
I want to implement the structural scan layer of the detection algorithm,
So that the system can identify quiz-like DOM structures.

**Acceptance Criteria:**

**Given** a web page with various HTML elements
**When** the structural scan runs
**Then** it identifies forms, input groups, radio buttons, checkboxes, and submit buttons
**And** it scores the structural similarity to quiz patterns (0-40 points)
**And** it returns a score indicating quiz-like structure

**Technical Implementation:**

- Scan for `<form>` elements and input groups
- Identify radio button/checkbox clusters using CSS selectors: `input[type="radio"]`, `input[type="checkbox"]`
- Locate submit/next buttons: `button[type="submit"]`, `input[type="submit"]`
- Count quiz-like structural patterns
- Return score 0-40 based on pattern density
- Use CSS selectors for performance (XPath only if needed)
- Run in Web Worker to avoid blocking main thread

**Prerequisites:** None (Foundation story)

**Technical Notes:**
- Architecture Section 4: Detection Algorithm (Layer 1)
- Use querySelector/querySelectorAll for CSS selectors
- Implement in Web Worker for non-blocking execution
- Target: <50ms execution time

---

### Story 1.2: Implement Pattern Matching Detection Layer

As a developer,
I want to implement the pattern matching layer of the detection algorithm,
So that the system can identify textual and visual quiz patterns.

**Acceptance Criteria:**

**Given** a web page with text content
**When** the pattern matching layer runs
**Then** it detects question marks (?) in text
**And** it identifies option prefixes: A) B) C) D) or 1. 2. 3. 4.
**And** it finds "Question X of Y" text patterns
**And** it scores textual patterns (0-40 points)
**And** it returns a score indicating quiz-like text patterns

**Technical Implementation:**

- Scan all text nodes for question marks (?)
- Detect option prefix patterns using regex: `/^[A-D]\)|^\d\./`
- Find "Question X of Y" patterns: `/Question\s+\d+\s+of\s+\d+/i`
- Detect keywords: "Select", "Choose", "Answer"
- Detect timer text patterns
- Return score 0-40 based on pattern matches
- Use regex for text matching
- Run in Web Worker

**Prerequisites:** Story 1.1 (Structural Scan)

**Technical Notes:**
- Architecture Section 4: Detection Algorithm (Layer 2)
- Use regex for text pattern matching
- Implement in Web Worker
- Target: <50ms execution time

---

### Story 1.3: Implement Context Analysis Detection Layer

As a developer,
I want to implement the context analysis layer of the detection algorithm,
So that the system can identify contextual clues indicating quizzes.

**Acceptance Criteria:**

**Given** a web page with various elements
**When** the context analysis layer runs
**Then** it identifies quiz-related keywords in page content
**And** it detects timer elements
**And** it finds progress bars and indicators
**And** it analyzes ARIA labels for accessibility hints
**And** it scores contextual clues (0-20 points)
**And** it returns a score indicating quiz-like context

**Technical Implementation:**

- Scan for quiz-related keywords: "quiz", "exam", "test", "assessment"
- Detect timer elements: `<div>` with text matching `/\d+:\d+/` or "time remaining"
- Find progress bars: `<progress>`, `<div class="*progress*">`
- Analyze ARIA labels: `[role="radiogroup"]`, `[role="group"]`, `[aria-label*="question"]`
- Return score 0-20 based on contextual matches
- Run in Web Worker

**Prerequisites:** Story 1.1 (Structural Scan)

**Technical Notes:**
- Architecture Section 4: Detection Algorithm (Layer 3)
- Use ARIA attributes for accessibility detection
- Implement in Web Worker
- Target: <50ms execution time

---

### Story 1.4: Implement Confidence Scoring and Decision Logic

As a developer,
I want to implement the confidence scoring system and decision logic,
So that the system can determine if a page contains a quiz with appropriate confidence thresholds.

**Acceptance Criteria:**

**Given** scores from all three detection layers (Structural, Pattern, Context)
**When** the confidence scoring runs
**Then** it calculates total confidence: (Structural + Pattern + Context) / 100
**And** it applies decision thresholds:
  - Score > 80%: High confidence (proceed with answer generation)
  - Score 50-80%: Medium confidence (request AI verification)
  - Score < 50%: Not a quiz (skip)
**And** it returns a DetectionResult with isQuiz, confidence, quizType, questions array
**And** it identifies quiz type: 'mcq', 'true-false', 'fill-blank', 'short-answer', 'multiple-select'

**Technical Implementation:**

- Combine scores from layers 1-3
- Calculate total confidence percentage
- Apply threshold logic
- Identify quiz type based on detected patterns
- Extract question elements and options
- Return structured DetectionResult object
- Run in Web Worker

**Prerequisites:** Stories 1.1, 1.2, 1.3 (All detection layers)

**Technical Notes:**
- Architecture Section 4: Detection Algorithm (Confidence Threshold)
- Implement in Web Worker
- Return DetectionResult interface with: isQuiz, confidence, quizType, questions[]
- Target: <200ms total detection time (desktop), <100ms (mobile)

---

## Epic 2: AI Integration & Caching - Answer Generation

**Epic Goal:** Integrate Gemini 1.5 Flash API for answer generation and implement smart caching to reduce API calls by 70-80%. This enables real-time answer retrieval while staying within free tier rate limits.

**User Value:** Users get instant answers to quiz questions, with answers cached locally for repeated questions.

**Technical Context:** Implements AD-003 (Gemini 1.5 Flash as Primary AI Backend) and AD-004 (IndexedDB Smart Caching Architecture).

---

### Story 2.1: Implement IndexedDB Caching System

As a developer,
I want to implement the IndexedDB caching system,
So that the system can store and retrieve cached answers efficiently.

**Acceptance Criteria:**

**Given** the extension is installed
**When** the caching system initializes
**Then** it creates IndexedDB database with schema:
  - questionHash (primary key)
  - question (text)
  - answer (text)
  - confidence (number)
  - timestamp (number)
  - platform (string)
  - quizType (string)
  - hitCount (number)
  - lastAccessed (number)
**And** it creates indexes on: questionHash (unique), platform, timestamp
**And** it implements get(hash), set(hash, answer), has(hash) methods
**And** it generates MD5 hashes of question text for lookup

**Technical Implementation:**

- Create IndexedDB database: "quizCache"
- Define object store with schema above
- Implement hash generation using MD5
- Implement CRUD operations: get, set, has, delete
- Implement cache statistics: totalEntries, hitCount, missCount, hitRate
- Implement LRU cleanup: remove least recently used when 90% full
- Max entries: 10,000 questions

**Prerequisites:** None (Foundation for caching)

**Technical Notes:**
- Architecture Section 4: IndexedDB Smart Caching Architecture
- Use crypto.subtle.digest for MD5 hashing (or md5 library)
- Implement in background service worker
- Target: <5ms lookup time

---

### Story 2.2: Implement Gemini API Integration

As a developer,
I want to implement the Gemini 1.5 Flash API integration,
So that the system can call the AI API to generate answers.

**Acceptance Criteria:**

**Given** a quiz question and optional context
**When** the API integration calls Gemini
**Then** it sends POST request to Gemini 1.5 Flash endpoint
**And** it includes question text in request body
**And** it authenticates using API key from settings
**And** it implements 5-second timeout
**And** it implements retry logic: 2 attempts with exponential backoff
**And** it returns AIResponse with: answer, confidence, explanation, error
**And** it handles errors gracefully: timeout, rate limit, auth failure

**Technical Implementation:**

- Implement fetch-based API client
- Endpoint: Gemini 1.5 Flash API
- Request format: { question: string, context?: object }
- Response format: { answer: string, confidence?: number, explanation?: string }
- Implement timeout: 5 seconds
- Implement retry: 2 attempts with exponential backoff (1s, 2s)
- Error handling: timeout, 429 (rate limit), 401 (auth), network errors
- Return structured AIResponse

**Prerequisites:** None (Foundation for AI)

**Technical Notes:**
- Architecture Section 3: Gemini 1.5 Flash as Primary AI Backend
- Use Fetch API with AbortController for timeout
- Implement in background service worker
- Target: 500-1000ms response time

---

### Story 2.3: Implement Cache-First Answer Retrieval

As a developer,
I want to implement cache-first answer retrieval,
So that the system returns cached answers instantly and only calls API on cache miss.

**Acceptance Criteria:**

**Given** a quiz question
**When** answer retrieval is requested
**Then** it generates question hash
**And** it checks IndexedDB cache first
**And** if cache hit: returns cached answer instantly (<5ms)
**And** if cache miss: calls Gemini API
**And** it stores API response in cache
**And** it updates hitCount and lastAccessed timestamp
**And** it returns answer to content script
**And** it tracks cache statistics: hit rate, miss rate

**Technical Implementation:**

- Generate MD5 hash of question text
- Check cache: `cache.has(hash)`
- If hit: retrieve and return cached answer
- If miss: call Gemini API (Story 2.2)
- Store response: `cache.set(hash, answer)`
- Update statistics
- Return answer with source (cached vs fresh)

**Prerequisites:** Stories 2.1 (Caching), 2.2 (API Integration)

**Technical Notes:**
- Architecture Section 4: Cache Strategy
- Expected cache hit rate: 70-80%
- Implement in background service worker
- Target: <5ms for cache hit, <1000ms for cache miss

---

### Story 2.4: Implement Rate Limiting Management

As a developer,
I want to implement rate limiting management,
So that the system respects Gemini free tier limits and queues requests appropriately.

**Acceptance Criteria:**

**Given** the Gemini free tier limits (15 req/min, 1500 req/day)
**When** requests are made to the API
**Then** it tracks request count per minute
**And** it tracks request count per day
**And** it queues requests at 1-2 per second
**And** it prevents exceeding 15 requests per minute
**And** it prevents exceeding 1500 requests per day
**And** it notifies user when rate limit is reached
**And** it falls back to cached answers only when limit exceeded

**Technical Implementation:**

- Implement request queue with rate limiting
- Track requests per minute (sliding window)
- Track requests per day (daily counter)
- Queue requests: process 1-2 per second
- Check limits before API call
- If limit exceeded: return error, suggest waiting
- Notify user: "Rate limit reached. Using cached answers only."
- Implement in background service worker

**Prerequisites:** Story 2.2 (API Integration)

**Technical Notes:**
- Architecture Section 3: Rate Limiting Strategy
- Free tier: 15 req/min, 1500 req/day
- Expected actual usage: 10-30 calls/day (with caching)
- Implement sliding window for per-minute tracking
- Implement daily counter reset at midnight

---

### Story 2.5: Implement Request Queuing and Retry Logic

As a developer,
I want to implement request queuing and retry logic,
So that the system handles multiple simultaneous requests and recovers from transient failures.

**Acceptance Criteria:**

**Given** multiple quiz questions on a page
**When** answers are requested simultaneously
**Then** it queues requests at 1-2 per second
**And** it processes queue in FIFO order
**And** it implements exponential backoff retry: 1s, 2s
**And** it retries up to 2 times on transient errors
**And** it fails fast on permanent errors (401, 403)
**And** it logs all requests and responses for debugging

**Technical Implementation:**

- Implement request queue (FIFO)
- Rate limiter: 1-2 requests per second
- Retry logic: exponential backoff (1s, 2s)
- Max retries: 2
- Transient errors: 408, 429, 500, 502, 503, 504
- Permanent errors: 400, 401, 403, 404
- Logging: request, response, errors, timestamps
- Implement in background service worker

**Prerequisites:** Stories 2.2 (API), 2.4 (Rate Limiting)

**Technical Notes:**
- Architecture Section 3: Rate Limiting Strategy
- Use Promise-based queue implementation
- Implement exponential backoff: delay = baseDelay * (2 ^ retryCount)
- Log to console (development) or local storage (production)

---

## Epic 3: Performance & Adaptation - Adaptive Performance

**Epic Goal:** Implement adaptive performance that optimizes for both desktop (accuracy) and mobile (battery efficiency). This ensures the extension works efficiently across all devices.

**User Value:** Users get optimal performance on their device - fast and accurate on desktop, battery-efficient on mobile.

**Technical Context:** Implements AD-002 (Adaptive Performance Architecture) and AD-006 (Web Workers for Parallel Processing).

---

### Story 3.1: Implement Device Detection and Mode Switching

As a developer,
I want to implement device detection and adaptive mode switching,
So that the system automatically optimizes for desktop or mobile.

**Acceptance Criteria:**

**Given** the extension is running on a device
**When** it initializes
**Then** it detects device type: desktop or mobile
**And** it checks battery level (if available)
**And** it switches to appropriate mode:
  - Desktop mode: Full detection (CSS + XPath + DOM + AI)
  - Mobile mode: Speed mode (CSS + XPath only, cache-first)
**And** it switches to speed mode if battery < 20%
**And** it stores mode preference in chrome.storage.local
**And** it allows manual override in settings

**Technical Implementation:**

- Detect mobile: User agent + screen size check
- Get battery level: Battery Status API (if available)
- Define modes: ACCURACY_MODE, SPEED_MODE
- Auto-switch logic: if (isMobile || batteryLevel < 20%) → SPEED_MODE
- Store preference in chrome.storage.local
- Allow manual override in popup settings
- Implement in background service worker

**Prerequisites:** None (Foundation for performance)

**Technical Notes:**
- Architecture Section 2: Adaptive Performance Architecture
- Mobile detection: User agent regex + window.innerWidth < 768
- Battery API: navigator.getBattery() (if available)
- Implement in background service worker

---

### Story 3.2: Implement Web Worker for Parallel Detection

As a developer,
I want to implement Web Worker for parallel detection processing,
So that the detection algorithm runs without blocking the main thread.

**Acceptance Criteria:**

**Given** a web page with quiz content
**When** detection is triggered
**Then** it spawns a Web Worker
**And** it sends DOM snapshot to worker
**And** it runs all detection layers in parallel (Structural, Pattern, Context)
**And** it returns detection results to main thread
**And** the main thread remains responsive during detection
**And** it terminates worker after detection completes

**Technical Implementation:**

- Create worker.js file with detection algorithm
- Spawn worker on page load
- Send DOM snapshot to worker via postMessage
- Worker runs all detection layers
- Worker returns DetectionResult via postMessage
- Main thread continues UI rendering
- Terminate worker after detection
- Handle worker errors gracefully

**Prerequisites:** Epic 1 (Detection Engine)

**Technical Notes:**
- Architecture Section 6: Web Workers for Parallel Processing
- Create separate worker.js file
- Use postMessage for communication
- Send DOM snapshot (serializable data only)
- Target: <200ms detection time (desktop), <100ms (mobile)

---

### Story 3.3: Implement Mobile Speed Mode Optimization

As a developer,
I want to implement mobile speed mode optimization,
So that the system uses cache-first strategy and reduced detection on mobile.

**Acceptance Criteria:**

**Given** the system is in mobile speed mode
**When** a quiz is detected
**Then** it uses CSS + XPath selectors only (no DOM analysis)
**And** it uses cache-first strategy: check cache before API
**And** it skips AI verification layer
**And** it returns answers from cache when available
**And** it only calls API on cache miss
**And** it monitors battery usage and disables features if needed

**Technical Implementation:**

- In SPEED_MODE: disable DOM analysis layer
- Use CSS selectors + XPath only
- Implement cache-first: check cache before API
- Skip AI verification (use confidence threshold only)
- Return cached answers instantly
- Monitor battery: disable continuous monitoring if battery < 10%
- Implement in content script and background worker

**Prerequisites:** Stories 3.1 (Device Detection), 3.2 (Web Worker)

**Technical Notes:**
- Architecture Section 2: Mobile Mode (Battery Saver)
- Expected performance: 50-100ms detection, <1% battery per hour
- Cache hit rate: 80%+ in speed mode
- Disable MutationObserver in speed mode

---

## Epic 4: User Interface - Answer Display

**Epic Goal:** Create a user-friendly interface for displaying answers on quiz pages. This is the primary user-facing feature that delivers the core value.

**User Value:** Users see answers displayed clearly on quiz pages with confidence levels and optional explanations.

**Technical Context:** Implements AD-005 (Browser Extension Architecture) with answer display UI components.

---

### Story 4.1: Implement Answer Display UI Component

As a developer,
I want to implement the answer display UI component,
So that answers are shown to users in a clear, non-intrusive way.

**Acceptance Criteria:**

**Given** a quiz question with an AI-generated answer
**When** the answer is ready
**Then** it displays an interactive tooltip near the question heading
**And** the tooltip shows: answer text + confidence level
**And** the tooltip includes buttons: "Show Explanation", "Report Wrong"
**And** the tooltip styling is minimal and non-intrusive
**And** the tooltip is positioned near the question heading
**And** the tooltip can be dismissed by clicking outside
**And** the tooltip respects user's display preferences (light/dark theme)

**Technical Implementation:**

- Create tooltip HTML element with answer content
- Position near question heading using getBoundingClientRect()
- Style with CSS: minimal, non-intrusive design
- Implement click handlers: Show Explanation, Report Wrong
- Implement dismiss on outside click
- Support light/dark theme from settings
- Inject into page via content script

**Prerequisites:** Epic 1 (Detection), Epic 2 (Answer Generation)

**Technical Notes:**
- Architecture Section 4: Answer Display UI
- Use absolute positioning near question element
- CSS: z-index high enough to be visible
- Accessible: ARIA labels, keyboard navigation
- Responsive: adjust position on mobile

---

### Story 4.2: Implement Explanation and Feedback Features

As a developer,
I want to implement explanation display and wrong answer reporting,
So that users can see detailed explanations and provide feedback.

**Acceptance Criteria:**

**Given** an answer is displayed
**When** user clicks "Show Explanation"
**Then** it displays detailed explanation from AI
**And** the explanation is formatted clearly
**And** user can dismiss explanation

**And** when user clicks "Report Wrong"
**Then** it logs the wrong answer feedback
**And** it stores: question, answer, user feedback, timestamp
**And** it shows confirmation: "Thank you for feedback"
**And** it uses feedback to improve future answers

**Technical Implementation:**

- Implement explanation display: expandable section
- Format explanation with markdown or plain text
- Implement report wrong: log to IndexedDB
- Store feedback: { question, answer, feedback, timestamp }
- Show confirmation message
- Use feedback for future model improvements (v2.0)

**Prerequisites:** Story 4.1 (Answer Display)

**Technical Notes:**
- Architecture Section 4: Answer Display UI
- Store feedback in IndexedDB for analysis
- Explanation from AI response (if available)
- Implement in content script

---

## Epic 5: Learning System - User Training (Optional)

**Epic Goal:** Implement optional user training mode where users can manually mark quizzes to improve detection. This enables personalized, self-improving detection over time.

**User Value:** Users can train the system on their specific platforms, improving detection accuracy to 98%+ over time.

**Technical Context:** Implements AD-008 (User-Trained Learning System).

---

### Story 5.1: Implement User Quiz Marking and Pattern Extraction

As a developer,
I want to implement user quiz marking via context menu,
So that users can train the system on custom quiz formats.

**Acceptance Criteria:**

**Given** user right-clicks on a quiz area
**When** context menu appears
**Then** it shows "Mark as Quiz" option
**And** user can click to mark the area
**And** the system extracts patterns:
  - DOM structure
  - CSS classes and IDs
  - Text patterns
  - Visual layout
**And** it stores pattern in IndexedDB with high confidence (100%)
**And** it shows confirmation: "Quiz pattern learned"

**Technical Implementation:**

- Implement context menu via chrome.contextMenus API
- Add "Mark as Quiz" option
- Extract DOM structure: serialize element tree
- Extract CSS: class names, IDs, selectors
- Extract text patterns: question marks, option prefixes
- Store in IndexedDB: userPatterns collection
- Show confirmation toast

**Prerequisites:** Epic 1 (Detection)

**Technical Notes:**
- Architecture Section 8: User-Trained Learning System
- Use chrome.contextMenus API
- Serialize DOM carefully (avoid circular references)
- Store in separate IndexedDB collection: userPatterns

---

### Story 5.2: Implement User Pattern Priority Detection

As a developer,
I want to implement user pattern priority in detection,
So that learned patterns are checked first for highest accuracy.

**Acceptance Criteria:**

**Given** a page is loaded
**When** detection runs
**Then** it checks user-trained patterns first (100% confidence)
**And** if user pattern matches: use it immediately
**And** if no user pattern: fall back to universal detection
**And** it tracks pattern success: successCount, lastUsed
**And** it removes unused patterns after 90 days
**And** it displays "Using learned pattern" in popup

**Technical Implementation:**

- Load user patterns from IndexedDB
- Check patterns before universal detection
- Pattern matching: compare DOM structure + CSS selectors
- If match: return high confidence result
- If no match: proceed with universal detection
- Track success: increment successCount
- Cleanup: remove patterns with lastUsed > 90 days ago
- Display in popup: "Using learned pattern"

**Prerequisites:** Story 5.1 (Pattern Extraction)

**Technical Notes:**
- Architecture Section 8: Detection Priority
- User patterns checked first (highest priority)
- Expected accuracy: 98%+ after training
- Implement in background service worker

---

## Summary

**Total Epics:** 5
**Total Stories:** 17

**Epic Breakdown:**
- Epic 1: Foundation (4 stories) - Universal Detection Engine
- Epic 2: AI Integration (5 stories) - Answer Generation & Caching
- Epic 3: Performance (3 stories) - Adaptive Performance
- Epic 4: UI (2 stories) - Answer Display
- Epic 5: Learning (2 stories) - User Training (Optional)

**FR Coverage:** All 20 functional requirements mapped to specific stories

**Implementation Sequence:**
1. Epic 1 (Foundation) - Core detection engine
2. Epic 2 (AI Integration) - Answer generation and caching
3. Epic 3 (Performance) - Adaptive optimization
4. Epic 4 (UI) - User-facing interface
5. Epic 5 (Learning) - Optional enhancement

**Ready for Phase 4:** Sprint Planning and Development Implementation

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._
