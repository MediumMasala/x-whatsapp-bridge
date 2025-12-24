/**
 * Database utilities
 * Uses PostgreSQL if DATABASE_URL is set, otherwise in-memory storage
 */

import type { ClickRecord } from './types';

interface Database {
  insertClick(click: Omit<ClickRecord, 'id'>): Promise<void>;
  getClickByCid(cid: string): Promise<ClickRecord | null>;
}

// In-memory storage (for when no DATABASE_URL is set)
const memoryStore: Map<string, ClickRecord> = new Map();
let memoryIdCounter = 1;

class InMemoryDatabase implements Database {
  async insertClick(click: Omit<ClickRecord, 'id'>): Promise<void> {
    const record: ClickRecord = { ...click, id: memoryIdCounter++ };
    memoryStore.set(click.cid, record);
  }

  async getClickByCid(cid: string): Promise<ClickRecord | null> {
    return memoryStore.get(cid) || null;
  }
}

class PostgresDatabase implements Database {
  private connectionString: string;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
  }

  private async getPool() {
    const { Pool } = await import('pg');
    return new Pool({
      connectionString: this.connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }

  async insertClick(click: Omit<ClickRecord, 'id'>): Promise<void> {
    const pool = await this.getPool();
    try {
      // Create table if not exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS clicks (
          id SERIAL PRIMARY KEY,
          cid VARCHAR(10) UNIQUE NOT NULL,
          slug VARCHAR(100) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          twclid VARCHAR(100),
          utm_source VARCHAR(200),
          utm_medium VARCHAR(200),
          utm_campaign VARCHAR(200),
          utm_content VARCHAR(200),
          user_agent TEXT,
          referer TEXT,
          ip_hash VARCHAR(64)
        )
      `);

      await pool.query(
        `INSERT INTO clicks (cid, slug, created_at, twclid, utm_source, utm_medium, utm_campaign, utm_content, user_agent, referer, ip_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          click.cid,
          click.slug,
          click.created_at,
          click.twclid || null,
          click.utm_source || null,
          click.utm_medium || null,
          click.utm_campaign || null,
          click.utm_content || null,
          click.user_agent || null,
          click.referer || null,
          click.ip_hash || null,
        ]
      );
    } finally {
      await pool.end();
    }
  }

  async getClickByCid(cid: string): Promise<ClickRecord | null> {
    const pool = await this.getPool();
    try {
      const result = await pool.query('SELECT * FROM clicks WHERE cid = $1', [cid]);
      return result.rows[0] || null;
    } finally {
      await pool.end();
    }
  }
}

let dbInstance: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    console.log('Using PostgreSQL database');
    dbInstance = new PostgresDatabase(databaseUrl);
  } else {
    console.log('Using in-memory database (no DATABASE_URL set)');
    dbInstance = new InMemoryDatabase();
  }

  return dbInstance;
}

export function createClickRecord(
  cid: string,
  slug: string,
  params: {
    twclid?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    user_agent?: string;
    referer?: string;
    ip_hash?: string;
  }
): Omit<ClickRecord, 'id'> {
  return {
    cid,
    slug,
    created_at: new Date().toISOString(),
    twclid: params.twclid || null,
    utm_source: params.utm_source || null,
    utm_medium: params.utm_medium || null,
    utm_campaign: params.utm_campaign || null,
    utm_content: params.utm_content || null,
    user_agent: params.user_agent || null,
    referer: params.referer || null,
    ip_hash: params.ip_hash || null,
  };
}
