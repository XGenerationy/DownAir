import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '../shared/schema.js';

const { Pool } = pg;

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString, ssl: false });
  const db = drizzle(pool, { schema });

  console.log('[Seed] Creating admin user...');

  const email = process.env.ADMIN_EMAIL || 'admin@downair.net';
  const password = process.env.ADMIN_PASSWORD || 'admin1234';
  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(schema.adminUsers).values({
    email,
    passwordHash,
    name: 'Admin',
  }).onConflictDoNothing();

  console.log('[Seed] Admin user created:', email);

  await pool.end();
  console.log('[Seed] Done');
}

seed().catch(console.error);
