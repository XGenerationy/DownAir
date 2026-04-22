import { Router } from 'express';
import { z } from 'zod';
import { and, eq, count } from 'drizzle-orm';
import { getDb } from '../db.js';
import { isValidUrl, detectPlatform } from '../utils/platform.js';
import { analyzeMedia, streamDownload } from '../utils/media.js';
import { createDownloadToken, verifyDownloadToken } from '../utils/token.js';
import { assertSafeStreamUrl } from '../utils/ssrf.js';
import { downloads, downloadTokens } from '../../shared/schema.js';
import type { ApiResponse, MediaAnalysis } from '../../shared/types.js';
import { analyzeLimiter, publicWriteLimiter } from '../middleware/rateLimit.js';

const router = Router();

const analyzeSchema = z.object({
  url: z.string().url().max(2048).refine(isValidUrl, { message: 'Invalid URL provided' }),
});

const createDownloadSchema = z.object({
  url: z.string().url().max(2048).refine(isValidUrl, { message: 'Invalid URL provided' }),
  formatId: z.string().min(1).max(100),
  quality: z.string().max(50).optional(),
});

const tokenParamSchema = z.object({ token: z.string().min(10).max(2048) });

router.post('/analyze', analyzeLimiter, async (req, res) => {
  try {
    const { url } = analyzeSchema.parse(req.body);
    const analysis = await analyzeMedia(url);

    const db = getDb();
    const [download] = await db.insert(downloads).values({
      url,
      platform: analysis.platform,
      mediaType: analysis.mediaType,
      title: analysis.title?.slice(0, 2048),
      thumbnail: analysis.thumbnail?.slice(0, 2048),
      duration: analysis.duration,
      status: 'analyzed',
    }).returning();

    const response: ApiResponse<{ analysis: MediaAnalysis & { url: string }; downloadId: number }> = {
      success: true,
      data: { analysis: { ...analysis, url }, downloadId: download.id },
    };
    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    // eslint-disable-next-line no-console
    console.error('[download/analyze]', error);
    res.status(500).json({ success: false, error: 'Failed to analyze media' });
  }
});

router.post('/create', publicWriteLimiter, async (req, res) => {
  try {
    const { url, formatId, quality } = createDownloadSchema.parse(req.body);

    const db = getDb();
    const platform = detectPlatform(url);

    const [dl] = await db.insert(downloads).values({
      url,
      platform,
      mediaType: 'video',
      format: formatId,
      quality: quality || 'unknown',
      status: 'pending',
    }).returning();

    const token = createDownloadToken(dl.id, url, formatId);

    await db.update(downloads).set({ token, status: 'token_created' }).where(eq(downloads.id, dl.id));

    await db.insert(downloadTokens).values({
      token,
      downloadId: dl.id,
      sourceUrl: url,
      format: formatId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    res.json({ success: true, data: { token, downloadId: dl.id } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    // eslint-disable-next-line no-console
    console.error('[download/create]', error);
    res.status(500).json({ success: false, error: 'Failed to create download' });
  }
});

router.get('/proxy/:token', async (req, res) => {
  try {
    const { token } = tokenParamSchema.parse(req.params);
    const tokenData = verifyDownloadToken(token);
    if (!tokenData) {
      res.status(403).json({ success: false, error: 'Invalid or expired download token' });
      return;
    }

    const db = getDb();

    // Atomic single-use claim — prevents TOCTOU (F-09).
    const claimed = await db
      .update(downloadTokens)
      .set({ isUsed: true })
      .where(and(eq(downloadTokens.token, token), eq(downloadTokens.isUsed, false)))
      .returning();

    if (claimed.length === 0) {
      res.status(410).json({ success: false, error: 'Token already used or expired' });
      return;
    }

    const [tokenRecord] = claimed;

    const result = await streamDownload(tokenData.sourceUrl, tokenData.format);

    let safeUrl: URL;
    try {
      safeUrl = assertSafeStreamUrl(result.streamPath);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[download/proxy] ssrf guard blocked:', err);
      res.status(502).json({ success: false, error: 'Upstream URL not allowed' });
      return;
    }

    const upstream = await fetch(safeUrl.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!upstream.ok || !upstream.body) {
      res.status(502).json({ success: false, error: 'Upstream fetch failed' });
      return;
    }

    if (tokenRecord?.downloadId) {
      await db.update(downloads).set({ status: 'completed' }).where(eq(downloads.id, tokenRecord.downloadId));
    }

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);

    const reader = upstream.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const ok = res.write(Buffer.from(value));
      if (!ok) await new Promise<void>((r) => res.once('drain', r));
    }
    res.end();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0].message });
      return;
    }
    // eslint-disable-next-line no-console
    console.error('[download/proxy]', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Download failed' });
    } else {
      res.end();
    }
  }
});

let statsCache: { at: number; payload: { total: number; platforms: Record<string, number> } } | null = null;

router.get('/stats', async (_req, res) => {
  try {
    if (statsCache && Date.now() - statsCache.at < 60_000) {
      res.json({ success: true, data: statsCache.payload });
      return;
    }
    const db = getDb();
    const [{ total }] = await db.select({ total: count() }).from(downloads);
    const platformRows = await db
      .select({ platform: downloads.platform, c: count() })
      .from(downloads)
      .groupBy(downloads.platform);
    const platforms = Object.fromEntries(platformRows.map((r) => [r.platform, Number(r.c)]));
    statsCache = { at: Date.now(), payload: { total: Number(total), platforms } };
    res.json({ success: true, data: statsCache.payload });
  } catch {
    res.json({ success: true, data: { total: 0, platforms: {} } });
  }
});

export default router;
