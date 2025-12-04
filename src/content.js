/**
 * Content Script
 * Runs on quiz websites and detects quiz content
 */

console.log('🧪 Quiz Solver AI - Content Script Loaded');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'DETECT_QUIZ') {
    const isQuiz = detectQuiz();
    sendResponse({ isQuiz });
  }
});

function detectQuiz() {
  // Simple detection: look for common quiz patterns
  const text = document.body.innerText;
  
  const hasQuestions = text.includes('?');
  const hasOptions = /^[A-D]\)|^\d\./m.test(text);
  const hasQuestionCounter = /Question\s+\d+\s+of\s+\d+/i.test(text);
  
  return hasQuestions && (hasOptions || hasQuestionCounter);
}

// Inject detection into page
window.addEventListener('load', () => {
  const isQuiz = detectQuiz();
  if (isQuiz) {
    console.log('✅ Quiz detected on this page');
    document.body.style.borderTop = '3px solid #4CAF50';
  }
});
