---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments: ['docs/analysis/brainstorming-session-2025-12-04.md']
workflowType: 'architecture'
lastStep: 1
project_name: 'mcqsAi_extension'
user_name: 'Paytohash'
date: '2025-12-04'
hasProjectContext: false
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._


## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

1. **Universal Quiz Detection**
   - Detect quizzes on any platform without platform-specific code
   - Support multiple quiz formats: MCQ, True/False, Fill-in-blank, Short answer, Multiple select
   - Pattern-based detection using structural, textual, behavioral, and visual patterns
   - Confidence scoring system (0-100) with thresholds for decision making

2. **AI-Powered Answer Generation**
   - Integration with Gemini 1.5 Flash API for answer generation
   - Real-time answer retrieval and display
   - Confidence level indication for answers
   - Smart caching to reduce API calls by 70-80%

3. **Automatic Answer Display**
   - Display answers near question heading (user preference)
   - Interactive tooltips with answer text and confidence levels
   - Optional explanation display
   - Report wrong answer functionality

4. **Copy Protection Bypass**
   - Enable copy functionality on quiz pages where disabled
   - User-controlled toggle via extension popup
   - Enable text selection on protected content

5. **Adaptive Performance**
   - Desktop mode: Full detection layers (CSS + XPath + DOM + AI)
   - Mobile mode: Speed-optimized (CSS + XPath only, cache-first)
   - Automatic device and battery level detection
   - Web Workers for parallel processing

6. **Smart Caching System**
   - IndexedDB-based local storage
   - Question hash-based cache lookup
   - Store answers, confidence levels, timestamps
   - 70-80% cache hit rate expected

7. **User-Trained Mode (Optional)**
   - Users can manually mark quizzes to train the system
   - Extract and store patterns from marked areas
   - Personalized detection improvement over time

**Non-Functional Requirements:**

1. **Performance**
   - Detection speed: 100-200ms (desktop), 50-100ms (mobile)
   - AI response time: 500-1000ms (uncached)
   - Total time to answer: <1.5 seconds
   - Cache hit response: Instant (0ms)

2. **Accuracy**
   - Universal detection: 85-90% accuracy
   - With AI verification: 95%+ accuracy
   - User-trained mode: 98%+ accuracy

3. **Battery Efficiency**
   - Desktop: Negligible impact
   - Mobile speed mode: <1% battery per hour
   - Adaptive mode switches based on battery level (<20%)

4. **Scalability**
   - Works on 100% of platforms (universal detection)
   - No platform-specific code to maintain
   - Self-improving through learning system

5. **Reliability**
   - 95% overall reliability with fallback strategies
   - Sequential fallback: CSS → DOM → AI
   - Graceful degradation on API failures

6. **Privacy & Security**
   - No personal data collection
   - Local-only storage (IndexedDB)
   - No server-side data storage
   - API calls contain question text only

7. **Rate Limiting Compliance**
   - Gemini free tier: 15 req/min, 1500 req/day
   - Smart caching reduces actual API calls to 10-30/day
   - Request queuing (1-2 per second)
   - User notification on rate limit

**Scale & Complexity:**

- **Primary domain:** Browser Extension (Chrome/Firefox) + AI Integration
- **Complexity level:** Medium
- **Estimated architectural components:** 8 major components
  1. Universal Detection Engine
  2. AI Integration Layer
  3. Caching System
  4. Answer Display UI
  5. Copy Protection Handler
  6. Adaptive Performance Manager
  7. Extension Popup/Settings
  8. User Training Module

### Technical Constraints & Dependencies

**Browser Extension Constraints:**
- Must work within browser extension sandbox
- Limited to browser extension APIs (Chrome/Firefox WebExtensions)
- Content script injection limitations
- Cross-origin restrictions for API calls

**AI API Constraints:**
- Gemini 1.5 Flash free tier rate limits (15 req/min, 1500/day)
- Network latency for API calls (500-1000ms)
- Requires internet connectivity for uncached answers
- API key management and security

**Performance Constraints:**
- Mobile device battery limitations
- CPU usage on continuous monitoring
- Memory constraints for caching
- DOM manipulation performance

**Platform Diversity:**
- Unlimited variety of quiz implementations
- Dynamic content loading (SPAs)
- Different HTML structures across platforms
- Various quiz formats and layouts

**Technology Dependencies:**
- JavaScript ES6+ for extension code
- IndexedDB for local storage
- Web Workers for parallel processing
- Gemini 1.5 Flash API
- Browser APIs: Storage, Tabs, Scripting

### Cross-Cutting Concerns Identified

1. **Performance Optimization**
   - Affects: Detection engine, AI integration, caching, UI rendering
   - Strategy: Adaptive mode, Web Workers, aggressive caching

2. **Error Handling & Resilience**
   - Affects: All components
   - Strategy: Fallback chains, graceful degradation, user notifications

3. **Privacy & Data Security**
   - Affects: Caching, API integration, user data
   - Strategy: Local-only storage, no PII collection, secure API calls

4. **User Experience Consistency**
   - Affects: Answer display, settings, notifications
   - Strategy: Minimal UI, non-intrusive design, clear feedback

5. **Maintainability & Extensibility**
   - Affects: Detection patterns, platform support, feature additions
   - Strategy: Universal detection (no platform-specific code), modular architecture

6. **Testing & Quality Assurance**
   - Affects: All components
   - Strategy: Multi-platform testing, accuracy metrics, performance monitoring

---

## Architectural Decisions

### AD-001: Universal Pattern-Based Detection Architecture

**Status:** Accepted

**Context:**
The extension needs to detect quizzes across unlimited platforms with diverse implementations. Two approaches were considered:
1. Platform-specific detection (maintain code for each platform)
2. Universal pattern-based detection (single algorithm for all platforms)

**Decision:**
Implement universal pattern-based detection using quiz "DNA" patterns that are common across all quiz implementations.

**Rationale:**
- **100% platform coverage** - Works on any platform without custom code
- **Low maintenance** - No platform-specific code to update when platforms change
- **Future-proof** - Automatically works on new platforms
- **Self-improving** - Learning system improves detection over time
- **Scalability** - Single codebase scales to unlimited platforms

**Implementation:**

**Detection Algorithm (4-Layer Scoring System):**

```
Layer 1: Structural Scan (0-40 points)
├─ Find all forms, input groups, textareas
├─ Identify radio button/checkbox clusters
├─ Locate submit/next buttons
└─ Score based on quiz-like structure

Layer 2: Pattern Matching (0-40 points)
├─ Question marks detection
├─ A/B/C/D or 1/2/3/4 patterns
├─ "Question X of Y" text patterns
├─ Option prefix patterns
└─ Score based on textual patterns

Layer 3: Context Analysis (0-20 points)
├─ Quiz-related keywords
├─ Timer elements
├─ Progress bars
├─ ARIA labels (accessibility)
└─ Score based on contextual clues

Confidence Threshold:
├─ Score > 80%: High confidence (proceed)
├─ Score 50-80%: Medium confidence (AI verify)
└─ Score < 50%: Not a quiz (skip)
```

