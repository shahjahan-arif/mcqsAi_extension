# Story 2.1: Implement IndexedDB Caching System

Status: ready-for-dev

## Story

As a developer,
I want to implement the IndexedDB caching system,
So that the system can store and retrieve cached answers efficiently.

## Acceptance Criteria

1. **Given** the extension is installed
   **When** the caching system initializes
   **Then** it creates IndexedDB database with proper schema

2. **And** it creates indexes on: questionHash (unique), platform, timestamp

3. **And** it implements get(hash), set(hash, answer), has(hash) methods

4. **And** it generates MD5 hashes of question text for lookup

5. **And** it implements cache statistics: totalEntries, hitCount, missCount, hitRate

6. **And** it implements LRU cleanup: remove least recently used when 90% full

7. **And** it supports max 10,000 cached questions

8. **And** it completes cache operations in <5ms

## Technical Implementation

**Component:** `CachingSystem` class

**Database Schema:**
```javascript
const DB_NAME = 'quizCache';
const STORE_NAME = 'answers';

const schema = {
  keyPath: 'questionHash',
  indexes: [
    { name: 'platform', keyPath: 'platform' },
    { name: 'timestamp', keyPath: 'timestamp' },
    { name: 'lastAccessed', keyPath: 'lastAccessed' }
  ]
};

interface CachedAnswer {
  questionHash: string;      // Primary key (MD5)
  question: string;          // Original question text
  answer: string;            // AI-generated answer
  confidence: number;        // 0-100
  timestamp: number;         // When cached
  platform: string;          // Source platform URL
  quizType: string;          // 'mcq', 'true-false', etc
  hitCount: number;          // Times retrieved
  lastAccessed: number;      // Last access timestamp
}
```

**Implementation:**

```javascript
class CachingSystem {
  constructor() {
    this.db = null;
    this.MAX_ENTRIES = 10000;
    this.CLEANUP_THRESHOLD = 0.9; // 90%
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('quizCache', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const store = db.createObjectStore('answers', { keyPath: 'questionHash' });
        store.createIndex('platform', 'platform', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
      };
    });
  }

  async get(questionHash) {
    const transaction = this.db.transaction(['answers'], 'readonly');
    const store = transaction.objectStore('answers');
    
    return new Promise((resolve, reject) => {
      const request = store.get(questionHash);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        if (request.result) {
          // Update lastAccessed and hitCount
          this.updateAccess(questionHash);
        }
        resolve(request.result);
      };
    });
  }

  async set(questionHash, cachedAnswer) {
    const transaction = this.db.transaction(['answers'], 'readwrite');
    const store = transaction.objectStore('answers');
    
    // Check if cleanup needed
    const count = await this.getEntryCount();
    if (count >= this.MAX_ENTRIES * this.CLEANUP_THRESHOLD) {
      await this.cleanup();
    }
    
    return new Promise((resolve, reject) => {
      const request = store.put(cachedAnswer);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async has(questionHash) {
    const answer = await this.get(questionHash);
    return !!answer;
  }

  async updateAccess(questionHash) {
    const transaction = this.db.transaction(['answers'], 'readwrite');
    const store = transaction.objectStore('answers');
    
    const request = store.get(questionHash);
    request.onsuccess = () => {
      const answer = request.result;
      if (answer) {
        answer.lastAccessed = Date.now();
        answer.hitCount = (answer.hitCount || 0) + 1;
        store.put(answer);
      }
    };
  }

  async cleanup() {
    // LRU cleanup: remove least recently used entries
    const transaction = this.db.transaction(['answers'], 'readwrite');
    const store = transaction.objectStore('answers');
    const index = store.index('lastAccessed');
    
    const range = IDBKeyRange.upperBound(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(range);
      let deleted = 0;
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && deleted < 1000) {
          cursor.delete();
          deleted++;
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getEntryCount() {
    const transaction = this.db.transaction(['answers'], 'readonly');
    const store = transaction.objectStore('answers');
    
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getStats() {
    const transaction = this.db.transaction(['answers'], 'readonly');
    const store = transaction.objectStore('answers');
    
    return new Promise((resolve, reject) => {
      const countRequest = store.count();
      countRequest.onsuccess = () => {
        const totalEntries = countRequest.result;
        
        // Calculate storage size (approximate)
        const getAllRequest = store.getAll();
        getAllRequest.onsuccess = () => {
          const entries = getAllRequest.result;
          const storageUsed = JSON.stringify(entries).length;
          
          resolve({
            totalEntries,
            storageUsed,
            maxEntries: this.MAX_ENTRIES,
            utilizationPercent: (totalEntries / this.MAX_ENTRIES) * 100
          });
        };
      };
    });
  }

  async clear() {
    const transaction = this.db.transaction(['answers'], 'readwrite');
    const store = transaction.objectStore('answers');
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}
```

