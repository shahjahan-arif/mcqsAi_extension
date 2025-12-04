#!/usr/bin/env node

/**
 * API Diagnostic Tool
 * Checks API configuration and connectivity
 */

const apiKey = 'AIzaSyC3KNHIKKXGYhnjtmJ9o2FYTTLWZ6pXRj8';
const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

console.log('🔍 API Diagnostic Report\n');
console.log('API Key:', apiKey.substring(0, 10) + '...' + apiKey.substring(-10));
console.log('Endpoint:', endpoint);
console.log('');

async function testEndpoint() {
  console.log('🧪 Testing API endpoint...\n');

  try {
    const response = await fetch(`${endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'What is 2+2?'
          }]
        }]
      })
    });

    console.log('Status Code:', response.status);
    console.log('Status Text:', response.statusText);

    const data = await response.json();
    console.log('\nResponse:');
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ API is working!');
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log('Answer:', answer);
    } else {
      console.log('\n❌ API returned an error');
      if (data.error) {
        console.log('Error Code:', data.error.code);
        console.log('Error Message:', data.error.message);
      }
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testEndpoint();
