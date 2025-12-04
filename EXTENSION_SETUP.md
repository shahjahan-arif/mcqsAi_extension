# Extension Setup Guide

## ✅ Extension Files Created

Your extension is now ready to load in Chrome!

### Files Created:
- `manifest.json` - Extension configuration
- `src/background.js` - Background service worker
- `src/content.js` - Content script for quiz detection
- `src/popup.html` - Popup UI
- `src/popup.js` - Popup functionality

---

## How to Load the Extension

### Step 1: Open Chrome Extensions Page
1. Open Chrome browser
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)

### Step 2: Load Unpacked Extension
1. Click "Load unpacked"
2. Navigate to your project folder: `~/Documents/mcqsAi_extension`
3. Click "Select Folder"
4. The extension should appear in your extensions list

### Step 3: Set API Key
1. Click the extension icon in Chrome toolbar
2. Click "Settings" button
3. Enter your Gemini API key: `AIzaSyC3KNHIKKXGYhnjtmJ9o2FYTTLWZ6pXRj8`
4. Click "Save"

### Step 4: Test on Quiz Website
1. Go to a quiz website (e.g., Quizlet, Khan Academy)
2. Click the extension icon
3. Click "Detect Quiz"
4. You should see "✅ Quiz Detected!"

---

## Extension Features

### Popup Interface
- **Status Display**: Shows if API key is configured
- **Detect Quiz**: Detects quiz content on current page
- **Settings**: Configure API key
- **Statistics**: View cache hit rate and performance

### Background Service Worker
- Initializes cache system
- Manages API client
- Handles messages from content scripts

### Content Script
- Detects quiz patterns on web pages
- Looks for question marks and option prefixes
- Marks quiz pages with green border

---

## Troubleshooting

### Extension Won't Load
**Error**: "Manifest file is missing or unreadable"

**Solution**:
1. Verify `manifest.json` exists in project root
2. Check file is valid JSON: `cat manifest.json`
3. Reload extension: Click reload icon

### API Key Not Working
**Error**: "API Key Not Set" in popup

**Solution**:
1. Click Settings in popup
2. Enter API key: `AIzaSyC3KNHIKKXGYhnjtmJ9o2FYTTLWZ6pXRj8`
3. Click Save
4. Reload extension

### Quiz Not Detected
**Error**: "No Quiz Detected" when clicking Detect Quiz

**Solution**:
1. Make sure you're on a quiz website
2. Check browser console for errors (F12)
3. Try a different quiz website
4. Verify content script is loaded

---

## File Structure

```
mcqsAi_extension/
├── manifest.json              ← Extension config
├── src/
│   ├── background.js          ← Service worker
│   ├── content.js             ← Content script
│   ├── popup.html             ← Popup UI
│   ├── popup.js               ← Popup logic
│   ├── api/
│   │   ├── gemini-client.js
│   │   ├── rate-limiter.js
│   │   └── request-queue.js
│   ├── caching/
│   │   ├── cache-system.js
│   │   └── hash-utils.js
│   ├── answer/
│   │   └── retriever.js
│   ├── detection/
│   │   ├── structural-scanner.js
│   │   ├── pattern-matcher.js
│   │   ├── context-analyzer.js
│   │   └── scorer.js
│   ├── performance/
│   │   ├── adaptive.js
│   │   └── mobile-optimizer.js
│   ├── ui/
│   │   ├── answer-display.js
│   │   ├── explanation-manager.js
│   │   └── styles.css
│   ├── learning/
│   │   ├── user-training.js
│   │   └── pattern-priority-detector.js
│   └── workers/
│       └── detector.worker.js
├── testing/                   ← All test files
│   ├── test-*.js
│   ├── validate-*.js
│   └── run-tests-*.js
└── docs/                      ← Documentation
```

---

## Next Steps

1. ✅ Extension files created
2. ✅ API key configured
3. Load extension in Chrome
4. Test on quiz websites
5. Monitor performance
6. Deploy to Chrome Web Store (optional)

---

## API Key Information

- **Key**: `AIzaSyC3KNHIKKXGYhnjtmJ9o2FYTTLWZ6pXRj8`
- **Model**: Gemini 2.5 Flash
- **Limits**: 15 req/min, 1500 req/day
- **Status**: ✅ Active and tested

---

## Support

For issues:
1. Check browser console (F12)
2. Run validation tests: `node testing/test-api-key.js`
3. Verify manifest.json is valid
4. Check API key is set in settings

---

**Ready to use!** 🚀