**Quiz DNA Patterns:**

1. **Structural Patterns:**
   - Forms with multiple input groups
   - Radio buttons/checkboxes in clusters
   - Question text + options pattern
   - Submit/next buttons near inputs
   - Numbered or lettered options

2. **Textual Patterns:**
   - Question marks (?)
   - "Question X of Y" text
   - Option prefixes: A) B) C) D) or 1. 2. 3. 4.
   - Keywords: "Select", "Choose", "Answer"
   - Timer text patterns

3. **Behavioral Patterns:**
   - Single selection per radio group
   - Form validation on submit
   - Progress indicators
   - Score display areas

4. **Visual Patterns:**
   - Vertical lists of similar elements
   - Consistent spacing between options
   - Highlighted/selected states
   - Question text styling (bold/larger font)

**Consequences:**
- ✅ Works on all platforms immediately
- ✅ No maintenance burden for platform updates
- ✅ Scales infinitely
- ⚠️ May have slightly lower accuracy (85-90%) vs platform-specific (100%)
- ⚠️ Requires AI verification layer for edge cases
- ✅ Accuracy improves over time with learning

**Alternatives Considered:**
- Platform-specific detection: Rejected due to maintenance burden and limited scalability
- Hybrid approach with platform hints: Deferred to v2.0 as optional optimization

---

### AD-002: Adaptive Performance Architecture

**Status:** Accepted

**Context:**
The extension must work efficiently on both desktop and mobile devices. Desktop users prioritize accuracy, while mobile users need battery efficiency.

**Decision:**
Implement adaptive performance mode that automatically adjusts detection strategy based on device type and battery level.

**Rationale:**
- **Desktop optimization** - Full detection layers for maximum accuracy
- **Mobile optimization** - Reduced detection for battery efficiency
- **Automatic switching** - No user configuration needed
- **Best of both worlds** - Users get optimal experience on each device

**Implementation:**

**Desktop Mode (High Performance):**
```javascript
Detection: CSS + XPath + DOM + AI (all layers)
Monitoring: Continuous (optional MutationObserver in v2.0)
Caching: Standard
Priority: Accuracy (90%+)
Battery Impact: Negligible
```

**Mobile Mode (Battery Saver):**
```javascript
Detection: CSS + XPath selectors only (fast)
Monitoring: Page load only (no continuous)
Caching: Cache-first strategy (80% fewer API calls)
Priority: Speed + Battery
Battery Impact: <1% per hour
```

**Auto-Detection Logic:**
```javascript
if (isMobile || batteryLevel < 20%) {
  mode = "SPEED_MODE";
} else {
  mode = "ACCURACY_MODE";
}
```

**Performance Metrics:**

| Mode | Detection Speed | AI Response | Total Time | Accuracy | Battery |
|------|----------------|-------------|------------|----------|---------|
| Desktop | 100-200ms | 500-1000ms | ~1-1.5s | 90%+ | Negligible |
| Mobile (cached) | 50-100ms | 0ms | ~50-100ms | 90%+ | Minimal |
| Mobile (uncached) | 50-100ms | 500ms | ~500-600ms | 85%+ | <1%/hour |

**Consequences:**
- ✅ Optimal performance on all devices
- ✅ Battery-friendly mobile experience
- ✅ No user configuration required
- ✅ Automatic adaptation to conditions
- ⚠️ Slightly lower accuracy on mobile (acceptable tradeoff)

**Alternatives Considered:**
- Single mode for all devices: Rejected - poor mobile battery life
- User-selectable mode: Rejected - adds complexity, auto-detection better

---

### AD-003: Gemini 1.5 Flash as Primary AI Backend

**Status:** Accepted

**Context:**
The extension needs AI to generate quiz answers. Multiple AI options available with different tradeoffs in cost, speed, and accuracy.

**Decision:**
Use Gemini 1.5 Flash as the primary AI backend for MVP.

**Rationale:**
- **Free tier sufficient** - 15 req/min, 1500 req/day
- **Fast response** - 500-1000ms average
- **Good accuracy** - 85-90% for quiz questions
- **Reliable API** - Google infrastructure
- **Easy integration** - REST API

**Implementation:**

**API Integration:**
```javascript
Endpoint: Gemini 1.5 Flash API
Authentication: API key (user-provided or embedded)
Request format: Question text + context
Response: Answer text + confidence (optional)
Timeout: 5 seconds
Retry: 2 attempts with exponential backoff
```

**Rate Limiting Strategy:**
```javascript
Free Tier Limits:
├─ 15 requests/minute
├─ 1500 requests/day
└─ Mitigation: Smart caching (70-80% reduction)

Expected Usage:
├─ Average user: 50-100 questions/day
├─ Cache hit rate: 70-80%
├─ Actual API calls: 10-30/day
└─ Well within free tier limits

Fallback on Rate Limit:
├─ Display cached answers only
├─ Show "Rate limit reached" message
└─ Suggest waiting or upgrading
```

**Consequences:**
- ✅ Zero cost for MVP and most users
- ✅ Fast enough for real-time use
- ✅ Reliable Google infrastructure
- ⚠️ Requires internet connectivity
- ⚠️ Rate limits may affect heavy users (mitigated by caching)
- ⚠️ API key management needed

**Alternatives Considered:**
- Groq (Llama 3): Faster but less accurate, considered for v2.0 as fallback
- OpenAI GPT-3.5: Better accuracy but costs money, rejected for MVP
- Local LLM: Offline capability but slow and large, deferred to v2.0

---

### AD-004: IndexedDB Smart Caching Architecture

**Status:** Accepted

**Context:**
API calls are rate-limited and have latency. Many quiz questions repeat across users and sessions. Caching can dramatically reduce API calls and improve response time.

**Decision:**
Implement aggressive smart caching using IndexedDB with question hash-based lookup.

**Rationale:**
- **70-80% API call reduction** - Most questions are repeated
- **Instant response** - Cached answers return in 0ms
- **Cost savings** - Stay within free tier limits
- **Offline capability** - Cached answers work offline
- **Privacy-friendly** - Local storage only

**Implementation:**

**Cache Structure:**
```javascript
IndexedDB Schema:
{
  questionHash: "md5_hash_of_question_text",
  question: "Original question text",
  answer: "AI-generated answer",
  confidence: 95,
  timestamp: 1234567890,
  platform: "detected_platform_url",
  quizType: "multiple_choice",
  hitCount: 5,
  lastAccessed: 1234567890
}

Indexes:
├─ Primary: questionHash (unique)
├─ Secondary: platform (for analytics)
└─ Secondary: timestamp (for cleanup)
```

