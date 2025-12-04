/**
 * Adaptive Performance Module
 * Detects device type and battery level, switches between performance modes
 */

export const PERFORMANCE_MODES = {
  ACCURACY_MODE: 'ACCURACY_MODE',
  SPEED_MODE: 'SPEED_MODE'
};

/**
 * AdaptivePerformance manages device detection and mode switching
 * Automatically optimizes for desktop or mobile environments
 */
export class AdaptivePerformance {
  constructor() {
    this.mode = null;
    this.isMobileDevice = false;
    this.batteryLevel = 100;
    this.batteryMonitor = null;
    this.listeners = [];
  }

  /**
   * Initializes adaptive performance detection
   * Detects device type, battery level, and determines optimal mode
   *
   * @returns {Promise<void>}
   */
  async init() {
    this.isMobileDevice = this.detectMobile();
    this.batteryLevel = await this.getBatteryLevel();
    this.mode = this.determineMode();

    await this.savePreference();
    this.monitorBattery();
  }

  /**
   * Detects if device is mobile based on user agent and screen size
   * Uses multiple detection methods for accuracy
   *
   * @returns {boolean} True if device is mobile
   */
  detectMobile() {
    // User agent detection
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

    // Screen size detection (common mobile breakpoint)
    const isMobileScreen = typeof window !== 'undefined' && window.innerWidth < 768;

    return isMobileUA || isMobileScreen;
  }

  /**
   * Gets current battery level from Battery Status API
   * Falls back to 100% if API is unavailable
   *
   * @returns {Promise<number>} Battery level as percentage (0-100)
   */
  async getBatteryLevel() {
    try {
      // Battery Status API (deprecated but still supported)
      if (navigator.getBattery) {
        const battery = await navigator.getBattery();
        return Math.round(battery.level * 100);
      }

      // Fallback: assume full battery if API unavailable
      return 100;
    } catch (error) {
      console.warn('Battery Status API unavailable:', error.message);
      return 100;
    }
  }

  /**
   * Determines optimal performance mode based on device and battery
   * Mobile or low battery (<20%) → SPEED_MODE
   * Desktop with good battery → ACCURACY_MODE
   *
   * @returns {string} Performance mode constant
   */
  determineMode() {
    if (this.isMobileDevice || this.batteryLevel < 20) {
      return PERFORMANCE_MODES.SPEED_MODE;
    }
    return PERFORMANCE_MODES.ACCURACY_MODE;
  }

