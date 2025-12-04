/**
 * Adaptive Performance Tests
 * Tests device detection and mode switching
 */

import { AdaptivePerformance, PERFORMANCE_MODES } from '../../src/performance/adaptive.js';

describe('AdaptivePerformance', () => {
  let adaptive;

  beforeEach(() => {
    adaptive = new AdaptivePerformance();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(adaptive.mode).toBeNull();
      expect(adaptive.isMobileDevice).toBe(false);
      expect(adaptive.batteryLevel).toBe(100);
      expect(adaptive.listeners).toEqual([]);
    });
  });

  describe('detectMobile', () => {
    it('should detect mobile from user agent', () => {
      const originalUA = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true
      });

      const isMobile = adaptive.detectMobile();

      expect(isMobile).toBe(true);

      Object.defineProperty(navigator, 'userAgent', {
        value: originalUA,
        configurable: true
      });
    });

    it('should detect mobile from screen size', () => {
      const originalInnerWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', {
        value: 500,
        configurable: true
      });

      const isMobile = adaptive.detectMobile();

      expect(isMobile).toBe(true);

      Object.defineProperty(window, 'innerWidth', {
        value: originalInnerWidth,
        configurable: true
      });
    });

    it('should detect desktop from user agent', () => {
      const originalUA = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        configurable: true
      });

      const isMobile = adaptive.detectMobile();

      expect(isMobile).toBe(false);

      Object.defineProperty(navigator, 'userAgent', {
        value: originalUA,
        configurable: true
      });
    });

    it('should detect desktop from screen size', () => {
      const originalInnerWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', {
        value: 1920,
        configurable: true
      });

      const isMobile = adaptive.detectMobile();

      expect(isMobile).toBe(false);

      Object.defineProperty(window, 'innerWidth', {
        value: originalInnerWidth,
        configurable: true
      });
    });

    it('should handle Android user agent', () => {
      const originalUA = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 11; SM-G991B)',
        configurable: true
      });

      const isMobile = adaptive.detectMobile();

      expect(isMobile).toBe(true);

      Object.defineProperty(navigator, 'userAgent', {
        value: originalUA,
        configurable: true
      });
    });

    it('should handle iPad user agent', () => {
      const originalUA = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        configurable: true
      });

      const isMobile = adaptive.detectMobile();

      expect(isMobile).toBe(true);

      Object.defineProperty(navigator, 'userAgent', {
        value: originalUA,
        configurable: true
      });
    });
  });

  describe('getBatteryLevel', () => {
    it('should return 100 if Battery API unavailable', async () => {
      const level = await adaptive.getBatteryLevel();

      expect(level).toBe(100);
    });

    it('should return battery level from Battery API', async () => {
      const mockBattery = {
        level: 0.75
      };

      navigator.getBattery = jest.fn().mockResolvedValue(mockBattery);

      const level = await adaptive.getBatteryLevel();

      expect(level).toBe(75);
    });

    it('should handle Battery API errors', async () => {
      navigator.getBattery = jest.fn().mockRejectedValue(new Error('API error'));

      const level = await adaptive.getBatteryLevel();

      expect(level).toBe(100);
    });

    it('should round battery level to nearest integer', async () => {
      const mockBattery = {
        level: 0.456
      };

      navigator.getBattery = jest.fn().mockResolvedValue(mockBattery);

      const level = await adaptive.getBatteryLevel();

      expect(level).toBe(46);
    });
  });

  describe('determineMode', () => {
    it('should return SPEED_MODE for mobile device', () => {
      adaptive.isMobileDevice = true;
      adaptive.batteryLevel = 100;

      const mode = adaptive.determineMode();

      expect(mode).toBe(PERFORMANCE_MODES.SPEED_MODE);
    });

    it('should return SPEED_MODE for low battery', () => {
      adaptive.isMobileDevice = false;
      adaptive.batteryLevel = 15;

      const mode = adaptive.determineMode();

      expect(mode).toBe(PERFORMANCE_MODES.SPEED_MODE);
    });

    it('should return ACCURACY_MODE for desktop with good battery', () => {
      adaptive.isMobileDevice = false;
      adaptive.batteryLevel = 100;

      const mode = adaptive.determineMode();

      expect(mode).toBe(PERFORMANCE_MODES.ACCURACY_MODE);
    });

    it('should return ACCURACY_MODE at 20% battery threshold', () => {
      adaptive.isMobileDevice = false;
      adaptive.batteryLevel = 20;

      const mode = adaptive.determineMode();

      expect(mode).toBe(PERFORMANCE_MODES.ACCURACY_MODE);
    });

    it('should return SPEED_MODE below 20% battery threshold', () => {
      adaptive.isMobileDevice = false;
      adaptive.batteryLevel = 19;

      const mode = adaptive.determineMode();

      expect(mode).toBe(PERFORMANCE_MODES.SPEED_MODE);
    });
  });

  describe('getConfig', () => {
    it('should return SPEED_MODE config', () => {
      adaptive.mode = PERFORMANCE_MODES.SPEED_MODE;

      const config = adaptive.getConfig();

      expect(config.useCSSSelectors).toBe(true);
      expect(config.useXPath).toBe(true);
      expect(config.useDOMAnalysis).toBe(false);
      expect(config.useAIVerification).toBe(false);
      expect(config.enableContinuousMonitoring).toBe(false);
      expect(config.cacheFirst).toBe(true);
      expect(config.maxDetectionTime).toBe(100);
    });

    it('should return ACCURACY_MODE config', () => {
      adaptive.mode = PERFORMANCE_MODES.ACCURACY_MODE;

      const config = adaptive.getConfig();

      expect(config.useCSSSelectors).toBe(true);
      expect(config.useXPath).toBe(true);
      expect(config.useDOMAnalysis).toBe(true);
      expect(config.useAIVerification).toBe(true);
      expect(config.enableContinuousMonitoring).toBe(true);
      expect(config.cacheFirst).toBe(false);
      expect(config.maxDetectionTime).toBe(200);
    });
  });

  describe('getStatus', () => {
    it('should return current status', () => {
      adaptive.mode = PERFORMANCE_MODES.ACCURACY_MODE;
      adaptive.isMobileDevice = false;
      adaptive.batteryLevel = 85;

      const status = adaptive.getStatus();

      expect(status.mode).toBe(PERFORMANCE_MODES.ACCURACY_MODE);
      expect(status.isMobileDevice).toBe(false);
      expect(status.batteryLevel).toBe(85);
      expect(status.config).toBeDefined();
    });

    it('should include config in status', () => {
      adaptive.mode = PERFORMANCE_MODES.SPEED_MODE;

      const status = adaptive.getStatus();

      expect(status.config.cacheFirst).toBe(true);
    });
  });

  describe('setMode', () => {
    it('should set mode to SPEED_MODE', async () => {
      await adaptive.setMode(PERFORMANCE_MODES.SPEED_MODE);

      expect(adaptive.mode).toBe(PERFORMANCE_MODES.SPEED_MODE);
    });

    it('should set mode to ACCURACY_MODE', async () => {
      await adaptive.setMode(PERFORMANCE_MODES.ACCURACY_MODE);

      expect(adaptive.mode).toBe(PERFORMANCE_MODES.ACCURACY_MODE);
    });

    it('should throw error for invalid mode', async () => {
      await expect(adaptive.setMode('INVALID_MODE')).rejects.toThrow('Invalid mode');
    });

    it('should notify listeners when mode changes', async () => {
      const callback = jest.fn();
      adaptive.onModeChange(callback);

      adaptive.mode = PERFORMANCE_MODES.ACCURACY_MODE;
      await adaptive.setMode(PERFORMANCE_MODES.SPEED_MODE);

      expect(callback).toHaveBeenCalledWith({
        oldMode: PERFORMANCE_MODES.ACCURACY_MODE,
        newMode: PERFORMANCE_MODES.SPEED_MODE
      });
    });
  });

  describe('listeners', () => {
    it('should register mode change listener', () => {
      const callback = jest.fn();

      adaptive.onModeChange(callback);

      expect(adaptive.listeners.length).toBe(1);
      expect(adaptive.listeners[0].event).toBe('modeChanged');
    });

    it('should register battery change listener', () => {
      const callback = jest.fn();

      adaptive.onBatteryChange(callback);

      expect(adaptive.listeners.length).toBe(1);
      expect(adaptive.listeners[0].event).toBe('batteryChanged');
    });

    it('should notify mode change listeners', () => {
      const callback = jest.fn();
      adaptive.onModeChange(callback);

      adaptive.notifyListeners('modeChanged', { oldMode: 'OLD', newMode: 'NEW' });

      expect(callback).toHaveBeenCalledWith({ oldMode: 'OLD', newMode: 'NEW' });
    });

    it('should notify battery change listeners', () => {
      const callback = jest.fn();
      adaptive.onBatteryChange(callback);

      adaptive.notifyListeners('batteryChanged', { level: 50 });

      expect(callback).toHaveBeenCalledWith({ level: 50 });
    });

    it('should handle listener errors gracefully', () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      adaptive.onModeChange(errorCallback);

      expect(() => {
        adaptive.notifyListeners('modeChanged', {});
      }).not.toThrow();
    });

    it('should clear all listeners', () => {
      adaptive.onModeChange(() => {});
      adaptive.onBatteryChange(() => {});

      expect(adaptive.listeners.length).toBe(2);

      adaptive.clearListeners();

      expect(adaptive.listeners.length).toBe(0);
    });
  });

  describe('init', () => {
    it('should initialize adaptive performance', async () => {
      await adaptive.init();

      expect(adaptive.mode).toBeDefined();
      expect(adaptive.isMobileDevice).toBeDefined();
      expect(adaptive.batteryLevel).toBeDefined();
    });

    it('should detect device type during init', async () => {
      await adaptive.init();

      expect(typeof adaptive.isMobileDevice).toBe('boolean');
    });

    it('should get battery level during init', async () => {
      await adaptive.init();

      expect(typeof adaptive.batteryLevel).toBe('number');
      expect(adaptive.batteryLevel).toBeGreaterThanOrEqual(0);
      expect(adaptive.batteryLevel).toBeLessThanOrEqual(100);
    });

    it('should determine mode during init', async () => {
      await adaptive.init();

      expect(Object.values(PERFORMANCE_MODES)).toContain(adaptive.mode);
    });
  });

  describe('savePreference', () => {
    it('should save preference to chrome.storage', async () => {
      global.chrome = {
        storage: {
          local: {
            set: jest.fn().mockResolvedValue(undefined)
          }
        }
      };

      adaptive.mode = PERFORMANCE_MODES.SPEED_MODE;
      adaptive.isMobileDevice = true;
      adaptive.batteryLevel = 50;

      await adaptive.savePreference();

      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          performanceMode: PERFORMANCE_MODES.SPEED_MODE,
          isMobileDevice: true,
          batteryLevel: 50
        })
      );
    });

    it('should handle chrome.storage errors', async () => {
      global.chrome = {
        storage: {
          local: {
            set: jest.fn().mockRejectedValue(new Error('Storage error'))
          }
        }
      };

      adaptive.mode = PERFORMANCE_MODES.SPEED_MODE;

      await expect(adaptive.savePreference()).resolves.not.toThrow();
    });
  });

  describe('loadPreference', () => {
    it('should load preference from chrome.storage', async () => {
      global.chrome = {
        storage: {
          local: {
            get: jest.fn((keys, callback) => {
              callback({
                performanceMode: PERFORMANCE_MODES.ACCURACY_MODE,
                isMobileDevice: false,
                batteryLevel: 80
              });
            })
          }
        }
      };

      const preference = await adaptive.loadPreference();

      expect(preference.performanceMode).toBe(PERFORMANCE_MODES.ACCURACY_MODE);
      expect(preference.isMobileDevice).toBe(false);
      expect(preference.batteryLevel).toBe(80);
    });

    it('should handle chrome.storage errors', async () => {
      global.chrome = {
        storage: {
          local: {
            get: jest.fn((keys, callback) => {
              callback({});
            })
          }
        }
      };

      const preference = await adaptive.loadPreference();

      expect(preference).toEqual({});
    });
  });

  describe('stopMonitoring', () => {
    it('should stop battery monitoring', () => {
      const mockBattery = {
        removeEventListener: jest.fn()
      };

      adaptive.batteryMonitor = mockBattery;

      adaptive.stopMonitoring();

      expect(adaptive.batteryMonitor).toBeNull();
    });

    it('should handle null battery monitor', () => {
      adaptive.batteryMonitor = null;

      expect(() => adaptive.stopMonitoring()).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle desktop with good battery', async () => {
      const originalInnerWidth = window.innerWidth;
      Object.defineProperty(window, 'innerWidth', {
        value: 1920,
        configurable: true
      });

      adaptive.isMobileDevice = false;
      adaptive.batteryLevel = 100;

      const mode = adaptive.determineMode();
      const config = adaptive.getConfig();

      expect(mode).toBe(PERFORMANCE_MODES.ACCURACY_MODE);
      expect(config.useAIVerification).toBe(true);

      Object.defineProperty(window, 'innerWidth', {
        value: originalInnerWidth,
        configurable: true
      });
    });

    it('should handle mobile with low battery', async () => {
      adaptive.isMobileDevice = true;
      adaptive.batteryLevel = 15;

      const mode = adaptive.determineMode();
      const config = adaptive.getConfig();

      expect(mode).toBe(PERFORMANCE_MODES.SPEED_MODE);
      expect(config.cacheFirst).toBe(true);
      expect(config.useAIVerification).toBe(false);
    });

    it('should handle mode switching on battery change', async () => {
      const modeChangeCallback = jest.fn();
      adaptive.onModeChange(modeChangeCallback);

      adaptive.mode = PERFORMANCE_MODES.ACCURACY_MODE;
      adaptive.isMobileDevice = false;
      adaptive.batteryLevel = 25;

      // Simulate battery drop below 20%
      adaptive.batteryLevel = 15;
      const newMode = adaptive.determineMode();

      expect(newMode).toBe(PERFORMANCE_MODES.SPEED_MODE);
    });

    it('should maintain mode consistency', async () => {
      await adaptive.init();

      const status1 = adaptive.getStatus();
      const status2 = adaptive.getStatus();

      expect(status1.mode).toBe(status2.mode);
      expect(status1.isMobileDevice).toBe(status2.isMobileDevice);
    });
  });
});