**Cache Strategy:**
```javascript
On Quiz Detection:
1. Extract question text
2. Generate hash (MD5)
3. Check IndexedDB for hash
4. If found: Return cached answer (instant)
5. If not found: Call Gemini API
6. Store response in cache
7. Update hitCount and lastAccessed

Cache Cleanup:
├─ Max entries: 10,000 questions
├─ Cleanup trigger: 90% full
├─ Strategy: LRU (Least Recently Used)
└─ Keep high hitCount entries
```

**Performance Impact:**
```
Cache Hit (70-80% of requests):
├─ Lookup time: <5ms
├─ Total response: ~5ms
└─ API calls saved: 70-80%

Cache Miss (20-30% of requests):
├─ Lookup time: <5ms
├─ API call: 500-1000ms
├─ Store time: <10ms
└─ Total response: ~500-1000ms
```

**Consequences:**
- ✅ Dramatic API call reduction (70-80%)
- ✅ Instant responses for cached questions
- ✅ Stays within free tier limits
- ✅ Works offline for cached content
- ✅ Privacy-friendly (local only)
- ⚠️ Storage space usage (~10MB for 10k questions)
- ⚠️ Cache management complexity

**Alternatives Considered:**
- No caching: Rejected - too many API calls, slow responses
- Session storage: Rejected - lost on browser close
- LocalStorage: Rejected - 5MB limit too small
- Server-side caching: Rejected - privacy concerns, infrastructure cost

---

### AD-005: Browser Extension Architecture (Chrome/Firefox)

**Status:** Accepted

**Context:**
The solution needs to run in the user's browser and interact with web pages. Multiple deployment options available: browser extension, bookmarklet, standalone app.

**Decision:**
Implement as a browser extension using Chrome Extension API / Firefox WebExtensions.

**Rationale:**
- **Always available** - Runs automatically on all pages
- **Full browser API access** - Storage, tabs, scripting
- **User-friendly** - Install once, works everywhere
- **Cross-platform** - Chrome and Firefox support
- **Secure** - Browser sandbox protection

**Implementation:**

**Extension Architecture:**
```
manifest.json (Extension configuration)
├─ Permissions: activeTab, storage, scripting
├─ Content scripts: Inject detection code
├─ Background service worker: API calls, caching
└─ Popup UI: Settings and controls

Components:
├─ Content Script (Injected into pages)
│   ├─ Universal detection engine
│   ├─ Answer display UI
│   ├─ Copy protection bypass
│   └─ User interaction handling
│
├─ Background Service Worker
│   ├─ Gemini API integration
│   ├─ IndexedDB caching
│   ├─ Rate limiting management
│   └─ Cross-tab communication
│
└─ Popup UI
    ├─ Enable/disable toggle
    ├─ Copy protection toggle
    ├─ Cache management
    ├─ Settings configuration
    └─ Statistics display
```

**Communication Flow:**
```
Web Page
  ↓ (Content Script injected)
Detection Engine (Content Script)
  ↓ (Quiz detected)
Background Worker (API call)
  ↓ (Check cache)
IndexedDB Cache
  ↓ (Cache miss)
Gemini API
  ↓ (Answer received)
Background Worker (Store in cache)
  ↓ (Send to content script)
Answer Display UI (Content Script)
  ↓ (Render on page)
User sees answer
```

**Consequences:**
- ✅ Seamless user experience
- ✅ Always available on all pages
- ✅ Full browser API access
- ✅ Secure sandbox environment
- ⚠️ Requires installation (not instant)
- ⚠️ Browser-specific (Chrome/Firefox only initially)
- ⚠️ Extension store approval process

**Alternatives Considered:**
- Bookmarklet: Rejected - limited functionality, manual activation
- Standalone web app: Rejected - can't interact with other pages
- Userscript (Tampermonkey): Rejected - requires additional software

---


### AD-006: Web Workers for Parallel Processing

**Status:** Accepted

**Context:**
Detection algorithm involves multiple layers (CSS, XPath, DOM analysis) that can block the main thread and cause UI lag.

**Decision:**
Use Web Workers to run detection algorithm in parallel, keeping the main thread responsive.

**Rationale:**
- **Non-blocking** - UI remains responsive during detection
- **Faster processing** - Parallel execution of detection layers
- **Better UX** - No page freezing or lag
- **Scalable** - Can process multiple quizzes simultaneously

**Implementation:**
```javascript
Main Thread:
├─ Page load event
├─ Spawn Web Worker
├─ Send page DOM snapshot
└─ Continue UI rendering

Web Worker:
├─ Receive DOM snapshot
├─ Run detection algorithm (all layers)
├─ Calculate confidence score
├─ Send results back to main thread

Main Thread:
├─ Receive detection results
├─ If quiz detected: Request answer from background
└─ Display answer UI
```

**Consequences:**
- ✅ Responsive UI during detection
- ✅ Faster overall performance
- ✅ Can handle multiple quizzes on same page
- ⚠️ Additional complexity in code
- ⚠️ DOM serialization overhead

---

### AD-007: XPath + CSS Selector Combination

**Status:** Accepted

**Context:**
CSS selectors are fast but limited in expressiveness. XPath is more powerful but slower. Need balance between speed and capability.

**Decision:**
Use CSS selectors for fast initial scan, XPath for complex pattern matching when needed.

**Rationale:**
- **Speed** - CSS selectors are fastest for simple patterns
- **Power** - XPath handles complex structural queries
- **Flexibility** - Best tool for each job
- **Compatibility** - Both supported in all browsers

**Implementation:**
```javascript
Detection Strategy:
1. CSS Selectors (Fast scan):
   - form, input[type="radio"], input[type="checkbox"]
   - button[type="submit"], textarea
   - Common quiz class patterns

2. XPath (Complex patterns):
   - //div[contains(text(), '?')]/following-sibling::*
   - //label[matches(text(), '[A-D]\)')]/parent::*
   - Structural relationships CSS can't express

3. ARIA Labels (Accessibility):
   - [role="radiogroup"], [role="group"]
   - [aria-label*="question"], [aria-labelledby]
```

**Consequences:**
- ✅ Fast initial detection with CSS
- ✅ Powerful pattern matching with XPath
- ✅ Better accessibility support with ARIA
- ⚠️ More complex selector logic

---


### AD-008: User-Trained Learning System

**Status:** Accepted (Optional Feature)

**Context:**
Universal detection may miss edge cases or unusual quiz formats. Users encounter these edge cases and can provide valuable training data.

**Decision:**
Implement optional user-trained mode where users can manually mark quizzes, and the system learns from these examples.

**Rationale:**
- **Continuous improvement** - System gets smarter over time
- **Personalization** - Learns user's specific platforms
- **Edge case handling** - Captures unusual quiz formats
- **User empowerment** - Users can fix detection failures

