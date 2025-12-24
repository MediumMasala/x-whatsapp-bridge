/**
 * Tests for database utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClickRecord, getDatabase, closeDatabase } from '../database';

// Set test environment to use in-memory database
process.env.NODE_ENV = 'test';

describe('createClickRecord', () => {
  it('should create a click record with all fields', () => {
    const record = createClickRecord('ABC123DEF0', 'pune', {
      twclid: 'tw_click_123',
      utm_source: 'twitter',
      utm_medium: 'paid',
      utm_campaign: 'pune-launch',
      utm_content: 'ad1',
      user_agent: 'Mozilla/5.0',
      referer: 'https://twitter.com',
      ip_hash: 'abc123hash',
    });

    expect(record.cid).toBe('ABC123DEF0');
    expect(record.slug).toBe('pune');
    expect(record.twclid).toBe('tw_click_123');
    expect(record.utm_source).toBe('twitter');
    expect(record.utm_medium).toBe('paid');
    expect(record.utm_campaign).toBe('pune-launch');
    expect(record.utm_content).toBe('ad1');
    expect(record.user_agent).toBe('Mozilla/5.0');
    expect(record.referer).toBe('https://twitter.com');
    expect(record.ip_hash).toBe('abc123hash');
    expect(record.created_at).toBeDefined();
  });

  it('should create a click record with minimal fields', () => {
    const record = createClickRecord('XYZ789ABC1', 'default', {});

    expect(record.cid).toBe('XYZ789ABC1');
    expect(record.slug).toBe('default');
    expect(record.twclid).toBeNull();
    expect(record.utm_source).toBeNull();
    expect(record.created_at).toBeDefined();
  });

  it('should generate valid ISO timestamp', () => {
    const record = createClickRecord('ABC123DEF0', 'test', {});
    const timestamp = new Date(record.created_at);

    expect(timestamp).toBeInstanceOf(Date);
    expect(timestamp.getTime()).not.toBeNaN();
  });
});

describe('database operations', () => {
  beforeEach(async () => {
    // Reset database for each test
    await closeDatabase();
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('should initialize database', async () => {
    const db = await getDatabase();
    expect(db).toBeDefined();
  });

  it('should insert and retrieve click record', async () => {
    const db = await getDatabase();

    const record = createClickRecord('TEST123456', 'pune', {
      twclid: 'twclid_test',
      utm_source: 'test',
    });

    await db.insertClick(record);

    const retrieved = await db.getClickByCid('TEST123456');

    expect(retrieved).not.toBeNull();
    expect(retrieved!.cid).toBe('TEST123456');
    expect(retrieved!.slug).toBe('pune');
    expect(retrieved!.twclid).toBe('twclid_test');
    expect(retrieved!.utm_source).toBe('test');
  });

  it('should return null for non-existent cid', async () => {
    const db = await getDatabase();

    const retrieved = await db.getClickByCid('NONEXISTENT');

    expect(retrieved).toBeNull();
  });

  it('should handle multiple inserts', async () => {
    const db = await getDatabase();

    await db.insertClick(createClickRecord('CLICK00001', 'pune', {}));
    await db.insertClick(createClickRecord('CLICK00002', 'chennai', {}));
    await db.insertClick(createClickRecord('CLICK00003', 'default', {}));

    const click1 = await db.getClickByCid('CLICK00001');
    const click2 = await db.getClickByCid('CLICK00002');
    const click3 = await db.getClickByCid('CLICK00003');

    expect(click1!.slug).toBe('pune');
    expect(click2!.slug).toBe('chennai');
    expect(click3!.slug).toBe('default');
  });
});
