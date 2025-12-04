# Story 3.1: Implement Device Detection and Mode Switching

Status: ready-for-dev

## Story

As a developer,
I want to implement device detection and adaptive mode switching,
So that the system automatically optimizes for desktop or mobile.

## Acceptance Criteria

1. **Given** the extension is running on a device
   **When** it initializes
   **Then** it detects device type: desktop or mobile

2. **And** it checks battery level (if available)

3. **And** it switches to appropriate mode:
   - Desktop mode: Full detection (CSS + XPath + DOM + AI)
   - Mobile mode: Speed mode (CSS + XPath only, cache-first)

4. **And** it switches to speed mode if battery < 20%

5. **And** it stores mode preference in chrome.storage.local

6. **And** it allows manual override in settings

## Technical Implementation

```javascript
class AdaptivePerformance {
  constructor() {
    this.mode = null;
    this.isMobileDevice = false;
    this.batteryLevel = 100;
  }

  async init() {
    this.isMobileDevice = this.detectMobile();
    this.batteryLevel = await this.getBatteryLevel();
    this.mode = this.determineMode();
    
    await this.savePreference();
    this.monitorBattery();
  }

  detectMobile() {
    // User agent detection
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    // Screen size detection
    const isMobileScreen = window.innerWidth < 768;
    
    return isMobileUA || isMobileScreen;
  }

  async getBatteryLevel() {
    try {
      const battery = await navigator.getBattery?.();
      return battery?.level * 100 || 100;
    } catch {
      return 100; // Default to full battery if API unavailable
    }
  }

  determineMode() {
    if (this.isMobileDevice || this.batteryLevel < 20) {
      return 'SPEED_MODE';
    }
    return 'ACCURACY_MODE';
  }

  async savePreference() {
    await chrome.storage.local.set({
      performanceMode: this.mode,
      isMobileDevice: this.isMobileDevice,
      batteryLevel: this.batteryLevel
    });
  }

  monitorBattery() {
    if (navigator.getBattery) {
      navigator.getBattery().then(battery => {
        battery.addEventListener('levelchange', () => {
          const newLevel = battery.level * 100;
          if (newLevel < 20 && this.mode !== 'SPEED_MODE') {
            this.mode = 'SPEED_MODE';
            this.savePreference();
          } else if (newLevel >= 20 && this.mode === 'SPEED_MODE' && !this.isMobileDevice) {
            this.mode = 'ACCURACY_MODE';
            this.savePreference();
          }
        });
      });
    }
  }

  getConfig() {
    if (this.mode === 'SPEED_MODE') {
      return {
        useCSSSelectors: true,
        useXPath: true,
        useDOMAnalysis: false,
        useAIVerification: false,
        enableContinuousMonitoring: false,
        cacheFirst: true
      };
    } else {
      return {
        useCSSSelectors: true,
        useXPath: true,
        useDOMAnalysis: true,
        useAIVerification: true,
        enableContinuousMonitoring: true,
        cacheFirst: false
      };
    }
  }
}
```

## Tasks / Subtasks

- [ ] Create adaptive performance module: `src/performance/adaptive.js`
  - [ ] Implement device detection
  - [ ] Implement battery monitoring
  - [ ] Implement mode switching

- [ ] Create unit tests: `tests/performance/adaptive.test.js`
  - [ ] Test device detection
  - [ ] Test battery monitoring
  - [ ] Test mode switching

## Dev Notes

**Architecture Reference:** [Source: docs/architecture.md#AD-002: Adaptive Performance Architecture]

**Performance Modes:**
- ACCURACY_MODE: Desktop, high battery
- SPEED_MODE: Mobile, low battery

**Detection Methods:**
- User agent parsing
- Screen size detection
- Battery Status API

**Performance Targets:**
- Desktop: 100-200ms detection, 90%+ accuracy
- Mobile: 50-100ms detection, 85%+ accuracy

## References

- [Architecture: AD-002 - Adaptive Performance Architecture](docs/architecture.md#ad-002-adaptive-performance-architecture)
- [Epic 3: Performance & Adaptation](docs/epics.md#epic-3-performance--adaptation---adaptive-performance)

## Dev Agent Record

### Completion Notes

- [ ] Code review completed
- [ ] Tests passing
- [ ] Device detection verified
- [ ] Battery monitoring tested
- [ ] Ready for Story 3.2

### File List

- src/performance/adaptive.js
- tests/performance/adaptive.test.js
