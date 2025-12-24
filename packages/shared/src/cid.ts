/**
 * Click ID (cid) generation utilities
 * Uses nanoid for short, URL-safe unique identifiers
 */

import { nanoid, customAlphabet } from 'nanoid';

// Base62 alphabet for URL-safe, compact IDs
const BASE62_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// Custom generator with base62 alphabet, 10 characters long
// 10 chars of base62 gives us ~62^10 = 8.4e17 combinations (very collision resistant)
const generateBase62 = customAlphabet(BASE62_ALPHABET, 10);

/**
 * Generate a new click ID (cid)
 * Returns a 10-character base62 string
 */
export function generateCid(): string {
  return generateBase62();
}

/**
 * Validate that a string is a valid cid format
 * Must be 10 characters, all base62
 */
export function isValidCid(cid: string): boolean {
  if (!cid || cid.length !== 10) {
    return false;
  }
  return /^[0-9A-Za-z]{10}$/.test(cid);
}

/**
 * Generate a cid with optional prefix for debugging
 * Useful for testing or when you want identifiable cids
 */
export function generateCidWithPrefix(prefix: string): string {
  const suffix = customAlphabet(BASE62_ALPHABET, 10 - Math.min(prefix.length, 3))();
  return (prefix.slice(0, 3) + suffix).slice(0, 10);
}
