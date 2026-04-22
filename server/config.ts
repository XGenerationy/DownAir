import 'dotenv/config';
import { z } from 'zod';

const ConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_NAME: z.string().default('DownAir'),
  APP_URL: z.string().url().default('http://localhost:5173'),
  APP_PORT: z.coerce.number().int().positive().max(65535).default(3001),
  DATABASE_URL: z.string().min(1).optional(),
  JWT_SECRET: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),
  HMAC_SECRET: z.string().optional(),
  SETUP_COMPLETED: z.enum(['true', 'false']).default('false'),
  DB_SSL: z.enum(['true', 'false']).default('false'),
  YT_DLP_PATH: z.string().default('yt-dlp'),
  COOKIE_DOMAIN: z.string().optional(),
});

const parsed = ConfigSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('[config] Invalid environment:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

const env = parsed.data;
const setupDone = env.SETUP_COMPLETED === 'true';

if (setupDone) {
  const missing: string[] = [];
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) missing.push('JWT_SECRET');
  if (!env.ENCRYPTION_KEY || env.ENCRYPTION_KEY.length < 32) missing.push('ENCRYPTION_KEY');
  if (!env.HMAC_SECRET || env.HMAC_SECRET.length < 32) missing.push('HMAC_SECRET');
  if (!env.DATABASE_URL) missing.push('DATABASE_URL');
  if (missing.length) {
    throw new Error(`Setup is marked complete but these secrets are missing/too short: ${missing.join(', ')}`);
  }
}

export const config = {
  ...env,
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  setupDone,
};

export function requireSecrets(): { jwt: string; encryption: string; hmac: string } {
  if (!env.JWT_SECRET || !env.ENCRYPTION_KEY || !env.HMAC_SECRET) {
    throw new Error('Secrets not configured — run the setup wizard');
  }
  return { jwt: env.JWT_SECRET, encryption: env.ENCRYPTION_KEY, hmac: env.HMAC_SECRET };
}

export function refreshSecretsFromEnv(): void {
  // Called after setup wizard completes to pick up newly generated secrets.
  env.JWT_SECRET = process.env.JWT_SECRET || env.JWT_SECRET;
  env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || env.ENCRYPTION_KEY;
  env.HMAC_SECRET = process.env.HMAC_SECRET || env.HMAC_SECRET;
  env.DATABASE_URL = process.env.DATABASE_URL || env.DATABASE_URL;
  config.setupDone = process.env.SETUP_COMPLETED === 'true';
}


