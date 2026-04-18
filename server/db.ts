import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '../shared/schema.js';
import { config } from './config.js';

const { Pool } = pg;

let dbInstance: ReturnType<typeof drizzle> | null = null;
let currentUrl: string | null = null;
let currentPool: pg.Pool | null = null;

function sslConfig(): pg.PoolConfig['ssl'] {
  return config.DB_SSL === 'true' ? { rejectUnauthorized: true } : false;
}

export function getDb(databaseUrl?: string) {
  const connectionString = databaseUrl || config.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured. Run setup wizard first.');
  }
  if (dbInstance && currentUrl === connectionString) return dbInstance;
  if (currentPool) {
    currentPool.end().catch(() => {});
  }
  const pool = new Pool({ connectionString, ssl: sslConfig(), max: 20, idleTimeoutMillis: 30_000 });
  currentPool = pool;
  currentUrl = connectionString;
  dbInstance = drizzle(pool, { schema });
  return dbInstance;
}

export async function testConnection(databaseUrl: string): Promise<boolean> {
  const pool = new pg.Pool({ connectionString: databaseUrl, ssl: sslConfig() });
  try {
    const client = await pool.connect();
    client.release();
    return true;
  } catch {
    return false;
  } finally {
    await pool.end().catch(() => {});
  }
}
