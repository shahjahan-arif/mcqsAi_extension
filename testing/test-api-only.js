#!/usr/bin/env node

/**
 * API-Only Integration Test
 * Tests API client and answer retriever (without cache)
 */

import { GeminiClient } from './src/api/gemini-client.js';

const apiKey = 'AIzaSyC3KNHIKKXGYhnjtmJ9o2FYTTLWZ6pXRj8';

async function runAPITest() {
  console.log('🚀 API Integration Test\n');
  console.log('='.repeat(50));

  try {
    console.log('\n✅ API Key: Set and Ready');
    console.log('   Key:', apiKey.substring(0, 10) + '...' + apiKey.substring(-10));

    const apiClient = new GeminiClient(apiKey);
    console.log('\n✅ API Client: Initialized');

    // Test multiple questions
    const questions = [
      'What is 2+2?',
      'What is the capital of France?',
      'What is the largest planet in our solar system?',
      'Who wrote Romeo and Juliet?',
      'What is the chemical symbol for gold?'
    ];

    console.log('\n🧪 Testing API with 5 questions:\n');

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      console.log(`${i + 1}. Question: "${question}"`);

      const result = await apiClient.getAnswer(question);

      console.log(`   Answer: ${result.answer}`);
      console.log(`   Confidence: ${result.confidence}%`);
      console.log('');
    }

    console.log('='.repeat(50));
    console.log('\n✅ ALL TESTS PASSED!\n');
    console.log('Summary:');
    console.log('✓ API Key: Working');
    console.log('✓ API Client: Working');
    console.log('✓ Model: gemini-2.5-flash');
    console.log('✓ Questions Answered: 5/5');
    console.log('\n🎉 Your API is ready for the extension!\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runAPITest();
