/**
 * Tests for CID generation utilities
 */

import { describe, it, expect } from 'vitest';
import { generateCid, isValidCid, generateCidWithPrefix } from '../cid';

describe('generateCid', () => {
  it('should generate a 10-character string', () => {
    const cid = generateCid();
    expect(cid).toHaveLength(10);
  });

  it('should generate base62 characters only', () => {
    const cid = generateCid();
    expect(cid).toMatch(/^[0-9A-Za-z]+$/);
  });

  it('should generate unique values', () => {
    const cids = new Set();
    for (let i = 0; i < 1000; i++) {
      cids.add(generateCid());
    }
    // All 1000 should be unique
    expect(cids.size).toBe(1000);
  });
});

describe('isValidCid', () => {
  it('should return true for valid cids', () => {
    expect(isValidCid('ABC123DEF0')).toBe(true);
    expect(isValidCid('0123456789')).toBe(true);
    expect(isValidCid('abcdefghij')).toBe(true);
    expect(isValidCid('ABCDEFGHIJ')).toBe(true);
  });

  it('should return false for invalid cids', () => {
    expect(isValidCid('')).toBe(false);
    expect(isValidCid('short')).toBe(false);
    expect(isValidCid('toolongstring')).toBe(false);
    expect(isValidCid('ABC-123-45')).toBe(false); // Contains hyphen
    expect(isValidCid('ABC_123_45')).toBe(false); // Contains underscore
  });

  it('should return false for null/undefined', () => {
    expect(isValidCid(null as any)).toBe(false);
    expect(isValidCid(undefined as any)).toBe(false);
  });
});

describe('generateCidWithPrefix', () => {
  it('should generate a cid starting with the prefix', () => {
    const cid = generateCidWithPrefix('TST');
    expect(cid).toHaveLength(10);
    expect(cid.startsWith('TST')).toBe(true);
  });

  it('should truncate long prefixes', () => {
    const cid = generateCidWithPrefix('TOOLONG');
    expect(cid).toHaveLength(10);
    expect(cid.startsWith('TOO')).toBe(true);
  });

  it('should generate valid cids', () => {
    const cid = generateCidWithPrefix('X');
    expect(isValidCid(cid)).toBe(true);
  });
});
