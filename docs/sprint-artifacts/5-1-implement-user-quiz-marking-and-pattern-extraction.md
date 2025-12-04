# Story 5.1: Implement User Quiz Marking and Pattern Extraction

Status: ready-for-dev

## Story

As a developer,
I want to implement user quiz marking via context menu,
So that users can train the system on custom quiz formats.

## Acceptance Criteria

1. **Given** user right-clicks on a quiz area
   **When** context menu appears
   **Then** it shows "Mark as Quiz" option

2. **And** user can click to mark the area

3. **And** the system extracts patterns:
   - DOM structure
   - CSS classes and IDs
   - Text patterns
   - Visual layout

4. **And** it stores pattern in IndexedDB with high confidence (100%)

5. **And** it shows confirmation: "Quiz pattern learned"

## Technical Implementation

```javascript
class UserTrainingManager {
  constructor(cache) {
    this.cache = cache;
    this.selectedElement = null;
  }

  init() {
    // Create context menu
    chrome.contextMenus.create({
      id: 'mark-as-quiz',
      title: 'Mark as Quiz',
      contexts: ['all']
    });
    
    // Handle context menu click
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === 'mark-as-quiz') {
        this.markAsQuiz(tab.id);
      }
    });
  }

  async markAsQuiz(tabId) {
    // Inject script to get selected element
    chrome.tabs.executeScript(tabId, {
      code: `
        const element = document.activeElement;
        const pattern = {
          html: element.outerHTML.substring(0, 500),
          classes: Array.from(element.classList),
          id: element.id,
          tagName: element.tagName,
          textContent: element.innerText.substring(0, 200)
        };
        chrome.runtime.sendMessage({ type: 'ELEMENT_SELECTED', pattern });
      `
    });
  }

  async extractPattern(element) {
    const pattern = {
      id: this.generatePatternId(),
      url: window.location.hostname,
      domStructure: this.serializeDOM(element),
      cssSelectors: this.extractSelectors(element),
      textPatterns: this.extractTextPatterns(element),
      confidence: 100,
      successCount: 0,
      lastUsed: Date.now()
    };
    
    // Store in IndexedDB
    await this.storePattern(pattern);
    
    return pattern;
  }

  serializeDOM(element) {
    // Create a simplified DOM structure
    return {
      tagName: element.tagName,
      classes: Array.from(element.classList),
      id: element.id,
      children: Array.from(element.children).map(child => ({
        tagName: child.tagName,
        classes: Array.from(child.classList),
        id: child.id
      }))
    };
  }

  extractSelectors(element) {
    const selectors = [];
    
    // ID selector
    if (element.id) {
      selectors.push(`#${element.id}`);
    }
    
    // Class selectors
    if (element.classList.length > 0) {
      selectors.push(`.${Array.from(element.classList).join('.')}`);
    }
    
    // Tag selector
    selectors.push(element.tagName.toLowerCase());
    
    // Attribute selectors
    if (element.getAttribute('data-quiz')) {
      selectors.push('[data-quiz]');
    }
    
    return selectors;
  }

  extractTextPatterns(element) {
    const text = element.innerText;
    const patterns = [];
    
    // Question mark pattern
    if (text.includes('?')) {
      patterns.push('contains_question_mark');
    }
    
    // Option prefix pattern
    if (/^[A-D]\)|^\d\./m.test(text)) {
      patterns.push('has_option_prefixes');
    }
    
    // Question pattern
    if (/Question\s+\d+\s+of\s+\d+/i.test(text)) {
      patterns.push('has_question_counter');
    }
    
    return patterns;
  }

  async storePattern(pattern) {
    const transaction = this.cache.db.transaction(['userPatterns'], 'readwrite');
    const store = transaction.objectStore('userPatterns');
    
    return new Promise((resolve, reject) => {
      const request = store.add(pattern);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  generatePatternId() {
    return 'pattern_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  showConfirmation() {
    // Show toast notification
    const toast = document.createElement('div');
    toast.className = 'quiz-toast-notification';
    toast.textContent = '✓ Quiz pattern learned!';
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}
```

## Tasks / Subtasks

- [ ] Create user training manager: `src/learning/user-training.js`
  - [ ] Implement context menu creation
  - [ ] Implement pattern extraction
  - [ ] Implement pattern storage

- [ ] Add 'userPatterns' object store to IndexedDB
  - [ ] Define schema
  - [ ] Add indexes

- [ ] Create unit tests: `tests/learning/user-training.test.js`
  - [ ] Test pattern extraction
  - [ ] Test pattern storage
  - [ ] Test context menu

- [ ] Integration tests
  - [ ] Test user marking workflow
  - [ ] Test pattern retrieval

## Dev Notes

**Architecture Reference:** [Source: docs/architecture.md#AD-008: User-Trained Learning System]

**Pattern Storage:**
- Store in IndexedDB 'userPatterns' collection
- Include: DOM structure, CSS selectors, text patterns
- Confidence: 100% (user-marked)

**Performance Targets:**
- Pattern extraction: <100ms
- Storage: <10ms
- Confirmation display: <50ms

## References

- [Architecture: AD-008 - User-Trained Learning System](docs/architecture.md#ad-008-user-trained-learning-system)
- [Epic 5: Learning System - User Training](docs/epics.md#epic-5-learning-system---user-training-optional)

## Dev Agent Record

### Completion Notes

- [ ] Code review completed
- [ ] Tests passing
- [ ] Context menu verified
- [ ] Pattern extraction tested
- [ ] Ready for Story 5.2

### File List

- src/learning/user-training.js
- tests/learning/user-training.test.js
