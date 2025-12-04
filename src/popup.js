/**
 * Popup Script
 * Handles popup UI interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  initializePopup();
});

function initializePopup() {
  // Check API key status
  chrome.storage.local.get(['geminiApiKey'], (result) => {
    const statusEl = document.getElementById('status');
    if (result.geminiApiKey) {
      statusEl.innerHTML = `
        <div class="status-label">Status</div>
        <div class="status-value">✅ API Key Configured</div>
      `;
    } else {
      statusEl.classList.add('error');
      statusEl.innerHTML = `
        <div class="status-label">Status</div>
        <div class="status-value">⚠️ API Key Not Set</div>
      `;
    }
  });
  
  // Button listeners
  const detectBtn = document.getElementById('detectBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const saveBtn = document.getElementById('saveBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  
  if (detectBtn) detectBtn.addEventListener('click', detectQuiz);
  if (settingsBtn) settingsBtn.addEventListener('click', showSettings);
  if (saveBtn) saveBtn.addEventListener('click', saveSettings);
  if (cancelBtn) cancelBtn.addEventListener('click', hideSettings);
}

function detectQuiz() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) {
      alert('No active tab found');
      return;
    }
    
    chrome.tabs.sendMessage(tabs[0].id, { type: 'DETECT_QUIZ' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError);
        const statusEl = document.getElementById('status');
        statusEl.classList.add('error');
        statusEl.innerHTML = `
          <div class="status-label">Status</div>
          <div class="status-value">❌ Content script not loaded</div>
        `;
        return;
      }
      
      const statusEl = document.getElementById('status');
      if (response && response.isQuiz) {
        statusEl.classList.remove('error');
        statusEl.innerHTML = `
          <div class="status-label">Status</div>
          <div class="status-value">✅ Quiz Detected!</div>
        `;
      } else {
        statusEl.classList.add('error');
        statusEl.innerHTML = `
          <div class="status-label">Status</div>
          <div class="status-value">❌ No Quiz Detected</div>
        `;
      }
    });
  });
}

function showSettings() {
  document.getElementById('settingsSection').style.display = 'block';
  
  // Load current API key
  chrome.storage.local.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      document.getElementById('apiKeyInput').value = result.geminiApiKey;
    }
  });
}

function hideSettings() {
  document.getElementById('settingsSection').style.display = 'none';
}

function saveSettings() {
  const apiKey = document.getElementById('apiKeyInput').value;
  
  if (!apiKey) {
    alert('Please enter an API key');
    return;
  }
  
  chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
    alert('✅ Settings saved!');
    hideSettings();
    initializePopup();
  });
}
