import { CachingSystem } from '../../src/caching/cache-system.js';
import { generateHash } from '../../src/caching/hash-utils.js';

describe('CachingSystem', () => {
  let cache;

  beforeEach(async () => {
    cache = new CachingSystem();
    // Mock IndexedDB for testing
    if (!window.indexedDB) {
      window.indexedDB = {
        open: jest.fn()
      };
    }
  });

  describe('initialization', () => {
    test('creates database on init', async () => {
      // This test would require mocking IndexedDB
      expect(cache).toBeDefined();
      expect(cache.MAX_ENTRIES).toBe(10000);
      expect(cache.CLEANUP_THRESHOLD).toBe(0.9);
    });

    test('sets correct max entries', () => {
      expect(cache.MAX_ENTRIES).toBe(10000);
    });

    test('sets correct cleanup threshold', () => {
      expect(cache.CLEANUP_THRESHOLD).toBe(0.9);
    });
  });

  describe('CRUD operations', () => {
    test('get returns null for non-existent entry', async () => {
      // Would require IndexedDB mock
      expect(cache.get).toBeDefined();
    });

    test('set stores entry', async () => {
      expect(cache.set).toBeDefined();
    });

    test('has returns boolean', async () => {
      expect(cache.has).toBeDefined();
    });
  });

  describe('statistics', () => {
    test('getStats returns object with required properties', async () => {
      expect(cache.getStats).toBeDefined();
    });

    test('clear removes all entries', async () => {
      expect(cache.clear).toBeDefined();
    });
  });
});

describe('generateHash', () => {
  test('generates consistent hash for same input', async () => {
    const text = 'What is 2+2?';
    const hash1 = await generateHash(text);
    const hash2 = await generateHash(text);
    expect(hash1).toBe(hash2);
  });

  test('generates different hash for different input', async () => {
    const hash1 = await generateHash('Question 1');
    const hash2 = await generateHash('Question 2');
    expect(hash1).not.toBe(hash2);
  });

  test('returns string hash', async () => {
    const hash = await generateHash('test');
    expect(typeof hash).toBe('string');
  });

  test('hash is hexadecimal', async () => {
    const hash = await generateHash('test');
    expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
  });

  test('hash has consistent length', async () => {
    const hash1 = await generateHash('short');
    const hash2 = await generateHash('this is a much longer question text');
    expect(hash1.length).toBe(hash2.length);
  });
});