  /**
   * Saves current performance preference to chrome.storage.local
   *
   * @returns {Promise<void>}
   */
  async savePreference() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      try {
        await chrome.storage.local.set({
          performanceMode: this.mode,
          isMobileDevice: this.isMobileDevice,
          batteryLevel: this.batteryLevel,
          lastUpdated: Date.now()
        });
      } catch (error) {
        console.warn('Failed to save preference:', error.message);
      }
    }
  }

  /**
   * Loads performance preference from chrome.storage.local
   *
   * @returns {Promise<Object>} Stored preference object
   */
  async loadPreference() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      try {
        return new Promise((resolve) => {
          chrome.storage.local.get(['performanceMode', 'isMobileDevice', 'batteryLevel'], (result) => {
            resolve(result);
          });
        });
      } catch (error) {
        console.warn('Failed to load preference:', error.message);
        return {};
      }
    }
    return {};
  }

  /**
   * Monitors battery level changes and switches mode if needed
   * Listens to Battery Status API events
   *
   * @returns {void}
   */
  monitorBattery() {
    if (typeof navigator !== 'undefined' && navigator.getBattery) {
      navigator.getBattery().then((battery) => {
        this.batteryMonitor = battery;

        const handleLevelChange = async () => {
          const newLevel = Math.round(battery.level * 100);
          const oldMode = this.mode;

          this.batteryLevel = newLevel;

          // Switch to SPEED_MODE if battery drops below 20%
          if (newLevel < 20 && this.mode !== PERFORMANCE_MODES.SPEED_MODE) {
            this.mode = PERFORMANCE_MODES.SPEED_MODE;
            await this.savePreference();
            this.notifyListeners('modeChanged', { oldMode, newMode: this.mode });
          }
          // Switch back to ACCURACY_MODE if battery recovers and device is not mobile
          else if (newLevel >= 20 && this.mode === PERFORMANCE_MODES.SPEED_MODE && !this.isMobileDevice) {
            this.mode = PERFORMANCE_MODES.ACCURACY_MODE;
            await this.savePreference();
            this.notifyListeners('modeChanged', { oldMode, newMode: this.mode });
          }

          this.notifyListeners('batteryChanged', { level: newLevel });
        };

        battery.addEventListener('levelchange', handleLevelChange);
      }).catch((error) => {
        console.warn('Battery monitoring unavailable:', error.message);
      });
    }
  }

  /**
   * Gets configuration object for current performance mode
   * SPEED_MODE: CSS + XPath only, cache-first
   * ACCURACY_MODE: Full detection with AI verification
   *
   * @returns {Object} Configuration object
   */
  getConfig() {
    if (this.mode === PERFORMANCE_MODES.SPEED_MODE) {
      return {
        useCSSSelectors: true,
        useXPath: true,
        useDOMAnalysis: false,
        useAIVerification: false,
        enableContinuousMonitoring: false,
        cacheFirst: true,
        maxDetectionTime: 100
      };
    }

    // ACCURACY_MODE
    return {
      useCSSSelectors: true,
      useXPath: true,
      useDOMAnalysis: true,
      useAIVerification: true,
      enableContinuousMonitoring: true,
      cacheFirst: false,
      maxDetectionTime: 200
    };
  }

  /**
   * Gets current performance status
   *
   * @returns {Object} Status object with mode, device type, battery level
   */
  getStatus() {
    return {
      mode: this.mode,
      isMobileDevice: this.isMobileDevice,
      batteryLevel: this.batteryLevel,
      config: this.getConfig()
    };
  }

  /**
   * Manually sets performance mode (override)
   * Useful for user settings
   *
   * @param {string} mode - Performance mode constant
   * @returns {Promise<void>}
   */
  async setMode(mode) {
    if (!Object.values(PERFORMANCE_MODES).includes(mode)) {
      throw new Error(`Invalid mode: ${mode}`);
    }

    const oldMode = this.mode;
    this.mode = mode;
    await this.savePreference();
    this.notifyListeners('modeChanged', { oldMode, newMode: this.mode });
  }

  /**
   * Registers a listener for performance events
   *
   * @param {Function} callback - Callback function
   * @returns {void}
   */
  onModeChange(callback) {
    this.listeners.push({ event: 'modeChanged', callback });
  }

  /**
   * Registers a listener for battery changes
   *
   * @param {Function} callback - Callback function
   * @returns {void}
   */
  onBatteryChange(callback) {
    this.listeners.push({ event: 'batteryChanged', callback });
  }

  /**
   * Notifies all listeners of an event
   *
   * @param {string} event - Event name
   * @param {Object} data - Event data
   * @returns {void}
   */
  notifyListeners(event, data) {
    this.listeners
      .filter(listener => listener.event === event)
      .forEach(listener => {
        try {
          listener.callback(data);
        } catch (error) {
          console.error(`Error in listener for ${event}:`, error);
        }
      });
  }

  /**
   * Removes all listeners
   *
   * @returns {void}
   */
  clearListeners() {
    this.listeners = [];
  }

  /**
   * Stops battery monitoring
   *
   * @returns {void}
   */
  stopMonitoring() {
    if (this.batteryMonitor) {
      this.batteryMonitor.removeEventListener('levelchange', () => {});
      this.batteryMonitor = null;
    }
  }
}
