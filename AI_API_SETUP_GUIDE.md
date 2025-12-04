# AI API Setup and Testing Guide

## Overview

This guide explains how to set up the Gemini AI API integration and test it with the quiz solver extension.

---

## Part 1: Getting Your Gemini API Key

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "NEW PROJECT"
4. Enter project name: `Quiz Solver AI`
5. Click "CREATE"
6. Wait for the project to be created (2-3 minutes)

### Step 2: Enable the Gemini API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Generative Language API"
3. Click on it
4. Click "ENABLE"
5. Wait for it to be enabled

### Step 3: Create an API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "CREATE CREDENTIALS" > "API Key"
3. Copy the API key (you'll need this)
4. Click "RESTRICT KEY"
5. Under "API restrictions", select "Generative Language API"
6. Click "SAVE"

### Step 4: Store Your API Key Safely

**Option A: Environment Variable (Recommended)**

```bash
# On macOS/Linux, add to ~/.zshrc or ~/.bash_profile
export GEMINI_API_KEY="your-api-key-here"

AIzaSyC3KNHIKKXGYhnjtmJ9o2FYTTLWZ6pXRj8

# Then reload:
source ~/.zshrc
```

**Option B: Create a .env file**

```bash
# Create file: .env
GEMINI_API_KEY=your-api-key-here
```

**Option C: Store in extension settings**

In the extension's background script, store it in `chrome.storage.local`:

```javascript
chrome.storage.local.set({
  geminiApiKey: 'your-api-key-here'
});
```

---

## Part 2: Configure the Extension

### Step 1: Update the API Client

Edit `src/api/gemini-client.js`:

```javascript
export class GeminiClient {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = apiKey;
    this.endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    this.timeout = 5000;
    this.maxRetries = 2;
  }

  // Rest of the implementation...
}
```

### Step 2: Initialize in Background Script

Create or update `src/background.js`:

```javascript
import { GeminiClient } from './api/gemini-client.js';
import { CachingSystem } from './caching/cache-system.js';

// Initialize cache
const cache = new CachingSystem();
await cache.init();

// Get API key from storage
chrome.storage.local.get(['geminiApiKey'], (result) => {
  if (result.geminiApiKey) {
    const apiClient = new GeminiClient(result.geminiApiKey);
    console.log('✅ Gemini API client initialized');
  } else {
    console.error('❌ API key not found. Please set GEMINI_API_KEY');
  }
});
```

### Step 3: Add API Key to Extension Settings

Create `src/settings/settings.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Quiz Solver Settings</title>
  <style>
    body { font-family: Arial; padding: 20px; }
    .setting { margin: 20px 0; }
    input { width: 300px; padding: 8px; }
    button { padding: 10px 20px; background: #4CAF50; color: white; border: none; cursor: pointer; }
  </style>
</head>
<body>
  <h1>Quiz Solver Settings</h1>
  
  <div class="setting">
    <label>Gemini API Key:</label>
    <input type="password" id="apiKey" placeholder="Enter your API key">
    <button onclick="saveSettings()">Save</button>
  </div>

  <script>
    // Load saved settings
    chrome.storage.local.get(['geminiApiKey'], (result) => {
      if (result.geminiApiKey) {
        document.getElementById('apiKey').value = result.geminiApiKey;
      }
    });

    // Save settings
    function saveSettings() {
      const apiKey = document.getElementById('apiKey').value;
      if (!apiKey) {
        alert('Please enter an API key');
        return;
      }
      
      chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
        alert('✅ Settings saved!');
      });
    }
  </script>
</body>
</html>
```

---

## Part 3: Testing the API Integration

### Test 1: Basic API Call

Create `test-api-basic.js`:

```javascript
import { GeminiClient } from './src/api/gemini-client.js';

async function testBasicAPI() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not set');
    process.exit(1);
  }

  const client = new GeminiClient(apiKey);
  
  try {
    console.log('🧪 Testing basic API call...');
    
    const result = await client.getAnswer('What is 2+2?');
    
    console.log('✅ API call successful!');
    console.log('Answer:', result.answer);
    console.log('Confidence:', result.confidence);
    
  } catch (error) {
    console.error('❌ API call failed:', error.message);
    process.exit(1);
  }
}

testBasicAPI();
```

Run the test:

```bash
export GEMINI_API_KEY="your-api-key-here"
node test-api-basic.js
```

### Test 2: Cache Integration

Create `test-api-with-cache.js`:

```javascript
import { GeminiClient } from './src/api/gemini-client.js';
import { CachingSystem } from './src/caching/cache-system.js';
import { AnswerRetriever } from './src/answer/retriever.js';

async function testCacheIntegration() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not set');
    process.exit(1);
  }

  try {
    console.log('🧪 Testing cache integration...');
    
    // Initialize cache
    const cache = new CachingSystem();
    await cache.init();
    console.log('✅ Cache initialized');
    
    // Initialize API client
    const apiClient = new GeminiClient(apiKey);
    console.log('✅ API client initialized');
    
    // Initialize retriever
    const retriever = new AnswerRetriever(cache, apiClient);
    console.log('✅ Retriever initialized');
    
    // First call (cache miss)
    console.log('\n📝 First call (cache miss)...');
    const result1 = await retriever.getAnswer('What is the capital of France?');
    console.log('Source:', result1.source);
    console.log('Answer:', result1.answer);
    console.log('Time:', result1.elapsed, 'ms');
    
    // Second call (cache hit)
    console.log('\n📝 Second call (cache hit)...');
    const result2 = await retriever.getAnswer('What is the capital of France?');
    console.log('Source:', result2.source);
    console.log('Answer:', result2.answer);
    console.log('Time:', result2.elapsed, 'ms');
    
    // Check stats
    const stats = retriever.getStats();
    console.log('\n📊 Statistics:');
    console.log('Hits:', stats.hits);
    console.log('Misses:', stats.misses);
    console.log('Hit Rate:', stats.hitRate);
    
    // Cleanup
    cache.close();
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testCacheIntegration();
```

Run the test:

```bash
export GEMINI_API_KEY="your-api-key-here"
node test-api-with-cache.js
```

### Test 3: Rate Limiting

Create `test-rate-limiting.js`:

```javascript
import { GeminiClient } from './src/api/gemini-client.js';
import { RateLimiter } from './src/api/rate-limiter.js';
import { RequestQueue } from './src/api/request-queue.js';

async function testRateLimiting() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not set');
    process.exit(1);
  }

  try {
    console.log('🧪 Testing rate limiting...');
    
    const apiClient = new GeminiClient(apiKey);
    const rateLimiter = new RateLimiter();
    const queue = new RequestQueue(rateLimiter, apiClient);
    
    console.log('✅ Rate limiter initialized');
    
    // Enqueue multiple requests
    console.log('\n📝 Enqueueing 5 requests...');
    const promises = [];
    
    for (let i = 1; i <= 5; i++) {
      promises.push(
        queue.enqueue(`Question ${i}: What is ${i}+${i}?`)
      );
    }
    
    // Wait for all requests
    const results = await Promise.all(promises);
    
    console.log('\n✅ All requests completed!');
    console.log('Results:', results.length);
    
    // Check stats
    const stats = rateLimiter.getStats();
    console.log('\n📊 Rate Limiter Stats:');
    console.log('Requests this minute:', stats.requestsThisMinute);
    console.log('Daily count:', stats.dailyCount);
    console.log('Minute remaining:', stats.minuteRemaining);
    console.log('Daily remaining:', stats.dailyRemaining);
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testRateLimiting();
```

Run the test:

```bash
export GEMINI_API_KEY="your-api-key-here"
node test-rate-limiting.js
```

---

## Part 4: Testing in the Browser Extension

### Step 1: Load the Extension

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select your project folder
6. The extension should appear in your extensions list

### Step 2: Set API Key

1. Click the extension icon
2. Go to Settings
3. Enter your Gemini API key
4. Click Save

### Step 3: Test on a Quiz Website

1. Go to a quiz website (e.g., Quizlet, Khan Academy)
2. Right-click on a quiz question
3. Select "Mark as Quiz" (if implemented)
4. The extension should detect the quiz
5. Hover over a question to see the AI-generated answer

### Step 4: Check Console Logs

1. Right-click the extension icon
2. Select "Inspect popup"
3. Go to Console tab
4. You should see logs like:
   - `✅ Gemini API client initialized`
   - `✅ Cache initialized`
   - `Answer: [AI-generated answer]`

---

## Part 5: Troubleshooting

### Issue: "API key is required"

**Solution:**
```bash
# Check if API key is set
echo $GEMINI_API_KEY

# If empty, set it:
export GEMINI_API_KEY="your-api-key-here"
```

### Issue: "Invalid API key"

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Check if the API key is valid
3. Verify the Generative Language API is enabled
4. Create a new API key if needed

### Issue: "Rate limit exceeded"

**Solution:**
- Wait a few minutes before making more requests
- The free tier allows 15 requests per minute
- Check `rateLimiter.getStats()` to see current usage

### Issue: "Timeout error"

**Solution:**
- Check your internet connection
- Increase timeout in `src/api/gemini-client.js`:
  ```javascript
  this.timeout = 10000; // 10 seconds instead of 5
  ```

### Issue: "Cache not working"

**Solution:**
```javascript
// Clear cache and reinitialize
const cache = new CachingSystem();
await cache.clear();
await cache.init();
```

---

## Part 6: Performance Monitoring

### Monitor API Performance

```javascript
// In your extension code
const stats = retriever.getStats();
console.log('Cache Hit Rate:', stats.hitRate);
console.log('Average Response Time:', stats.avgTime);

// Expected values:
// - Cache hit: <5ms
// - Cache miss: <1000ms
// - Hit rate: 70-80% after warmup
```

### Monitor Rate Limiting

```javascript
const rateLimiterStats = rateLimiter.getStats();
console.log('Requests this minute:', rateLimiterStats.requestsThisMinute);
console.log('Daily remaining:', rateLimiterStats.dailyRemaining);

// Expected values:
// - Per minute: 0-15 requests
// - Per day: 0-1500 requests
```

---

## Part 7: Production Checklist

Before deploying to production:

- [ ] API key is securely stored (not in code)
- [ ] Error handling is implemented
- [ ] Rate limiting is working
- [ ] Cache is functioning
- [ ] Tests are passing
- [ ] Performance targets are met
- [ ] User feedback is collected
- [ ] Monitoring is set up

---

## Quick Reference

### Environment Setup

```bash
# Set API key
export GEMINI_API_KEY="your-api-key-here"

# Run tests
node test-api-basic.js
node test-api-with-cache.js
node test-rate-limiting.js

# Run full test suite
npm test
```

### API Endpoints

```
Gemini 1.5 Flash:
https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent

Rate Limits:
- 15 requests per minute
- 1500 requests per day
- Free tier

Timeout: 5 seconds
Retries: 2 (with exponential backoff)
```

### Key Files

```
src/api/gemini-client.js          - API client
src/caching/cache-system.js       - Cache system
src/answer/retriever.js           - Answer retriever
src/api/rate-limiter.js           - Rate limiter
src/api/request-queue.js          - Request queue
src/background.js                 - Extension background
src/settings/settings.html        - Settings page
```

---

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the test files for examples
3. Check Google Cloud Console for API status
4. Review extension console logs (chrome://extensions/)

---

## Next Steps

1. ✅ Get Gemini API key
2. ✅ Configure the extension
3. ✅ Run tests
4. ✅ Load extension in Chrome
5. ✅ Test on quiz websites
6. ✅ Monitor performance
7. ✅ Deploy to production

Good luck! 🚀
