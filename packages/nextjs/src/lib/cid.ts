/**
 * Click ID (cid) generation utilities
 */

const BASE62_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Generate a random base62 string of given length
 */
function randomBase62(length: number): string {
  let result = '';
  const crypto = require('crypto');
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += BASE62_ALPHABET[bytes[i] % 62];
  }
  return result;
}

/**
 * Generate a new click ID (cid)
 * Returns a 10-character base62 string
 */
export function generateCid(): string {
  return randomBase62(10);
}

/**
 * Validate that a string is a valid cid format
 */
export function isValidCid(cid: string): boolean {
  if (!cid || cid.length !== 10) {
    return false;
  }
  return /^[0-9A-Za-z]{10}$/.test(cid);
}
