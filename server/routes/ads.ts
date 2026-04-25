import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '../db.js';
import { siteSettings } from '../../shared/schema.js';
import { ADS_CONFIG_KEY, DEFAULT_ADS_CONFIG, type AdsConfig } from '../../shared/types.js';

const router = Router();

const slotSchema = z.object({
  enabled: z.boolean(),
  html: z.string().max(20_000),
});

export const adsConfigSchema = z.object({
  enabled: z.boolean(),
  antiAdblockEnabled: z.boolean(),
  headHtml: z.string().max(20_000),
  bodyHtml: z.string().max(20_000),
  slots: z.object({
    sidebar: slotSchema,
    banner: slotSchema,
  }),
  smartLink: z.object({
    enabled: z.boolean(),
    url: z.string().max(2000).refine(
      (v) => v === '' || /^https?:\/\//i.test(v),
      { message: 'URL must start with http:// or https://' },
    ),
  }),
});

export async function readAdsConfig(): Promise<AdsConfig> {
  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, ADS_CONFIG_KEY))
      .limit(1);
    if (!row || !row.value) return DEFAULT_ADS_CONFIG;
    const parsed = adsConfigSchema.safeParse(JSON.parse(row.value));
    return parsed.success ? parsed.data : DEFAULT_ADS_CONFIG;
  } catch {
    return DEFAULT_ADS_CONFIG;
  }
}

router.get('/config', async (_req, res) => {
  const cfg = await readAdsConfig();
  res.json({ success: true, data: cfg });
});

export default router;