**Implementation:**
```javascript
User Training Flow:
1. User right-clicks on quiz area
2. Selects "Mark as Quiz" from context menu
3. System extracts patterns:
   - DOM structure
   - CSS classes and IDs
   - Text patterns
   - Visual layout
4. Store pattern in local library
5. Next time: Check user patterns first (highest priority)

Pattern Storage:
{
  userPatternId: "uuid",
  url: "platform_url",
  domStructure: "serialized_structure",
  cssSelectors: ["selector1", "selector2"],
  textPatterns: ["pattern1", "pattern2"],
  confidence: 100,
  successCount: 5,
  lastUsed: timestamp
}

Detection Priority:
1. User-trained patterns (100% confidence)
2. Universal detection (85-90% confidence)
3. AI verification (if needed)
```

**Consequences:**
- ✅ System improves with use
- ✅ Handles edge cases automatically
- ✅ Personalized to user's platforms
- ✅ 98%+ accuracy after training
- ⚠️ Requires user interaction initially
- ⚠️ Pattern storage management needed

---

## Technology Stack

### Frontend (Browser Extension)

**Core Technologies:**
- **JavaScript ES6+** - Extension logic and detection algorithms
- **HTML5/CSS3** - Answer display UI and popup interface
- **Web Workers** - Parallel processing for detection
- **IndexedDB** - Local caching and storage

**Browser APIs:**
- **Chrome Extension API / Firefox WebExtensions**
  - `chrome.storage` - Settings and cache management
  - `chrome.tabs` - Page detection and communication
  - `chrome.scripting` - Content script injection
  - `chrome.runtime` - Background service worker
- **DOM APIs**
  - `MutationObserver` - Dynamic content detection (v2.0)
  - `IntersectionObserver` - Viewport detection
  - `querySelector` / `querySelectorAll` - CSS selectors
  - `document.evaluate` - XPath queries

**Selectors & Pattern Matching:**
- **CSS Selectors** - Fast element selection
- **XPath Queries** - Complex structural patterns
- **ARIA Labels** - Accessibility-based detection
- **Regular Expressions** - Text pattern matching

### Backend (AI Integration)

**AI Service:**
- **Gemini 1.5 Flash API**
  - REST API integration
  - JSON request/response format
  - API key authentication
  - Rate limiting: 15 req/min, 1500 req/day

**API Integration:**
- **Fetch API** - HTTP requests
- **Async/Await** - Promise-based flow
- **Retry Logic** - Exponential backoff
- **Timeout Handling** - 5-second timeout

### Data Storage

**Local Storage:**
- **IndexedDB**
  - Question/answer caching
  - User-trained patterns
  - Usage statistics
  - Settings persistence

**Storage Schema:**
```javascript
Databases:
├─ quizCache (Question/answer pairs)
├─ userPatterns (Trained detection patterns)
├─ settings (User preferences)
└─ analytics (Usage statistics)
```

### Development Tools

**Build & Package:**
- **Node.js** - Development environment
- **npm/yarn** - Package management
- **Webpack** - Module bundling (optional)
- **Manifest V3** - Extension manifest format

**Testing:**
- **Jest** - Unit testing
- **Puppeteer** - E2E testing
- **Chrome DevTools** - Debugging
- **Extension Reloader** - Development workflow

**Code Quality:**
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Git** - Version control

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        WEB PAGE (Any Platform)                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CONTENT SCRIPT (Injected)                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         UNIVERSAL DETECTION ENGINE (Web Worker)          │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  Layer 1: Structural Scan (CSS + XPath)                  │   │
│  │  Layer 2: Pattern Matching (Text + ARIA)                 │   │
│  │  Layer 3: Context Analysis (Keywords + UI)               │   │
│  │  Layer 4: Confidence Scoring (0-100)                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                             │                                    │
│                             ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              ADAPTIVE PERFORMANCE MANAGER                │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  Device Detection → Desktop Mode / Mobile Mode           │   │
│  │  Battery Check → Full Detection / Speed Mode             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                             │                                    │
│                             ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 ANSWER DISPLAY UI                        │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  Interactive Tooltip (Near Heading)                      │   │
│  │  Confidence Level Indicator                              │   │
│  │  Show Explanation / Report Wrong                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                             │                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            COPY PROTECTION BYPASS                        │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  Enable text selection                                   │   │
│  │  Remove copy event listeners                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓ (Message passing)
┌─────────────────────────────────────────────────────────────────┐
│              BACKGROUND SERVICE WORKER                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 CACHING SYSTEM                           │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  Question Hash Generator (MD5)                           │   │
│  │  IndexedDB Cache Lookup                                  │   │
│  │  Cache Hit → Return Answer (0ms)                         │   │
│  │  Cache Miss → Call AI API                                │   │
│  │  Store Response + Update Stats                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                             │                                    │
│                             ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              AI INTEGRATION LAYER                        │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  Gemini 1.5 Flash API Client                             │   │
│  │  Rate Limiting Manager (15/min, 1500/day)                │   │
│  │  Request Queue (1-2 per second)                          │   │
│  │  Retry Logic (Exponential backoff)                       │   │
│  │  Timeout Handler (5 seconds)                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                             │                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            USER TRAINING MODULE (Optional)               │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  Pattern Extraction from User Marks                      │   │
│  │  Pattern Storage (IndexedDB)                             │   │
│  │  Priority Detection (User patterns first)                │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    EXTENSION POPUP UI                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  • Enable/Disable Extension Toggle                       │   │
│  │  • Copy Protection Bypass Toggle                         │   │
│  │  • Cache Management (Clear cache)                        │   │
│  │  • Statistics (Questions answered, Cache hit rate)       │   │
│  │  • Settings (API key, Performance mode)                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
├─────────────────────────────────────────────────────────────────┤
│  • Gemini 1.5 Flash API (Google AI)                             │
│  • Rate Limiting: 15 requests/minute, 1500/day                  │
│  • Response Time: 500-1000ms average                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
USER VISITS QUIZ PAGE
        │
        ↓
[1] Page Load Event Triggered
        │
        ↓
[2] Content Script Injected
        │
        ↓
[3] Device & Battery Detection
        │
        ├─→ Desktop/High Battery → Full Detection Mode
        └─→ Mobile/Low Battery → Speed Mode
        │
        ↓
[4] Spawn Web Worker (Parallel Processing)
        │
        ↓
[5] Universal Detection Engine
        │
        ├─→ Layer 1: Structural Scan (CSS + XPath)
        ├─→ Layer 2: Pattern Matching (Text + ARIA)
        ├─→ Layer 3: Context Analysis
        └─→ Layer 4: Confidence Scoring
        │
        ↓
[6] Confidence Decision
        │
        ├─→ Score < 50% → NOT A QUIZ (Stop)
        ├─→ Score 50-80% → AI Verification Needed
        └─→ Score > 80% → HIGH CONFIDENCE (Proceed)
        │
        ↓
[7] Extract Question Text
        │
        ↓
[8] Generate Question Hash (MD5)
        │
        ↓
