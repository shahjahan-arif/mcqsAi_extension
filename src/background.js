/**
 * Background Service Worker
 * Handles extension initialization and API communication
 */

import { GeminiClient } from './api/gemini-client.js';
import { CachingSystem } from './caching/cache-system.js';

console.log('🚀 Quiz Solver AI - Background Service Worker Loaded');

// Initialize cache
const cache = new CachingSystem();
cache.init().then(() => {
  console.log('✅ Cache initialized');
}).catch(error => {
  console.error('❌ Cache initialization failed:', error);
});

// Get API key from storage
chrome.storage.local.get(['geminiApiKey'], (result) => {
  if (result.geminiApiKey) {
    const apiClient = new GeminiClient(result.geminiApiKey);
    console.log('✅ Gemini API client initialized');
    
    // Store in global for content scripts
    globalThis.apiClient = apiClient;
    globalThis.cache = cache;
  } else {
    console.warn('⚠️ API key not found. Please set it in settings.');
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_ANSWER') {
    handleGetAnswer(request.question, request.context)
      .then(answer => sendResponse({ success: true, answer }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
});

async function handleGetAnswer(question, context) {
  if (!globalThis.apiClient) {
    throw new Error('API client not initialized');
  }
  
  const result = await globalThis.apiClient.getAnswer(question, context);
  return result;
}
