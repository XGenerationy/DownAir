import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '../shared/schema.js';

const { Pool } = pg;

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb(databaseUrl?: string) {
  if (dbInstance) return dbInstance;

  const connectionString = databaseUrl || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured. Run setup wizard first.');
  }

  const pool = new Pool({ connectionString, ssl: false });
  dbInstance = drizzle(pool, { schema });
  return dbInstance;
}

export async function testConnection(databaseUrl: string): Promise<boolean> {
  try {
    const pool = new pg.Pool({ connectionString: databaseUrl, ssl: false });
    const client = await pool.connect();
    client.release();
    await pool.end();
    return true;
  } catch {
    return false;
  }
}