[9] Send to Background Worker
        │
        ↓
[10] Check User-Trained Patterns (Optional)
        │
        ├─→ Pattern Found → Use Learned Detection
        └─→ No Pattern → Continue
        │
        ↓
[11] Check IndexedDB Cache
        │
        ├─→ CACHE HIT (70-80% of requests)
        │   │
        │   ├─→ Retrieve Answer (0ms)
        │   ├─→ Update Hit Count
        │   └─→ Return to Content Script → [16]
        │
        └─→ CACHE MISS (20-30% of requests)
            │
            ↓
[12] Check Rate Limiting
            │
            ├─→ Limit Exceeded → Show "Rate Limit" Message
            └─→ Within Limit → Proceed
            │
            ↓
[13] Call Gemini 1.5 Flash API
            │
            ├─→ Request: Question text + context
            ├─→ Timeout: 5 seconds
            └─→ Retry: 2 attempts with backoff
            │
            ↓
[14] Receive AI Response (500-1000ms)
            │
            ↓
[15] Store in IndexedDB Cache
            │
            ├─→ Question hash
            ├─→ Answer text
            ├─→ Confidence level
            ├─→ Timestamp
            └─→ Platform URL
            │
            ↓
[16] Send Answer to Content Script
            │
            ↓
[17] Render Answer Display UI
            │
            ├─→ Position: Near question heading
            ├─→ Content: Answer + confidence
            ├─→ Interactive: Show explanation, Report wrong
            └─→ Style: Minimal, non-intrusive
            │
            ↓
[18] User Sees Answer
            │
            ├─→ User clicks "Show Explanation" → Display details
            ├─→ User clicks "Report Wrong" → Log feedback
            └─→ User continues quiz
            │
            ↓
[19] Copy Protection Bypass (If Enabled)
            │
            ├─→ Enable text selection
            └─→ Remove copy event listeners
            │
            ↓
[20] User Training (Optional)
            │
            └─→ User marks quiz → Extract pattern → Store for future
```

---


## Component Specifications

### 1. Universal Detection Engine

**Purpose:** Detect quizzes on any platform using pattern-based analysis

**Responsibilities:**
- Scan page DOM for quiz patterns
- Calculate confidence scores
- Support multiple quiz formats
- Run in Web Worker for performance

**Interfaces:**
```javascript
class UniversalDetector {
  // Main detection method
  async detectQuiz(domSnapshot): Promise<DetectionResult>
  
  // Layer methods
  structuralScan(dom): number  // Returns 0-40 score
  patternMatching(dom): number // Returns 0-40 score
  contextAnalysis(dom): number // Returns 0-20 score
  
  // Helper methods
  findForms(dom): HTMLElement[]
  findInputGroups(dom): HTMLElement[]
  extractQuestionText(element): string
}

interface DetectionResult {
  isQuiz: boolean
  confidence: number  // 0-100
  quizType: string    // 'mcq' | 'true-false' | 'fill-blank' | etc
  questions: QuestionElement[]
  platform: string
}

interface QuestionElement {
  element: HTMLElement
  questionText: string
  options: string[]
  questionNumber: number
}
```

**Dependencies:**
- DOM APIs (querySelector, XPath)
- Web Worker API
- Pattern matching utilities

**Performance:**
- Target: 100-200ms (desktop), 50-100ms (mobile)
- Runs in Web Worker (non-blocking)

---

### 2. AI Integration Layer

**Purpose:** Manage communication with Gemini API and handle responses

**Responsibilities:**
- Call Gemini 1.5 Flash API
- Handle rate limiting
- Implement retry logic
- Manage request queue

**Interfaces:**
```javascript
class AIIntegration {
  // Main API call
  async getAnswer(question: string, context?: object): Promise<AIResponse>
  
  // Rate limiting
  checkRateLimit(): boolean
  incrementRequestCount(): void
  
  // Queue management
  queueRequest(request: APIRequest): void
  processQueue(): void
  
  // Retry logic
  async retryWithBackoff(fn: Function, maxRetries: number): Promise<any>
}

interface AIResponse {
  answer: string
  confidence?: number
  explanation?: string
  error?: string
}

interface APIRequest {
  question: string
  context?: object
  timestamp: number
  retryCount: number
}
```

**Dependencies:**
- Fetch API
- Rate limiting manager
- Error handling utilities

**Configuration:**
- API endpoint: Gemini 1.5 Flash
- Rate limits: 15 req/min, 1500 req/day
- Timeout: 5 seconds
- Max retries: 2

---

### 3. Caching System

**Purpose:** Store and retrieve answers to reduce API calls

**Responsibilities:**
- Generate question hashes
- Store/retrieve from IndexedDB
- Manage cache size and cleanup
- Track cache statistics

**Interfaces:**
```javascript
class CachingSystem {
  // Main cache operations
  async get(questionHash: string): Promise<CachedAnswer | null>
  async set(questionHash: string, answer: CachedAnswer): Promise<void>
  async has(questionHash: string): Promise<boolean>
  
  // Hash generation
  generateHash(questionText: string): string
  
  // Cache management
  async cleanup(): Promise<void>
  async clear(): Promise<void>
  async getStats(): Promise<CacheStats>
}

interface CachedAnswer {
  questionHash: string
  question: string
  answer: string
  confidence: number
  timestamp: number
  platform: string
  quizType: string
  hitCount: number
  lastAccessed: number
}

interface CacheStats {
  totalEntries: number
  totalHits: number
  totalMisses: number
  hitRate: number
  storageUsed: number
}
```

**Dependencies:**
- IndexedDB API
- MD5 hashing library
- Storage management utilities

**Configuration:**
- Max entries: 10,000 questions
- Cleanup threshold: 90% full
- Cleanup strategy: LRU (Least Recently Used)

---

### 4. Answer Display UI

**Purpose:** Render answers on the page in a user-friendly way

**Responsibilities:**
- Position answer near question
- Display confidence level
- Provide interactive features
- Maintain minimal, non-intrusive design

**Interfaces:**
```javascript
class AnswerDisplay {
  // Main display method
  render(question: QuestionElement, answer: string, confidence: number): void
  
  // UI components
  createTooltip(content: string): HTMLElement
  positionNearHeading(element: HTMLElement, question: HTMLElement): void
  showConfidence(level: number): HTMLElement
  
  // Interactive features
  showExplanation(explanation: string): void
  reportWrong(questionHash: string): void
  
  // Cleanup
  remove(): void
}

interface DisplayOptions {
  position: 'near-heading' | 'inline' | 'floating'
  showConfidence: boolean
  showExplanation: boolean
  theme: 'light' | 'dark' | 'auto'
}
```

**Dependencies:**
- DOM manipulation APIs
- CSS styling
- Event listeners

**Design:**
- Minimal, non-intrusive
- Clear typography
- Accessible (WCAG compliant)
- Responsive

---

### 5. Adaptive Performance Manager

**Purpose:** Optimize performance based on device and battery

**Responsibilities:**
- Detect device type
- Monitor battery level
- Switch between performance modes
- Adjust detection strategy

**Interfaces:**
```javascript
class AdaptivePerformance {
  // Mode detection
  detectMode(): PerformanceMode
  
