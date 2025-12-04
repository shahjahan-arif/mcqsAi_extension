/**
 * Content Script
 * Runs on quiz websites and detects quiz content
 * Auto-displays answers for detected questions
 */

console.log('🧪 Quiz Solver AI - Content Script Loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'DETECT_QUIZ') {
    const isQuiz = detectQuiz();
    sendResponse({ isQuiz });
  }
});

function detectQuiz() {
  // Enhanced detection: look for common quiz patterns
  const text = document.body.innerText;
  
  const hasQuestions = text.includes('?');
  const hasOptions = /[A-D]\)|^\d+\./m.test(text);
  const hasQuestionCounter = /Question\s+\d+/i.test(text);
  const hasMultipleChoice = /multiple\s+choice|mcq|quiz|exam|test|answer|option/i.test(text);
  
  // More lenient detection - just need questions + one indicator
  return hasQuestions && (hasOptions || hasQuestionCounter || hasMultipleChoice);
}

// Find all question elements
function findQuestionElements() {
  const questions = [];
  const seen = new Set();
  
  // Look for common question containers
  const selectors = [
    '[class*="question"]',
    '[class*="quiz"]',
    '[class*="exam"]',
    '[id*="question"]',
    '[id*="quiz"]',
    'div[role="article"]',
    '.question-text',
    '.quiz-question',
    'p, div, span'
  ];
  
  selectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const text = el.innerText?.trim();
        if (text && text.includes('?') && text.length > 5 && text.length < 1000) {
          // Avoid duplicates
          if (!seen.has(text)) {
            seen.add(text);
            questions.push({
              element: el,
              text: text
            });
          }
        }
      });
    } catch (e) {
      // Invalid selector, skip
    }
  });
  
  return questions;
}

// Display answer overlay on question
function displayAnswerOverlay(questionElement, answer, confidence) {
  // Create overlay container
  const container = document.createElement('div');
  container.style.cssText = `
    display: block;
    margin-top: 8px;
    padding: 12px;
    background: #4CAF50;
    color: white;
    border-radius: 4px;
    font-size: 13px;
    z-index: 10000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    font-family: Arial, sans-serif;
  `;
  
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <span style="font-weight: bold;">✓ AI Answer (${confidence}%)</span>
      <button class="quiz-btn-close" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; padding: 0;">×</button>
    </div>
    <div class="quiz-answer-text" style="margin-bottom: 8px; line-height: 1.4;">${answer}</div>
    <button class="quiz-btn-copy" style="background: white; color: #4CAF50; border: none; padding: 6px 12px; border-radius: 3px; cursor: pointer; font-weight: bold; font-size: 12px;">Copy Answer</button>
  `;
  
  // Add event listeners
  container.querySelector('.quiz-btn-close').addEventListener('click', () => {
    container.remove();
  });
  
  container.querySelector('.quiz-btn-copy').addEventListener('click', () => {
    navigator.clipboard.writeText(answer);
    alert('Answer copied!');
  });
  
  // Insert after question element
  questionElement.parentNode.insertBefore(container, questionElement.nextSibling);
}

// Auto-detect and process questions
async function autoDetectAndProcess() {
  const isQuiz = detectQuiz();
  
  if (isQuiz) {
    console.log('✅ Quiz detected on this page');
    document.body.style.borderTop = '3px solid #4CAF50';
    
    // Find questions
    const questions = findQuestionElements();
    console.log(`Found ${questions.length} questions`);
    
    if (questions.length === 0) {
      console.warn('⚠️ No questions found despite quiz detection');
      return;
    }
    
    // Process each question with delay to avoid rate limiting
    questions.forEach((q, index) => {
      setTimeout(() => {
        console.log(`Processing question ${index + 1}: ${q.text.substring(0, 50)}...`);
        
        // Get answer from background script
        chrome.runtime.sendMessage(
          { type: 'GET_ANSWER', question: q.text },
          (response) => {
            if (response && response.success && response.answer) {
              console.log(`✅ Answer ${index + 1}: ${response.answer.answer}`);
              displayAnswerOverlay(q.element, response.answer.answer, response.answer.confidence || 85);
            } else {
              console.error(`❌ Failed to get answer for question ${index + 1}:`, response?.error);
            }
          }
        );
      }, index * 500); // Stagger requests
    });
  } else {
    console.log('ℹ️ No quiz detected on this page');
  }
}

// Run on page load
window.addEventListener('load', () => {
  console.log('Page loaded, starting detection...');
  setTimeout(autoDetectAndProcess, 1000);
});

// Also run immediately in case page is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log('Page already loaded, starting detection...');
  setTimeout(autoDetectAndProcess, 500);
}
