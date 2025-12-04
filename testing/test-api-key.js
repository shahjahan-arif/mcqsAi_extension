#!/usr/bin/env node

/**
 * Test API Key Verification
 * Verifies that the Gemini API key is working correctly
 */

import { GeminiClient } from './src/api/gemini-client.js';

async function testAPIKey() {
  const apiKey = 'AIzaSyC3KNHIKKXGYhnjtmJ9o2FYTTLWZ6pXRj8';

  console.log('🧪 Testing Gemini API Key...\n');

  if (!apiKey) {
    console.error('❌ API key not found');
    process.exit(1);
  }

  console.log('✅ API key found');
  console.log(`Key: ${apiKey.substring(0, 10)}...${apiKey.substring(-10)}\n`);

  try {
    console.log('🔄 Initializing Gemini API client...');
    const client = new GeminiClient(apiKey);
    console.log('✅ Client initialized\n');

    console.log('🔄 Making test API call...');
    console.log('Question: "What is 2+2?"\n');

    const result = await client.getAnswer('What is 2+2?');

    console.log('✅ API call successful!\n');
    console.log('📝 Response:');
    console.log('Answer:', result.answer);
    console.log('Confidence:', result.confidence + '%');
    console.log('Error:', result.error || 'None');

    console.log('\n✅ API Key is working correctly!');
    console.log('\n🎉 You can now use this API key in your extension.');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ API call failed!');
    console.error('Error:', error.message);
    console.error('\nPossible issues:');
    console.error('1. API key is invalid');
    console.error('2. Generative Language API is not enabled');
    console.error('3. Network connection issue');
    console.error('4. API quota exceeded');

    process.exit(1);
  }
}

testAPIKey();
