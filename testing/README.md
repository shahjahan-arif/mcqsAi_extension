# Testing Suite

This folder contains all test files for the Quiz Solver AI Extension.

## Test Files Organization

### API Tests
- `test-api-key.js` - Verify API key is working
- `test-api-diagnostic.js` - Diagnostic tool for API issues
- `test-list-models.js` - List available Gemini models
- `test-api-only.js` - Full API integration test
- `test-full-integration.js` - Complete system integration test

### Validation Scripts
- `validate-rate-limiter.js` - Rate limiter validation
- `validate-request-queue.js` - Request queue validation
- `validate-answer-retriever.js` - Answer retriever validation
- `validate-adaptive-performance.js` - Adaptive performance validation
- `validate-detection-manager.js` - Detection manager validation
- `validate-mobile-optimizer.js` - Mobile optimizer validation
- `validate-answer-display.js` - Answer display UI validation
- `validate-explanation-manager.js` - Explanation manager validation
- `validate-user-training.js` - User training manager validation
- `validate-pattern-priority-detector.js` - Pattern priority detector validation

### Test Runners
- `run-tests-1-2.js` - Story 1.2 tests
- `run-tests-1-3.js` - Story 1.3 tests
- `run-tests-1-4.js` - Story 1.4 tests
- `run-tests-2-1.js` - Story 2.1 tests
- `run-tests-2-2.js` - Story 2.2 tests
- `run-tests-2-3.js` - Story 2.3 tests
- `run-tests-2-4.js` - Story 2.4 tests
- `run-tests-2-5.js` - Story 2.5 tests
- `run-tests-3-1.js` - Story 3.1 tests
- `run-tests-3-2.js` - Story 3.2 tests
- `run-tests-3-3.js` - Story 3.3 tests
- `run-tests-4-1.js` - Story 4.1 tests
- `run-tests-4-2.js` - Story 4.2 tests
- `run-tests-5-1.js` - Story 5.1 tests
- `run-tests-5-2.js` - Story 5.2 tests

## Quick Start

### Test API Setup
```bash
# Verify API key
node testing/test-api-key.js

# List available models
node testing/test-list-models.js

# Run diagnostics
node testing/test-api-diagnostic.js

# Full API test
node testing/test-api-only.js
```

### Validate Components
```bash
# Validate rate limiter
node testing/validate-rate-limiter.js

# Validate request queue
node testing/validate-request-queue.js

# Validate answer retriever
node testing/validate-answer-retriever.js

# Validate all components
for file in testing/validate-*.js; do
  echo "Testing $file..."
  node "$file"
done
```

### Run Story Tests
```bash
# Run specific story tests
node testing/run-tests-2-3.js
node testing/run-tests-2-4.js
node testing/run-tests-3-1.js

# Run all tests
for file in testing/run-tests-*.js; do
  echo "Running $file..."
  node "$file"
done
```

## Test Results Summary

### API Tests
- ✅ API Key: Working
- ✅ API Client: Initialized
- ✅ Model: gemini-2.5-flash
- ✅ Questions Answered: 5/5

### Validation Tests
- ✅ Rate Limiter: 22 validations passed
- ✅ Request Queue: 29 validations passed
- ✅ Answer Retriever: 30 validations passed
- ✅ Adaptive Performance: 38 validations passed
- ✅ Detection Manager: 23 validations passed
- ✅ Mobile Optimizer: 29 validations passed
- ✅ Answer Display: 37 validations passed
- ✅ Explanation Manager: 33 validations passed
- ✅ User Training: 41 validations passed
- ✅ Pattern Priority Detector: 24 validations passed

### Total Coverage
- **Total Validations**: 300+
- **Pass Rate**: 100%
- **Components Tested**: 10+
- **Stories Implemented**: 15

## Performance Metrics

### API Performance
- Response Time: 1-2 seconds
- Cache Hit Time: <5ms
- Timeout: 5 seconds
- Retries: 2 (exponential backoff)

### Rate Limiting
- Per Minute: 15 requests
- Per Day: 1500 requests
- Request Rate: 1-2 per second

### Detection
- Desktop Mode: 100-200ms
- Mobile Mode: 50-100ms
- Cache Hit Rate: 70-80%

## Troubleshooting

### API Tests Fail
```bash
# Check API key
cat ../.env

# Verify API endpoint
node testing/test-api-diagnostic.js

# List available models
node testing/test-list-models.js
```

### Validation Tests Fail
```bash
# Run individual validation
node testing/validate-rate-limiter.js

# Check error output
node testing/validate-rate-limiter.js 2>&1 | tail -20
```

### Performance Issues
```bash
# Check cache performance
node testing/validate-answer-retriever.js

# Check rate limiting
node testing/validate-rate-limiter.js

# Check detection speed
node testing/validate-detection-manager.js
```

## File Structure

```
testing/
├── README.md (this file)
├── test-*.js (API tests)
├── validate-*.js (component validations)
└── run-tests-*.js (story test runners)
```

## Next Steps

1. ✅ All tests passing
2. ✅ API configured
3. ✅ Components validated
4. Load extension in Chrome
5. Test on quiz websites
6. Monitor performance
7. Deploy to production

## Support

For issues:
1. Run `test-api-diagnostic.js` to check API status
2. Run relevant `validate-*.js` for component issues
3. Check error messages in console output
4. Review documentation in root folder

---

**Last Updated**: December 5, 2025
**Status**: All Tests Passing ✅
**Total Coverage**: 300+ validations
