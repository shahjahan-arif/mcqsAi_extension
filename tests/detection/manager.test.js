/**
 * Detection Manager Tests
 * Tests Web Worker spawning and detection processing
 */

import { DetectionManager } from '../../src/detection/manager.js';

describe('DetectionManager', () => {
  let manager;
  let mockWorker;

  beforeEach(() => {
    manager = new DetectionManager();

    // Mock Worker
    mockWorker = {
      postMessage: jest.fn(),
      terminate: jest.fn(),
      onmessage: null,
      onerror: null
    };

    global.Worker = jest.fn(() => mockWorker);
  });

  afterEach(() => {
    if (manager.worker) {
      manager.terminateWorker();
    }
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(manager.worker).toBeNull();
      expect(manager.timeout).toBe(5000);
      expect(manager.isProcessing).toBe(false);
    });

    it('should accept custom worker path', () => {
      const customManager = new DetectionManager('custom/path.js');
      expect(customManager.workerPath).toBe('custom/path.js');
    });
  });

  describe('serializeDOM', () => {
    it('should serialize DOM to snapshot', () => {
      const mockDOM = {
        documentElement: {
          outerHTML: '<html><body>Test</body></html>'
        },
        body: {
          innerText: 'Test',
          innerHTML: '<div>Test</div>'
        },
        title: 'Test Page'
      };

      const snapshot = manager.serializeDOM(mockDOM);

      expect(snapshot.html).toBe('<html><body>Test</body></html>');
      expect(snapshot.bodyText).toBe('Test');
      expect(snapshot.bodyHTML).toBe('<div>Test</div>');
      expect(snapshot.title).toBe('Test Page');
    });

    it('should handle missing body', () => {
      const mockDOM = {
        documentElement: {
          outerHTML: '<html></html>'
        },
        body: null,
        title: 'Test'
      };

      const snapshot = manager.serializeDOM(mockDOM);

      expect(snapshot.bodyText).toBe('');
      expect(snapshot.bodyHTML).toBe('');
    });

    it('should throw error for invalid DOM', () => {
      expect(() => manager.serializeDOM(null)).toThrow('Invalid DOM provided');
      expect(() => manager.serializeDOM({})).toThrow('Invalid DOM provided');
    });

    it('should include URL in snapshot', () => {
      const mockDOM = {
        documentElement: {
          outerHTML: '<html></html>'
        },
        body: {
          innerText: '',
          innerHTML: ''
        },
        title: 'Test'
      };

      const snapshot = manager.serializeDOM(mockDOM);

      expect(snapshot.url).toBeDefined();
    });
  });

  describe('createWorker', () => {
    it('should create a worker instance', () => {
      const worker = manager.createWorker();

      expect(worker).toBeDefined();
      expect(global.Worker).toHaveBeenCalled();
    });

    it('should throw error if Worker not supported', () => {
      const originalWorker = global.Worker;
      global.Worker = undefined;

      expect(() => manager.createWorker()).toThrow('Web Workers not supported');

      global.Worker = originalWorker;
    });
  });

  describe('detectQuiz', () => {
    it('should spawn worker and send DOM snapshot', async () => {
      const mockDOM = {
        documentElement: {
          outerHTML: '<html><body>Quiz</body></html>'
        },
        body: {
          innerText: 'Quiz',
          innerHTML: '<div>Quiz</div>'
        },
        title: 'Quiz'
      };

      const detectionPromise = manager.detectQuiz(mockDOM);

      // Simulate worker response
      setTimeout(() => {
        mockWorker.onmessage({
          data: {
            success: true,
            result: { detected: true, confidence: 0.9 }
          }
        });
      }, 10);

      const result = await detectionPromise;

      expect(result.detected).toBe(true);
      expect(mockWorker.postMessage).toHaveBeenCalled();
    });

    it('should set isProcessing flag', async () => {
      const mockDOM = {
        documentElement: { outerHTML: '<html></html>' },
        body: { innerText: '', innerHTML: '' },
        title: ''
      };

      const detectionPromise = manager.detectQuiz(mockDOM);

      expect(manager.isProcessing).toBe(true);

      setTimeout(() => {
        mockWorker.onmessage({
          data: { success: true, result: {} }
        });
      }, 10);

      await detectionPromise;

      expect(manager.isProcessing).toBe(false);
    });

    it('should reject if detection already in progress', async () => {
      const mockDOM = {
        documentElement: { outerHTML: '<html></html>' },
        body: { innerText: '', innerHTML: '' },
        title: ''
      };

      manager.isProcessing = true;

      await expect(manager.detectQuiz(mockDOM)).rejects.toThrow('Detection already in progress');
    });

    it('should timeout after specified duration', async () => {
      manager.setTimeout(100);

      const mockDOM = {
        documentElement: { outerHTML: '<html></html>' },
        body: { innerText: '', innerHTML: '' },
        title: ''
      };

      const detectionPromise = manager.detectQuiz(mockDOM);

      // Don't send response, let it timeout
      await expect(detectionPromise).rejects.toThrow('Detection timeout');
    });

    it('should terminate worker on timeout', async () => {
      manager.setTimeout(50);

      const mockDOM = {
        documentElement: { outerHTML: '<html></html>' },
        body: { innerText: '', innerHTML: '' },
        title: ''
      };

      const detectionPromise = manager.detectQuiz(mockDOM);

      await expect(detectionPromise).rejects.toThrow();

      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it('should handle worker errors', async () => {
      const mockDOM = {
        documentElement: { outerHTML: '<html></html>' },
        body: { innerText: '', innerHTML: '' },
        title: ''
      };

      const detectionPromise = manager.detectQuiz(mockDOM);

      setTimeout(() => {
        mockWorker.onerror(new Error('Worker crashed'));
      }, 10);

      await expect(detectionPromise).rejects.toThrow('Worker error');
    });

    it('should handle error in result', async () => {
      const mockDOM = {
        documentElement: { outerHTML: '<html></html>' },
        body: { innerText: '', innerHTML: '' },
        title: ''
      };

      const detectionPromise = manager.detectQuiz(mockDOM);

      setTimeout(() => {
        mockWorker.onmessage({
          data: {
            success: false,
            error: 'Detection failed'
          }
        });
      }, 10);

      await expect(detectionPromise).rejects.toThrow('Detection failed');
    });

    it('should terminate worker after successful detection', async () => {
      const mockDOM = {
        documentElement: { outerHTML: '<html></html>' },
        body: { innerText: '', innerHTML: '' },
        title: ''
      };

      const detectionPromise = manager.detectQuiz(mockDOM);

      setTimeout(() => {
        mockWorker.onmessage({
          data: { success: true, result: { detected: true } }
        });
      }, 10);

      await detectionPromise;

      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it('should send serialized DOM to worker', async () => {
      const mockDOM = {
        documentElement: { outerHTML: '<html><body>Test</body></html>' },
        body: { innerText: 'Test', innerHTML: '<div>Test</div>' },
        title: 'Test'
      };

      const detectionPromise = manager.detectQuiz(mockDOM);

      setTimeout(() => {
        mockWorker.onmessage({
          data: { success: true, result: {} }
        });
      }, 10);

      await detectionPromise;

      expect(mockWorker.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          dom: expect.objectContaining({
            html: '<html><body>Test</body></html>',
            bodyText: 'Test'
          })
        })
      );
    });
  });

  describe('terminateWorker', () => {
    it('should terminate worker', () => {
      manager.worker = mockWorker;

      manager.terminateWorker();

      expect(mockWorker.terminate).toHaveBeenCalled();
      expect(manager.worker).toBeNull();
    });

    it('should handle termination errors', () => {
      mockWorker.terminate.mockImplementation(() => {
        throw new Error('Termination failed');
      });

      manager.worker = mockWorker;

      expect(() => manager.terminateWorker()).not.toThrow();
      expect(manager.worker).toBeNull();
    });

    it('should handle null worker', () => {
      manager.worker = null;

      expect(() => manager.terminateWorker()).not.toThrow();
    });
  });

  describe('isDetecting', () => {
    it('should return processing status', () => {
      expect(manager.isDetecting()).toBe(false);

      manager.isProcessing = true;

      expect(manager.isDetecting()).toBe(true);
    });
  });

  describe('setTimeout', () => {
    it('should set timeout value', () => {
      manager.setTimeout(3000);

      expect(manager.timeout).toBe(3000);
    });

    it('should throw error for invalid timeout', () => {
      expect(() => manager.setTimeout(0)).toThrow('Timeout must be a positive number');
      expect(() => manager.setTimeout(-1000)).toThrow('Timeout must be a positive number');
      expect(() => manager.setTimeout('invalid')).toThrow('Timeout must be a positive number');
    });
  });

  describe('getTimeout', () => {
    it('should return current timeout', () => {
      manager.setTimeout(2000);

      expect(manager.getTimeout()).toBe(2000);
    });

    it('should return default timeout initially', () => {
      expect(manager.getTimeout()).toBe(5000);
    });
  });

  describe('cancel', () => {
    it('should cancel ongoing detection', () => {
      manager.worker = mockWorker;
      manager.isProcessing = true;

      manager.cancel();

      expect(mockWorker.terminate).toHaveBeenCalled();
      expect(manager.isProcessing).toBe(false);
    });

    it('should handle cancel when not processing', () => {
      manager.isProcessing = false;

      expect(() => manager.cancel()).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle multiple sequential detections', async () => {
      const mockDOM = {
        documentElement: { outerHTML: '<html></html>' },
        body: { innerText: '', innerHTML: '' },
        title: ''
      };

      // First detection
      const promise1 = manager.detectQuiz(mockDOM);
      setTimeout(() => {
        mockWorker.onmessage({
          data: { success: true, result: { detected: true } }
        });
      }, 10);

      await promise1;

      // Second detection
      const promise2 = manager.detectQuiz(mockDOM);
      setTimeout(() => {
        mockWorker.onmessage({
          data: { success: true, result: { detected: false } }
        });
      }, 10);

      const result = await promise2;

      expect(result.detected).toBe(false);
    });

    it('should handle concurrent detection attempts', async () => {
      const mockDOM = {
        documentElement: { outerHTML: '<html></html>' },
        body: { innerText: '', innerHTML: '' },
        title: ''
      };

      const promise1 = manager.detectQuiz(mockDOM);

      // Try to start another detection while first is processing
      await expect(manager.detectQuiz(mockDOM)).rejects.toThrow('Detection already in progress');

      // Complete first detection
      setTimeout(() => {
        mockWorker.onmessage({
          data: { success: true, result: {} }
        });
      }, 10);

      await promise1;
    });

    it('should handle large DOM snapshots', async () => {
      const largeHTML = '<html><body>' + '<div>Test</div>'.repeat(1000) + '</body></html>';

      const mockDOM = {
        documentElement: { outerHTML: largeHTML },
        body: { innerText: 'Test'.repeat(1000), innerHTML: '<div>Test</div>'.repeat(1000) },
        title: 'Large Page'
      };

      const detectionPromise = manager.detectQuiz(mockDOM);

      setTimeout(() => {
        mockWorker.onmessage({
          data: { success: true, result: { detected: true } }
        });
      }, 10);

      const result = await detectionPromise;

      expect(result.detected).toBe(true);
    });

    it('should maintain responsiveness during detection', async () => {
      const mockDOM = {
        documentElement: { outerHTML: '<html></html>' },
        body: { innerText: '', innerHTML: '' },
        title: ''
      };

      const startTime = Date.now();

      const detectionPromise = manager.detectQuiz(mockDOM);

      // Simulate some work on main thread
      let mainThreadWork = 0;
      for (let i = 0; i < 1000000; i++) {
        mainThreadWork += i;
      }

      setTimeout(() => {
        mockWorker.onmessage({
          data: { success: true, result: {} }
        });
      }, 10);

      await detectionPromise;

      const elapsed = Date.now() - startTime;

      // Should complete reasonably quickly despite main thread work
      expect(elapsed).toBeLessThan(1000);
    });
  });
});