**Hash Generation:**
```javascript
async function generateHash(questionText) {
  const encoder = new TextEncoder();
  const data = encoder.encode(questionText);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

## Tasks / Subtasks

- [ ] Create caching module: `src/caching/cache-system.js`
  - [ ] Implement CachingSystem class
  - [ ] Implement database initialization
  - [ ] Implement CRUD operations
  - [ ] Implement LRU cleanup

- [ ] Create hash utilities: `src/caching/hash-utils.js`
  - [ ] Implement generateHash function
  - [ ] Add hash validation

- [ ] Create unit tests: `tests/caching/cache-system.test.js`
  - [ ] Test database initialization
  - [ ] Test CRUD operations
  - [ ] Test LRU cleanup
  - [ ] Test statistics

- [ ] Performance testing
  - [ ] Verify <5ms lookup time
  - [ ] Test with 10,000 entries
  - [ ] Measure storage usage

## Dev Notes

**Architecture Reference:** [Source: docs/architecture.md#AD-004: IndexedDB Smart Caching Architecture]

**Cache Strategy:**
- Question hash-based lookup
- LRU cleanup at 90% capacity
- Max 10,000 entries (~10MB)
- Expected cache hit rate: 70-80%

**Performance Targets:**
- Lookup time: <5ms
- Set operation: <10ms
- Cleanup: <100ms
- Storage: <10MB

**Testing Standards:**
- Unit tests for all operations
- Integration tests with real IndexedDB
- Performance benchmarks
- Edge cases: full cache, corrupted data, quota exceeded

**Source Tree Components:**
- `src/caching/cache-system.js` - Main caching class
- `src/caching/hash-utils.js` - Hash utilities
- `src/caching/index.js` - Exports
- `tests/caching/cache-system.test.js` - Tests

## Project Structure Notes

**Module Exports:**
```javascript
// src/caching/index.js
export { CachingSystem } from './cache-system.js';
export { generateHash } from './hash-utils.js';
```

**Initialization:**
```javascript
// In background service worker
const cache = new CachingSystem();
await cache.init();
```

## References

- [Architecture: AD-004 - IndexedDB Smart Caching Architecture](docs/architecture.md#ad-004-indexeddb-smart-caching-architecture)
- [Architecture: Cache Structure and Strategy](docs/architecture.md#cache-structure)
- [Epic 2: AI Integration & Caching](docs/epics.md#epic-2-ai-integration--caching---answer-generation)

## Dev Agent Record

### Context Reference

Story context: docs/sprint-artifacts/2-1-implement-indexeddb-caching-system.md

### Agent Model Used

Claude 3.5 Sonnet

### Completion Notes

- [ ] Code review completed
- [ ] Tests passing (100% coverage)
- [ ] Performance benchmarks met (<5ms lookup)
- [ ] LRU cleanup verified
- [ ] Storage limits tested
- [ ] Ready for Story 2.2 (API Integration)

### File List

- src/caching/cache-system.js
- src/caching/hash-utils.js
- src/caching/index.js
- tests/caching/cache-system.test.js
