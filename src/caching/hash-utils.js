/**
 * Hash Utilities for Caching System
 * Generates consistent hashes for question text lookup
 */

/**
 * Generates SHA-256 hash of question text
 * Used as primary key for cache lookups
 * 
 * @param {string} questionText - The question text to hash
 * @returns {Promise<string>} Hexadecimal hash string
 */
export async function generateHash(questionText) {
  if (!questionText || typeof questionText !== 'string') {
    throw new Error('Question text must be a non-empty string');
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(questionText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Error generating hash:', error);
    throw error;
  }
}

/**
 * Validates a hash string
 * 
 * @param {string} hash - The hash to validate
 * @returns {boolean} True if valid SHA-256 hash format
 */
export function validateHash(hash) {
  if (!hash || typeof hash !== 'string') {
    return false;
  }
  // SHA-256 produces 64 character hexadecimal string
  return /^[0-9a-f]{64}$/.test(hash);
}
