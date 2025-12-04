/**
 * IndexedDB Caching System
 * Stores and retrieves cached quiz answers efficiently
 * Implements LRU cleanup and statistics tracking
 */

export const DB_NAME = 'quizCache';
export const STORE_NAME = 'answers';

/**
 * CachingSystem manages IndexedDB storage for cached answers
 * Implements CRUD operations, LRU cleanup, and statistics
 */
export class CachingSystem {
  constructor() {
    this.db = null;
    this.MAX_ENTRIES = 10000;
    this.CLEANUP_THRESHOLD = 0.9; // 90%
    this.CLEANUP_BATCH_SIZE = 1000;
    this.RETENTION_DAYS = 30;
  }

  /**
   * Initializes the IndexedDB database
   * Creates object store and indexes if needed
   * 
   * @returns {Promise<void>}
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onerror = () => {
        console.error('IndexedDB open error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'questionHash' });

          // Create indexes for efficient querying
          store.createIndex('platform', 'platform', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false });

          console.log('IndexedDB schema created');
        }
      };
    });
  }

  /**
   * Retrieves a cached answer by question hash
   * Updates lastAccessed and hitCount on retrieval
   * 
   * @param {string} questionHash - SHA-256 hash of question text
   * @returns {Promise<Object|null>} Cached answer object or null
   */
  async get(questionHash) {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }

    const transaction = this.db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(questionHash);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Update access info asynchronously (don't wait)
          this.updateAccess(questionHash).catch(err => console.error('Error updating access:', err));
        }
        resolve(result);
      };
    });
  }

  /**
   * Stores a cached answer
   * Triggers cleanup if cache is near capacity
   * 
   * @param {string} questionHash - SHA-256 hash of question text
   * @param {Object} cachedAnswer - Answer object to store
   * @returns {Promise<void>}
   */
  async set(questionHash, cachedAnswer) {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }

    // Check if cleanup is needed
    const count = await this.getEntryCount();
    if (count >= this.MAX_ENTRIES * this.CLEANUP_THRESHOLD) {
      await this.cleanup();
    }

    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.put(cachedAnswer);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Checks if a question hash exists in cache
   * 
   * @param {string} questionHash - SHA-256 hash of question text
   * @returns {Promise<boolean>} True if cached
   */
  async has(questionHash) {
    const answer = await this.get(questionHash);
    return !!answer;
  }

  /**
   * Updates lastAccessed and hitCount for a cached entry
   * 
   * @param {string} questionHash - SHA-256 hash of question text
   * @returns {Promise<void>}
   */
  async updateAccess(questionHash) {
    if (!this.db) {
      return; // Silently fail if DB not initialized
    }

    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(questionHash);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const answer = request.result;
        if (answer) {
          answer.lastAccessed = Date.now();
          answer.hitCount = (answer.hitCount || 0) + 1;

          const updateRequest = store.put(answer);
          updateRequest.onerror = () => reject(updateRequest.error);
          updateRequest.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };
    });
  }

  /**
   * Performs LRU cleanup when cache is near capacity
   * Removes entries older than retention period
   * 
   * @returns {Promise<void>}
   */
  async cleanup() {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }

    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('lastAccessed');

    // Calculate cutoff time (30 days ago)
    const cutoffTime = Date.now() - (this.RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const range = IDBKeyRange.upperBound(cutoffTime);

    return new Promise((resolve, reject) => {
      const request = index.openCursor(range);
      let deleted = 0;

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && deleted < this.CLEANUP_BATCH_SIZE) {
          cursor.delete();
          deleted++;
          cursor.continue();
        } else {
          console.log(`Cleanup completed: ${deleted} entries removed`);
          resolve();
        }
      };
    });
  }

  /**
   * Gets the current number of entries in cache
   * 
   * @returns {Promise<number>} Number of cached entries
   */
  async getEntryCount() {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }

    const transaction = this.db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.count();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Gets cache statistics
   * 
   * @returns {Promise<Object>} Statistics object with totalEntries, storageUsed, etc.
   */
  async getStats() {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }

    const transaction = this.db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const countRequest = store.count();

      countRequest.onerror = () => reject(countRequest.error);
      countRequest.onsuccess = () => {
        const totalEntries = countRequest.result;

        // Get all entries to calculate storage size
        const getAllRequest = store.getAll();

        getAllRequest.onerror = () => reject(getAllRequest.error);
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

  /**
   * Clears all entries from cache
   * 
   * @returns {Promise<void>}
   */
  async clear() {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }

    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('Cache cleared');
        resolve();
      };
    });
  }

  /**
   * Closes the database connection
   * 
   * @returns {void}
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
