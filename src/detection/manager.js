/**
 * Detection Manager
 * Manages Web Worker for parallel detection processing
 * Keeps main thread responsive during detection
 */

/**
 * DetectionManager handles Web Worker spawning and communication
 * Runs detection algorithms in parallel without blocking main thread
 */
export class DetectionManager {
  constructor(workerPath = null) {
    this.worker = null;
    this.workerPath = workerPath || 'workers/detector.worker.js';
    this.timeout = 5000; // 5 second timeout
    this.isProcessing = false;
  }

  /**
   * Detects quiz content using Web Worker
   * Sends DOM snapshot to worker and waits for results
   *
   * @param {Document} dom - The DOM document to analyze
   * @returns {Promise<Object>} Detection results
   */
  async detectQuiz(dom) {
    if (this.isProcessing) {
      throw new Error('Detection already in progress');
    }

    return new Promise((resolve, reject) => {
      this.isProcessing = true;

      try {
        // Create worker
        this.worker = this.createWorker();

        // Set timeout
        const timeoutId = setTimeout(() => {
          this.terminateWorker();
          this.isProcessing = false;
          reject(new Error('Detection timeout (5s)'));
        }, this.timeout);

        // Handle response
        this.worker.onmessage = (event) => {
          clearTimeout(timeoutId);
          this.terminateWorker();
          this.isProcessing = false;

          const result = event.data;

          // Check for error in result
          if (result.error) {
            reject(new Error(result.error));
          } else {
            resolve(result);
          }
        };

        // Handle error
        this.worker.onerror = (error) => {
          clearTimeout(timeoutId);
          this.terminateWorker();
          this.isProcessing = false;
          reject(new Error(`Worker error: ${error.message}`));
        };

        // Send DOM snapshot
        const domSnapshot = this.serializeDOM(dom);
        this.worker.postMessage({ dom: domSnapshot });
      } catch (error) {
        this.isProcessing = false;
        reject(error);
      }
    });
  }

  /**
   * Creates a new Web Worker instance
   * Handles both browser and test environments
   *
   * @returns {Worker} Worker instance
   */
  createWorker() {
    if (typeof Worker === 'undefined') {
      throw new Error('Web Workers not supported in this environment');
    }

    // In browser environment with chrome extension
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        return new Worker(chrome.runtime.getURL(this.workerPath));
      } catch (error) {
        // Fallback for testing
        return new Worker(this.workerPath);
      }
    }

    // Standard worker creation
    return new Worker(this.workerPath);
  }

  /**
   * Serializes DOM to a transferable format
   * Creates a snapshot that can be sent to worker
   *
   * @param {Document} dom - The DOM document
   * @returns {Object} Serialized DOM snapshot
   */
  serializeDOM(dom) {
    if (!dom || !dom.documentElement) {
      throw new Error('Invalid DOM provided');
    }

    return {
      html: dom.documentElement.outerHTML,
      bodyText: dom.body ? dom.body.innerText : '',
      bodyHTML: dom.body ? dom.body.innerHTML : '',
      title: dom.title || '',
      url: typeof window !== 'undefined' ? window.location.href : ''
    };
  }

  /**
   * Terminates the current worker
   * Cleans up resources
   *
   * @returns {void}
   */
  terminateWorker() {
    if (this.worker) {
      try {
        this.worker.terminate();
      } catch (error) {
        console.warn('Error terminating worker:', error.message);
      }
      this.worker = null;
    }
  }

  /**
   * Checks if detection is currently processing
   *
   * @returns {boolean} True if processing
   */
  isDetecting() {
    return this.isProcessing;
  }

  /**
   * Sets the detection timeout
   *
   * @param {number} ms - Timeout in milliseconds
   * @returns {void}
   */
  setTimeout(ms) {
    if (typeof ms !== 'number' || ms <= 0) {
      throw new Error('Timeout must be a positive number');
    }
    this.timeout = ms;
  }

  /**
   * Gets the current timeout value
   *
   * @returns {number} Timeout in milliseconds
   */
  getTimeout() {
    return this.timeout;
  }

  /**
   * Cancels ongoing detection
   *
   * @returns {void}
   */
  cancel() {
    this.terminateWorker();
    this.isProcessing = false;
  }
}
