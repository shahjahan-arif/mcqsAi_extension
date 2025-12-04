#!/usr/bin/env node

/**
 * List Available Gemini Models
 * Shows which models are available for your API key
 */

const apiKey = 'AIzaSyC3KNHIKKXGYhnjtmJ9o2FYTTLWZ6pXRj8';

console.log('🔍 Listing Available Gemini Models\n');

async function listModels() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    const data = await response.json();

    if (data.models) {
      console.log('✅ Available Models:\n');
      data.models.forEach((model, index) => {
        console.log(`${index + 1}. ${model.name}`);
        console.log(`   Display Name: ${model.displayName}`);
        console.log(`   Description: ${model.description}`);
        console.log('');
      });
    } else {
      console.log('Response:', JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listModels();