  // Device detection
  isMobile(): boolean
  getBatteryLevel(): Promise<number>
  
  // Mode switching
  switchMode(mode: PerformanceMode): void
  
  // Configuration
  getDetectionConfig(): DetectionConfig
}

enum PerformanceMode {
  ACCURACY = 'accuracy',  // Desktop, high battery
  SPEED = 'speed'         // Mobile, low battery
}

interface DetectionConfig {
  useCSSSelectors: boolean
  useXPath: boolean
  useDOMAnalysis: boolean
  useAIVerification: boolean
  enableContinuousMonitoring: boolean
  cacheFirst: boolean
}
```

**Dependencies:**
- Battery Status API
- User Agent detection
- Performance monitoring

**Configuration:**
- Battery threshold: 20%
- Mobile detection: User agent + screen size
- Mode switching: Automatic

---

### 6. Copy Protection Bypass

**Purpose:** Enable copy functionality on protected quiz pages

**Responsibilities:**
- Remove copy event listeners
- Enable text selection
- Restore default browser behavior
- User-controlled toggle

**Interfaces:**
```javascript
class CopyProtectionBypass {
  // Main methods
  enable(): void
  disable(): void
  isEnabled(): boolean
  
  // Implementation
  removeCopyListeners(): void
  enableTextSelection(): void
  restoreDefaults(): void
}
```

**Dependencies:**
- DOM event APIs
- CSS manipulation

**Configuration:**
- Default: Disabled
- User toggle: Extension popup
- Scope: Quiz pages only (optional: all pages)

---

### 7. Extension Popup UI

**Purpose:** Provide user interface for settings and controls

**Responsibilities:**
- Enable/disable extension
- Toggle copy protection
- Manage cache
- Display statistics
- Configure settings

**Interfaces:**
```javascript
class PopupUI {
  // Main render
  render(): void
  
  // Components
  renderToggle(label: string, value: boolean, onChange: Function): HTMLElement
  renderButton(label: string, onClick: Function): HTMLElement
  renderStats(stats: Statistics): HTMLElement
  
  // Actions
  toggleExtension(): void
  toggleCopyProtection(): void
  clearCache(): void
  showSettings(): void
}

interface Statistics {
  questionsAnswered: number
  cacheHitRate: number
  apiCallsToday: number
  apiCallsRemaining: number
}
```

**Dependencies:**
- Chrome Extension Popup API
- Storage API for settings
- Message passing to background

**Design:**
- Simple, clean interface
- Clear toggles and buttons
- Real-time statistics
- Accessible

---

### 8. User Training Module (Optional)

**Purpose:** Learn from user-marked quizzes to improve detection

**Responsibilities:**
- Capture user-marked quiz patterns
- Extract and store patterns
- Prioritize user patterns in detection
- Manage pattern library

**Interfaces:**
```javascript
class UserTraining {
  // Main methods
  markAsQuiz(element: HTMLElement): void
  extractPattern(element: HTMLElement): UserPattern
  storePattern(pattern: UserPattern): Promise<void>
  
  // Detection integration
  async checkUserPatterns(dom): Promise<UserPattern | null>
  
  // Management
  async getPatterns(): Promise<UserPattern[]>
  async deletePattern(id: string): Promise<void>
}

interface UserPattern {
  id: string
  url: string
  domStructure: string
  cssSelectors: string[]
  textPatterns: string[]
  confidence: number
  successCount: number
  lastUsed: number
}
```

**Dependencies:**
- IndexedDB for pattern storage
- Context menu API
- Pattern extraction utilities

**Configuration:**
- Max patterns: 1000
- Cleanup: Remove unused patterns after 90 days
- Priority: User patterns checked first

---

## Deployment Architecture

### Development Environment

**Setup:**
```bash
# Clone repository
git clone <repo-url>
cd mcqsAi_extension

# Install dependencies
npm install

# Development build
npm run dev

# Load extension in Chrome
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select dist/ folder
```

**Development Tools:**
- Hot reload for rapid development
- Source maps for debugging
- ESLint for code quality
- Prettier for formatting

---

### Production Build

**Build Process:**
```bash
# Production build
npm run build

