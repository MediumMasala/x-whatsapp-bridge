/**
 * Database abstraction layer
 * Supports SQLite for local development and PostgreSQL for production
 * Uses DATABASE_URL env var to determine which to use
 */

import type { ClickRecord } from './types';
import { getEnvConfig } from './config';

/** Database interface that both SQLite and Postgres implementations follow */
export interface Database {
  init(): Promise<void>;
  insertClick(click: Omit<ClickRecord, 'id'>): Promise<void>;
  getClickByCid(cid: string): Promise<ClickRecord | null>;
  close(): Promise<void>;
}

/** SQL schema for the clicks table */
const CREATE_TABLE_SQLITE = `
  CREATE TABLE IF NOT EXISTS clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cid TEXT UNIQUE NOT NULL,
    slug TEXT NOT NULL,
    created_at TEXT NOT NULL,
    twclid TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    user_agent TEXT,
    referer TEXT,
    ip_hash TEXT
  )
`;

const CREATE_TABLE_POSTGRES = `
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
`;

const CREATE_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_clicks_created_at ON clicks(created_at)
`;

/** SQLite implementation using better-sqlite3 */
class SqliteDatabase implements Database {
  private db: import('better-sqlite3').Database | null = null;
  private dbPath: string;

  constructor(dbPath: string = './data/clicks.db') {
    this.dbPath = dbPath;
  }

  async init(): Promise<void> {
    // Dynamic import to avoid bundling issues
    const Database = (await import('better-sqlite3')).default;
    const path = await import('path');
    const fs = await import('fs');

    // Ensure data directory exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(this.dbPath);
    this.db.exec(CREATE_TABLE_SQLITE);
    this.db.exec(CREATE_INDEX);
  }

  async insertClick(click: Omit<ClickRecord, 'id'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT INTO clicks (cid, slug, created_at, twclid, utm_source, utm_medium, utm_campaign, utm_content, user_agent, referer, ip_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
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
      click.ip_hash || null
    );
  }

  async getClickByCid(cid: string): Promise<ClickRecord | null> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM clicks WHERE cid = ?');
    const row = stmt.get(cid) as ClickRecord | undefined;
    return row || null;
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

/** PostgreSQL implementation using pg */
class PostgresDatabase implements Database {
  private pool: import('pg').Pool | null = null;
  private connectionString: string;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
  }

  async init(): Promise<void> {
    const { Pool } = await import('pg');
    this.pool = new Pool({
      connectionString: this.connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    const client = await this.pool.connect();
    try {
      await client.query(CREATE_TABLE_POSTGRES);
      await client.query(CREATE_INDEX);
    } finally {
      client.release();
    }
  }

  async insertClick(click: Omit<ClickRecord, 'id'>): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized');

    await this.pool.query(
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
  }

  async getClickByCid(cid: string): Promise<ClickRecord | null> {
    if (!this.pool) throw new Error('Database not initialized');

    const result = await this.pool.query('SELECT * FROM clicks WHERE cid = $1', [cid]);
    return result.rows[0] || null;
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

/** In-memory database for testing */
class InMemoryDatabase implements Database {
  private clicks: Map<string, ClickRecord> = new Map();
  private idCounter = 1;

  async init(): Promise<void> {
    // Nothing to initialize
  }

  async insertClick(click: Omit<ClickRecord, 'id'>): Promise<void> {
    const record: ClickRecord = { ...click, id: this.idCounter++ };
    this.clicks.set(click.cid, record);
  }

  async getClickByCid(cid: string): Promise<ClickRecord | null> {
    return this.clicks.get(cid) || null;
  }

  async close(): Promise<void> {
    this.clicks.clear();
  }
}

/** Singleton database instance */
let dbInstance: Database | null = null;

/**
 * Get or create the database instance
 * Uses DATABASE_URL to determine PostgreSQL vs SQLite
 */
export async function getDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const config = getEnvConfig();

  if (config.DATABASE_URL) {
    // Production: use PostgreSQL
    console.log('Using PostgreSQL database');
    dbInstance = new PostgresDatabase(config.DATABASE_URL);
  } else if (process.env.NODE_ENV === 'test') {
    // Testing: use in-memory database
    console.log('Using in-memory database for testing');
    dbInstance = new InMemoryDatabase();
  } else {
    // Development: use SQLite
    console.log('Using SQLite database (./data/clicks.db)');
    dbInstance = new SqliteDatabase();
  }

  await dbInstance.init();
  return dbInstance;
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Create a click record with all required fields
 */
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