# Output: dist/ folder
# - manifest.json
# - background.js (minified)
# - content.js (minified)
# - popup.html + popup.js
# - worker.js (detection engine)
# - styles.css
```

**Optimization:**
- Code minification
- Tree shaking
- Asset optimization
- Source map generation (optional)

---

### Distribution

**Chrome Web Store:**
1. Create developer account
2. Prepare store listing (screenshots, description)
3. Upload ZIP of dist/ folder
4. Submit for review
5. Approval process (1-3 days)

**Firefox Add-ons:**
1. Create developer account
2. Prepare listing
3. Upload XPI file
4. Submit for review
5. Approval process (1-7 days)

**Self-Hosted (Optional):**
- Host CRX/XPI files
- Provide installation instructions
- Manual updates

---


## Security Considerations

### API Key Management

**Challenge:** Gemini API key needs to be secure but accessible

**Solutions:**

**Option 1: User-Provided API Key (Recommended for MVP)**
- User enters their own Gemini API key in settings
- Stored in chrome.storage.local (encrypted by browser)
- No key distribution or management needed
- User controls their own usage and costs

**Option 2: Embedded Key with Obfuscation**
- Key embedded in extension code
- Obfuscated (not encrypted - impossible in client-side)
- Rate limiting per user to prevent abuse
- Risk: Key can be extracted by determined users

**Option 3: Proxy Server (Future)**
- Extension calls your server
- Server calls Gemini API with server-side key
- Better security and control
- Requires infrastructure and costs

**MVP Decision:** Option 1 (User-provided key)
- Zero infrastructure cost
- User controls usage
- Simple implementation
- Clear in documentation

---

### Content Security Policy (CSP)

**Extension CSP:**
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

**Restrictions:**
- No inline scripts
- No eval()
- External scripts must be bundled
- API calls via fetch only

---

### Permissions Justification

**Required Permissions:**

1. **activeTab**
   - Why: Access current page DOM for quiz detection
   - Risk: Low - only active tab, user-initiated
   - Mitigation: No data sent to external servers

2. **storage**
   - Why: Cache answers and store settings
   - Risk: Low - local storage only
   - Mitigation: No sensitive data stored

3. **scripting**
   - Why: Inject content scripts for detection
   - Risk: Medium - can modify pages
   - Mitigation: Only injects detection code, no data collection

**Optional Permissions:**
- **contextMenus** - For user training feature (right-click menu)

---

### Data Privacy

**Data Collection Policy:**
- ❌ No personal information collected
- ❌ No browsing history tracked
- ❌ No data sent to external servers (except Gemini API)
- ✅ All data stored locally (IndexedDB)
- ✅ User can clear cache anytime
- ✅ No analytics or tracking

**Data Sent to Gemini API:**
- Question text only
- No user identification
- No page URLs
- No personal information

**GDPR Compliance:**
- No personal data processing
- User controls all data (local storage)
- Clear privacy policy
- Right to delete (clear cache)

---

### Code Injection Safety

**Content Script Isolation:**
- Runs in isolated world (separate from page scripts)
- Cannot access page JavaScript variables
- Cannot be accessed by page scripts
- Safe from XSS attacks

**DOM Manipulation Safety:**
- Only reads DOM (detection)
- Only writes answer display elements
- No modification of existing page elements
- No form submission or data theft

---

## Performance Optimization

### Detection Performance

**Optimization Strategies:**

1. **Web Workers**
   - Run detection in parallel
   - Non-blocking main thread
   - Target: 100-200ms detection time

2. **Lazy Loading**
   - Only detect when page is idle
   - Use requestIdleCallback
   - Prioritize user interactions

3. **Debouncing**
   - Avoid repeated detections
   - Debounce scroll/resize events
   - Cache detection results per page

4. **Selector Optimization**
   - CSS selectors first (fastest)
   - XPath only when needed
   - Limit DOM traversal depth

**Performance Targets:**
- Detection: <200ms (desktop), <100ms (mobile)
- Answer display: <50ms
- Total time to answer: <1.5s (uncached)

---

### Memory Management

**Optimization Strategies:**

1. **Cache Size Limits**
   - Max 10,000 cached answers
   - ~10MB storage limit
   - LRU cleanup at 90% full

2. **DOM Reference Cleanup**
   - Remove event listeners on cleanup
   - Clear element references
   - Avoid memory leaks

3. **Worker Lifecycle**
   - Terminate workers after detection
   - Spawn new worker per detection
   - Avoid long-running workers

**Memory Targets:**
- Extension memory: <50MB
- Cache storage: <10MB
- Per-page overhead: <5MB

---

### Network Optimization

**Optimization Strategies:**

1. **Aggressive Caching**
   - 70-80% cache hit rate
   - Reduces API calls dramatically
   - Instant responses for cached questions

2. **Request Batching**
   - Queue multiple questions
   - Send in batches when possible
   - Reduce network overhead

3. **Compression**
   - Compress API requests/responses
   - Reduce bandwidth usage
   - Faster response times

4. **Timeout Management**
   - 5-second timeout for API calls
   - Fail fast on network issues
   - Show cached answers on timeout

**Network Targets:**
- API calls: <30 per day per user
- Bandwidth: <1MB per day
- Timeout rate: <5%

---

## Testing Strategy

### Unit Testing

**Test Coverage:**
- Detection algorithm (all layers)
- Pattern matching functions
- Cache operations
- API integration
- Hash generation

**Tools:**
- Jest for unit tests
- Mock DOM for testing
- Mock API responses
- Code coverage: >80%

**Example Tests:**
```javascript
describe('UniversalDetector', () => {
  test('detects MCQ quiz with high confidence', () => {
    const dom = createMockQuizDOM();
    const result = detector.detectQuiz(dom);
    expect(result.isQuiz).toBe(true);
    expect(result.confidence).toBeGreaterThan(80);
  });
  
  test('rejects non-quiz content', () => {
    const dom = createMockArticleDOM();
    const result = detector.detectQuiz(dom);
    expect(result.isQuiz).toBe(false);
  });
});
```

---

### Integration Testing

**Test Scenarios:**
- End-to-end quiz detection flow
- API integration with Gemini
- Cache hit/miss scenarios
- Error handling and retries
- Performance mode switching

**Tools:**
- Puppeteer for E2E tests
- Real browser environment
- Mock API server for testing

**Example Tests:**
```javascript
describe('E2E Quiz Detection', () => {
  test('detects quiz and displays answer', async () => {
    await page.goto('https://example.com/quiz');
    await page.waitForSelector('.quiz-answer-tooltip');
    const answer = await page.$eval('.quiz-answer-tooltip', el => el.textContent);
    expect(answer).toBeTruthy();
  });
});
```

---

### Platform Testing

**Test Platforms:**
1. Coursera (Educational)
2. Udemy (Educational)
3. Khan Academy (Educational)
4. Google Forms (Quiz mode)
5. Moodle (LMS)
6. Canvas (LMS)
7. Custom quiz pages

**Test Cases per Platform:**
- MCQ detection
- True/False detection
- Fill-in-blank detection
- Answer display positioning
- Copy protection bypass
- Performance metrics

**Success Criteria:**
- 90%+ detection accuracy per platform
- <1.5s response time
- No UI conflicts
- No console errors

---

### Performance Testing

**Metrics to Measure:**
- Detection time (ms)
- API response time (ms)
- Cache hit rate (%)
- Memory usage (MB)
- Battery impact (% per hour)

**Tools:**
- Chrome DevTools Performance
- Lighthouse for performance audits
- Battery API for mobile testing

**Benchmarks:**
- Detection: <200ms (desktop), <100ms (mobile)
- API: <1000ms average
- Cache hit: >70%
- Memory: <50MB
- Battery: <1% per hour (mobile)

---

## Monitoring & Analytics

### Usage Metrics (Local Only)

**Tracked Metrics:**
- Questions answered (count)
- Cache hit rate (%)
- API calls made (count)
- Detection accuracy (user feedback)
- Performance mode usage (desktop vs mobile)

**Storage:**
- Local IndexedDB only
- No external analytics
- User can view in popup
- User can clear anytime

---

### Error Tracking

**Error Categories:**
- Detection failures
- API errors (timeout, rate limit, auth)
- Cache errors
- UI rendering errors

**Logging:**
- Console errors (development)
- Local error log (optional)
- No external error tracking (privacy)

---

### Performance Monitoring

**Monitored Metrics:**
- Detection time per page
- API response time
- Cache performance
- Memory usage trends

**Alerts:**
- Detection time >500ms
- API timeout rate >10%
- Cache hit rate <50%
- Memory usage >100MB

---

## Maintenance & Updates

### Version Strategy

**Semantic Versioning:**
- Major: Breaking changes (2.0.0)
- Minor: New features (1.1.0)
- Patch: Bug fixes (1.0.1)

**Release Cycle:**
- MVP: v1.0.0
- Bug fixes: As needed
- Feature updates: Monthly
- Major versions: Quarterly

---

### Update Mechanism

**Browser Extension Auto-Update:**
- Chrome/Firefox handle updates automatically
- Users notified of major updates
- Changelog in extension description

**Breaking Changes:**
- Minimize breaking changes
- Clear migration guides
- Deprecation warnings

---

### Backward Compatibility

**Cache Format:**
- Version cache schema
- Migrate old cache on update
- Fallback to API on migration failure

**Settings:**
- Preserve user settings across updates
- Add new settings with defaults
- Remove deprecated settings gracefully

---

## Future Enhancements (v2.0+)

### Planned Features

1. **MutationObserver Integration**
   - Continuous monitoring for dynamic quizzes
   - Detect quizzes loaded via AJAX/SPA navigation
   - Real-time detection on content changes

2. **Survey/Poll Detection**
   - Extend detection to surveys and polls
   - Auto-fill survey responses
   - Survey analytics

3. **Multi-AI Consensus**
   - Call multiple AI models in parallel
   - Consensus voting for higher accuracy
   - Fallback chain: Gemini → Groq → Local

4. **Accessibility Mode**
   - Screen reader support
   - Read questions aloud
   - Keyboard navigation
   - WCAG AAA compliance

5. **Crowdsourced Answers**
   - Community-contributed answers
   - Voting system for answer quality
   - Reduce AI API dependency

6. **Educational Analytics**
   - Track learning progress
   - Identify knowledge gaps
   - Study habit insights

7. **Offline Mode**
   - Local LLM integration
   - Works without internet
   - Reduced accuracy but functional

8. **Platform Hints Library**
   - Optional platform-specific optimizations
   - Boost accuracy to 98%+ on known platforms
   - Community-contributed patterns

---

## Success Metrics

### Technical Metrics

**Detection Accuracy:**
- Target: >90% overall
- Measurement: User feedback + manual testing
- Threshold: <85% triggers investigation

**Performance:**
- Detection time: <200ms (desktop), <100ms (mobile)
- API response: <1000ms average
- Total time: <1.5s
- Measurement: Performance API

**Reliability:**
- Uptime: 99%+ (extension availability)
- API success rate: >95%
- Cache hit rate: >70%
- Measurement: Error logs + analytics

**Efficiency:**
- API calls: <30 per day per user
- Battery impact: <1% per hour (mobile)
- Memory usage: <50MB
- Measurement: Battery API + Performance monitoring

---

### User Metrics

**Adoption:**
- Target: 1000+ active users (month 3)
- 10,000+ active users (month 6)
- Measurement: Extension store analytics

**Engagement:**
- Daily active users: >60%
- Questions answered per user: >10 per day
- Measurement: Local analytics

**Satisfaction:**
- Store rating: >4.5/5 stars
- Positive reviews: >80%
- Support tickets: <5% of users
- Measurement: Store reviews + support system

**Retention:**
- 30-day retention: >60%
- 90-day retention: >40%
- Measurement: Extension store analytics

---

### Business Metrics (Future)

**Free Tier Sustainability:**
- Cost per user: <$0 (free tier)
- API usage: Within free limits
- Infrastructure: Zero cost (client-side only)

**Conversion (Future Paid Features):**
- Free to paid: 5-10% target
- Premium features: Unlimited API, advanced analytics
- Measurement: Payment system

---

## Risk Assessment & Mitigation

### Technical Risks

**Risk 1: API Rate Limiting**
- **Probability:** Medium
- **Impact:** High (blocks core functionality)
- **Mitigation:** Aggressive caching (70-80% reduction), user-provided API keys, fallback to cached answers only
- **Contingency:** Implement multi-AI fallback, local LLM option

**Risk 2: Detection Accuracy Issues**
- **Probability:** Medium
- **Impact:** Medium (user frustration)
- **Mitigation:** User training mode, continuous improvement, AI verification layer
- **Contingency:** Platform-specific hints library, community patterns

**Risk 3: Performance Degradation**
- **Probability:** Low
- **Impact:** Medium (poor UX)
- **Mitigation:** Web Workers, adaptive mode, performance monitoring
- **Contingency:** Disable features on low-end devices, optimize algorithms

**Risk 4: Browser API Changes**
- **Probability:** Low
- **Impact:** High (extension breaks)
- **Mitigation:** Follow Manifest V3 standards, monitor browser updates
- **Contingency:** Quick patch releases, fallback implementations

---

### Business Risks

**Risk 1: Platform Blocking**
- **Probability:** Low
- **Impact:** Medium (limited functionality)
- **Mitigation:** Client-side only (hard to block), no server infrastructure
- **Contingency:** Obfuscation techniques, user education

**Risk 2: Competition**
- **Probability:** Medium
- **Impact:** Medium (market share)
- **Mitigation:** Universal detection (unique differentiator), continuous innovation
- **Contingency:** Focus on quality and UX, build community

**Risk 3: Ethical Concerns**
- **Probability:** Medium
- **Impact:** High (reputation)
- **Mitigation:** Clear disclaimers, educational focus, user responsibility
- **Contingency:** Add learning mode, study aid features, ethical guidelines

---

### Legal Risks

**Risk 1: Terms of Service Violations**
- **Probability:** Medium
- **Impact:** High (legal action)
- **Mitigation:** Review platform ToS, add disclaimers, user responsibility
- **Contingency:** Legal consultation, modify features if needed

**Risk 2: Copyright/IP Issues**
- **Probability:** Low
- **Impact:** High (legal action)
- **Mitigation:** No content scraping, no question storage, answers are AI-generated
- **Contingency:** Legal review, remove problematic features

**Risk 3: Privacy Regulations (GDPR, CCPA)**
- **Probability:** Low
- **Impact:** Medium (compliance required)
- **Mitigation:** No personal data collection, local storage only, clear privacy policy
- **Contingency:** Privacy audit, compliance updates

---

## Conclusion

This architecture document provides a comprehensive blueprint for building the AI Quiz Solver Extension. The design prioritizes:

1. **Universal Compatibility** - Works on any platform without platform-specific code
2. **Performance** - Fast detection (<200ms) and response times (<1.5s)
3. **Efficiency** - Smart caching reduces API calls by 70-80%
4. **Privacy** - Local-only storage, no data collection
5. **Scalability** - Self-improving system that gets better over time
6. **User Experience** - Minimal, non-intrusive design with clear feedback

The architecture is designed to be:
- **Maintainable** - Clean separation of concerns, modular components
- **Extensible** - Easy to add new features and quiz types
- **Testable** - Comprehensive testing strategy at all levels
- **Secure** - Privacy-first design, secure API key management
- **Future-proof** - Universal detection adapts to new platforms automatically

**Next Steps:**
1. Set up development environment
2. Implement core detection engine
3. Integrate Gemini API
4. Build caching system
5. Create answer display UI
6. Test on multiple platforms
7. Iterate based on feedback
8. Prepare for extension store submission

**Estimated Timeline:** 4-6 weeks for MVP (v1.0)

---

**Document Status:** Complete
**Last Updated:** 2025-12-04
**Version:** 1.0
**Author:** Winston (Architect) + Paytohash
**Review Status:** Ready for Implementation

